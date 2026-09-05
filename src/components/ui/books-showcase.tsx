'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface BookCfg {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  year: string;
  stars: number;
  rating?: string;
  desc: string;
  href?: string;
  mediaType?: "movie" | "tv";

  // Procedural cover painters. All optional — omit and supply `images` instead, or omit both for a generated placeholder.
  front?: (x: CanvasRenderingContext2D, w: number, h: number) => void;
  back?: (x: CanvasRenderingContext2D, w: number, h: number) => void;
  spine?: (x: CanvasRenderingContext2D, w: number, h: number) => void;

  // Image-based covers (png/webp/jpg/...). Takes priority over painters when present. Hosts without CORS headers fall back to the procedural/generated cover. 
  images?: {
    front?: string;
    back?: string;
    spine?: string;
  };
  /** @deprecated use images.front */
  coverURL?: string | null;

  // Page-edge trim color.
  edge?: string;
  backBg?: string;
  backInk?: string;
  spineBg?: string;
  spineInk?: string;
  spineFont?: string;
  chapters?: string[];
}

export interface BooksShowcaseProps {
  books: BookCfg[];
  heroTitle?: string;
  /** Small heading shown above the books. */
  navTitle?: string;
  showNav?: boolean;
  showDetailPanel?: boolean;
  /** Show prev/next arrows when there are more books than fit on screen (3). Defaults to true. */
  showCarousel?: boolean;
  themeColors?: {
    navy?: string;
    pink?: string;
    cream?: string;
    lav?: string;
    peri?: string;
    /** Backwards-compatible background applied to both color schemes. */
    bg?: string;
    bgLight?: string;
    bgDark?: string;
    foregroundLight?: string;
    foregroundDark?: string;
  };
  className?: string;
  onBookSelect?: (book: BookCfg | null) => void;
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const OPEN_BTN_OFF = ['opacity-0', 'scale-[0.94]'];
const OPEN_BTN_ON = ['opacity-100', 'scale-100'];

export function BooksShowcase({
  books = [],
  heroTitle = 'Books',
  navTitle = 'Bestsellers',
  showNav = true,
  showDetailPanel = true,
  showCarousel = true,
  themeColors,
  className,
  onBookSelect,
}: BooksShowcaseProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const openBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dpRef = useRef<HTMLDivElement | null>(null);
  const shiftCarouselRef = useRef<(dir: 1 | -1) => void>(() => { });

  const onBookSelectRef = useRef(onBookSelect);
  useEffect(() => {
    onBookSelectRef.current = onBookSelect;
  }, [onBookSelect]);

  const [uiMode, setUiMode] = useState<'hero' | 'opening' | 'detail' | 'closing'>('hero');
  const [selectedCfg, setSelectedCfg] = useState<BookCfg | null>(null);
  const [mounted, setMounted] = useState(false);

  // hero-word entrance: flip to `mounted` one frame after first paint so the
  // opacity/translate transition below actually has something to animate from.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvasEl = canvasRef.current;
    if (!root || !canvasEl || books.length === 0) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const setT = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
      return id;
    };

    // Small utilities
    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPowerDevice =
      RM ||
      window.matchMedia('(max-width: 900px)').matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    class Spring {
      v: number;
      t: number;
      vel: number;
      k: number;
      d: number;
      constructor(v: number, k?: number, d?: number) {
        this.v = v;
        this.t = v;
        this.vel = 0;
        this.k = k || 120;
        this.d = d || 14;
      }
      set(v: number) {
        this.v = v;
        this.t = v;
        this.vel = 0;
        return this;
      }
      update(dt: number) {
        const a = this.k * (this.t - this.v) - this.d * this.vel;
        this.vel += a * dt;
        this.v += this.vel * dt;
        return this.v;
      }
    }

    function mkCanvas(w: number, h: number) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }

    function drawSpaced(x: CanvasRenderingContext2D, text: string, cx: number, y: number, ls: number) {
      const prev = x.textAlign;
      x.textAlign = 'left';
      const chars = [...text];
      let tot = 0;
      const ws = chars.map((ch) => {
        const w = x.measureText(ch).width;
        tot += w;
        return w;
      });
      tot += ls * (chars.length - 1);
      let px = cx - tot / 2;
      chars.forEach((ch, i) => {
        x.fillText(ch, px, y);
        px += ws[i] + ls;
      });
      x.textAlign = prev;
    }

    function rr(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number) {
      x.beginPath();
      x.moveTo(px + r, py);
      x.arcTo(px + w, py, px + w, py + h, r);
      x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r);
      x.arcTo(px, py, px + w, py, r);
      x.closePath();
    }

    // Renderer, scene, camera, lights
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: !lowPowerDevice, alpha: true });
    } catch (err) {
      console.warn('BooksShowcase: WebGL renderer creation failed', err);
      const fail = document.createElement('div');
      fail.className =
        'absolute inset-0 z-50 flex items-center justify-center p-10 text-center text-lg leading-relaxed text-[var(--bs-lav)]';
      fail.textContent = 'This experience needs WebGL, which your browser blocked or does not support.';
      root.appendChild(fail);
      return () => {
        fail.remove();
      };
    }

    // container-relative sizing: this is a section, not a full page, so
    // every place that would use innerWidth/innerHeight reads from `dims`.
    const dims = { w: 0, h: 0 };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerDevice ? 1 : 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = !lowPowerDevice;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const ANISO = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 0.1, 9.6);

    function envBlob(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, rgb: string, a: number) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(cx, cy, r, 0, 6.2832);
      x.fill();
    }
    (function buildEnv() {
      const c = mkCanvas(512, 256),
        x = c.getContext('2d')!;
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#5a6ba6');
      g.addColorStop(0.55, '#262e52');
      g.addColorStop(1, '#0a0d1d');
      x.fillStyle = g;
      x.fillRect(0, 0, 512, 256);
      envBlob(x, 140, 66, 95, '255,255,255', 0.95);
      envBlob(x, 405, 84, 55, '255,214,168', 0.55);
      envBlob(x, 256, 150, 120, '255,155,185', 0.28);
      const tx = new THREE.CanvasTexture(c);
      tx.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(tx).texture;
      tx.dispose();
      pmrem.dispose();
    })();

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444d66, 0.65);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(3.5, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const fillLight = new THREE.DirectionalLight(0xdde5ff, 0.45);
    fillLight.position.set(-4, 1, 4);
    scene.add(fillLight);
    const rim = new THREE.DirectionalLight(0xffd580, 0.35);
    rim.position.set(-2, 3, -5);
    scene.add(rim);

    const bookRoot = new THREE.Group();
    scene.add(bookRoot);

    // Shared procedural textures
    function tex(c: HTMLCanvasElement) {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = ANISO;
      return t;
    }

    // Paint a fallback cover immediately, then swap in `imageURL` once it loads (if given). Keeps the fallback forever if there's no URL, or if the load fails / is CORS-blocked. 
    function loadOrPaint(material: THREE.MeshStandardMaterial, imageURL: string | null | undefined, paintFallback: () => HTMLCanvasElement) {
      material.map = tex(paintFallback());
      material.needsUpdate = true;
      if (!imageURL) return;
      new THREE.TextureLoader().setCrossOrigin('anonymous').load(
        imageURL,
        (t) => {
          if (cancelled) return;
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = ANISO;
          material.map = t;
          material.needsUpdate = true;
        },
        undefined,
        () => console.warn('Cover image failed to load, kept fallback cover:', imageURL),
      );
    }

    function noiseTexture(base: number, amp: number, scratches: boolean) {
      const s = 256,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      const img = x.createImageData(s, s),
        d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = base + (Math.random() - 0.5) * 2 * amp;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      if (scratches) {
        x.strokeStyle = 'rgba(200,200,200,.25)';
        x.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          x.beginPath();
          const y = Math.random() * s;
          x.moveTo(0, y);
          x.lineTo(s, y + (Math.random() - 0.5) * 22);
          x.stroke();
        }
      }
      return new THREE.CanvasTexture(c);
    }
    const laminateBump = noiseTexture(128, 10, true);
    const clothBump = (function () {
      const s = 128,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      x.fillStyle = '#808080';
      x.fillRect(0, 0, s, s);
      for (let i = 0; i < s; i += 2) {
        x.fillStyle = i % 4 === 0 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)';
        x.fillRect(i, 0, 1, s);
        x.fillRect(0, i, s, 1);
      }
      return new THREE.CanvasTexture(c);
    })();

    function striationTexture(vertical: boolean) {
      const s = 512,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      x.fillStyle = '#ece4d2';
      x.fillRect(0, 0, s, s);
      let p = 0;
      while (p < s) {
        const w = 1 + Math.random() * 2.4,
          tone = Math.random();
        x.fillStyle =
          tone < 0.12 ? 'rgba(140,125,95,.5)' : tone < 0.5 ? 'rgba(255,255,252,.55)' : 'rgba(190,178,150,.45)';
        if (vertical) x.fillRect(p, 0, w, s);
        else x.fillRect(0, p, s, w);
        p += w + 0.6 + Math.random() * 1.6;
      }
      for (let i = 0; i < 2600; i++) {
        x.fillStyle = 'rgba(120,108,84,' + (Math.random() * 0.1).toFixed(3) + ')';
        x.fillRect(Math.random() * s, Math.random() * s, 1.2, 1.2);
      }
      return tex(c);
    }
    const striV = striationTexture(true);
    const striH = striationTexture(false);

    const endpaperTex = (function () {
      const s = 512,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      x.fillStyle = '#f3edde';
      x.fillRect(0, 0, s, s);
      for (let i = 0; i < 1400; i++) {
        x.fillStyle = 'rgba(120,105,70,' + (0.04 + Math.random() * 0.08).toFixed(3) + ')';
        x.fillRect(Math.random() * s, Math.random() * s, 1.4, 1.4);
      }
      const g = x.createLinearGradient(0, 0, s, 0);
      g.addColorStop(0, 'rgba(0,0,0,.07)');
      g.addColorStop(0.12, 'rgba(0,0,0,0)');
      g.addColorStop(0.88, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.07)');
      x.fillStyle = g;
      x.fillRect(0, 0, s, s);
      return tex(c);
    })();

    const blobTex = (function () {
      const s = 256,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(0,0,0,.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, s, s);
      return new THREE.CanvasTexture(c);
    })();

    // Cover fallbacks (used whenever no image / no custom painter given)
    function paintDefaultFront(x: CanvasRenderingContext2D, w: number, h: number, o: { title: string; author: string; bg: string }) {
      x.fillStyle = o.bg;
      x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 40; i++) x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      x.fillStyle = '#ffffff';
      x.textAlign = 'center';
      x.font = '700 76px Georgia';
      const words = o.title.split(' ');
      let line = '';
      const lines: string[] = [];
      words.forEach((word) => {
        const test = line ? line + ' ' + word : word;
        if (x.measureText(test).width > w * 0.8 && line) {
          lines.push(line);
          line = word;
        } else line = test;
      });
      if (line) lines.push(line);
      const startY = h * 0.42 - ((lines.length - 1) * 88) / 2;
      lines.forEach((l, i) => x.fillText(l, w / 2, startY + i * 88));
      x.globalAlpha = 0.85;
      x.font = 'italic 40px Georgia';
      x.fillText(o.author, w / 2, startY + lines.length * 88 + 60);
      x.globalAlpha = 1;
      x.strokeStyle = 'rgba(255,255,255,0.4)';
      x.lineWidth = 3;
      x.strokeRect(60, 60, w - 120, h - 120);
    }

    function paintBack(x: CanvasRenderingContext2D, w: number, h: number, o: { backBg: string; backInk: string }) {
      x.fillStyle = o.backBg;
      x.fillRect(0, 0, w, h);
      const ink = o.backInk;
      x.fillStyle = 'rgba(' + ink + ',.5)';
      rr(x, 150, 190, w - 460, 28, 14);
      x.fill();
      for (let i = 0; i < 9; i++) {
        const lw = i === 8 ? w - 560 : w - 300 - Math.random() * 180;
        x.fillStyle = 'rgba(' + ink + ',.2)';
        rr(x, 150, 300 + i * 56, lw, 15, 7);
        x.fill();
      }
      x.fillStyle = 'rgba(' + ink + ',.45)';
      x.beginPath();
      x.arc(178, h - 186, 26, 0, 6.2832);
      x.fill();
      x.fillStyle = '#fff';
      rr(x, w - 330, h - 262, 236, 152, 8);
      x.fill();
      x.fillStyle = '#111';
      let bx = w - 310;
      while (bx < w - 118) {
        const bw = 2 + Math.random() * 6;
        if (Math.random() > 0.42) x.fillRect(bx, h - 242, bw, 96);
        bx += bw + 2 + Math.random() * 4;
      }
      x.font = '500 21px Arial';
      x.textAlign = 'center';
      x.fillText('9 781234 567890', w - 212, h - 124);
      x.textAlign = 'left';
    }

    function paintSpine(
      x: CanvasRenderingContext2D,
      w: number,
      h: number,
      o: { spineBg: string; spineInk: string; spineFont: string; title: string; author: string },
    ) {
      x.fillStyle = o.spineBg;
      x.fillRect(0, 0, w, h);
      x.save();
      x.translate(w / 2, h / 2);
      x.rotate(Math.PI / 2);
      x.fillStyle = o.spineInk;
      x.font = o.spineFont;
      drawSpaced(x, o.title.toUpperCase(), -h * 0.1, 15, 6);
      x.globalAlpha = 0.85;
      x.font = '600 25px Arial';
      drawSpaced(x, o.author.toUpperCase(), h * 0.325, 9, 4);
      x.globalAlpha = 1;
      x.restore();
      x.fillStyle = o.spineInk;
      x.globalAlpha = 0.6;
      x.fillRect(w / 2 - 26, 92, 52, 3);
      x.fillRect(w / 2 - 26, h - 95, 52, 3);
      x.globalAlpha = 1;
    }

    function trimToWidth(x: CanvasRenderingContext2D, text: string, maxW: number) {
      if (x.measureText(text).width <= maxW) return text;
      let t = text;
      while (t.length > 1 && x.measureText(t + '...').width > maxW) t = t.slice(0, -1);
      return t + '...';
    }

    function makeIndexPageTex(chapters?: string[]) {
      const w = 1024,
        h = 1536,
        c = mkCanvas(w, h),
        x = c.getContext('2d')!;
      x.fillStyle = '#f4efdf';
      x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(130,110,80,0.07)';
      for (let i = 0; i < 1600; i++) x.fillRect(Math.random() * w, Math.random() * h, 1.1, 1.1);
      x.fillStyle = '#2f2a23';
      x.textAlign = 'center';
      x.font = '700 84px Georgia';
      x.fillText('INDEX', w / 2, 190);
      x.globalAlpha = 0.26;
      x.fillRect(220, 225, w - 440, 3);
      x.globalAlpha = 1;

      const list = chapters && chapters.length
        ? chapters
        : ['Introduction', 'Main Ideas', 'Practical Lessons', 'Case Studies', 'Takeaways', 'Final Notes'];
      x.textAlign = 'left';
      x.font = '500 46px Georgia';
      let y = 318;
      for (let i = 0; i < list.length; i++) {
        const n = String(i + 1).padStart(2, '0');
        const pageNo = String(7 + i * 14).padStart(3, ' ');
        const left = n + '. ' + trimToWidth(x, list[i], 650);
        x.fillStyle = '#2f2a23';
        x.fillText(left, 150, y);
        x.textAlign = 'right';
        x.fillStyle = '#5d5043';
        x.fillText(pageNo, w - 150, y);
        x.textAlign = 'left';
        x.globalAlpha = 0.22;
        x.fillRect(150, y + 16, w - 300, 2);
        x.globalAlpha = 1;
        y += 112;
      }
      return tex(c);
    }

    // Book construction
    const N = books.length;
    const VISIBLE = Math.min(3, N);

    const W = 1.48,
      H = 2.22,
      T = 0.048;
    const PAGE_N = 0,
      BACK_PAGE_N = 0;

    const posterGeo = new THREE.BoxGeometry(W, H, T);
    const hitGeo = new THREE.BoxGeometry(W * 1.15, H * 1.15, 0.5);
    const blobGeo = new THREE.PlaneGeometry(1, 1);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    function std(o: THREE.MeshStandardMaterialParameters) {
      return new THREE.MeshStandardMaterial(Object.assign({ metalness: 0.02 }, o));
    }

    const paperFlat = std({ color: 0xf2ecdd, roughness: 0.95, envMapIntensity: 0.2 });
    const striMatV = std({ map: striV, bumpMap: striV, bumpScale: 0.0025, roughness: 0.95, envMapIntensity: 0.2 });
    const striMatH = std({ map: striH, bumpMap: striH, bumpScale: 0.0025, roughness: 0.95, envMapIntensity: 0.2 });
    const endpaperMat = std({ map: endpaperTex, roughness: 0.9, envMapIntensity: 0.25 });
    const pageMats = [0xf4eee0, 0xf1ebdb, 0xf6f0e3].map((c) =>
      std({ color: c, roughness: 0.92, envMapIntensity: 0.22, side: THREE.DoubleSide }),
    );

    type Book = {
      cfg: BookCfg;
      index: number;
      root: THREE.Group;
      float: THREE.Group;
      pivot: THREE.Group;
      backPivot: THREE.Group;
      frontMesh: THREE.Mesh;
      spine: THREE.Mesh;
      block: THREE.Mesh;
      pages: THREE.Group[];
      pageF: number[];
      pagesB: THREE.Group[];
      pageFB: number[];
      hit: THREE.Mesh;
      springs: Record<string, Spring>;
      phase: number;
      slotScale: number;
      hitEdge: number | null;
      scr: { x: number; y: number };
      orbY: number;
      orbYv: number;
      orbPhase: string;
      orbTarget: number;
      orbXs: Spring;
      exit: { segs: any[]; i: number; t: number } | null;
    };

    const bookInstances: Book[] = [];
    const hitMeshes: THREE.Mesh[] = [];

    function buildBook(cfg: BookCfg, index: number): Book {
      const root = new THREE.Group();
      const float = new THREE.Group();
      root.add(float);
      bookRoot.add(root);

      const indexPageMat = std({ map: makeIndexPageTex(cfg.chapters), roughness: 0.92, envMapIntensity: 0.2, side: THREE.DoubleSide });

      const edgeColor = cfg.edge ?? '#161922';
      const mEdge = std({
        color: edgeColor,
        bumpMap: laminateBump,
        bumpScale: 0.002,
        roughness: 0.22,
        metalness: 0.82,
        envMapIntensity: 0.45,
      });
      const mFront = std({
        bumpMap: laminateBump,
        bumpScale: 0.0012,
        roughness: 0.26,
        metalness: 0.06,
        envMapIntensity: 0.38,
      });
      const mBack = std({
        color: 0xffffff,
        bumpMap: laminateBump,
        bumpScale: 0.0012,
        roughness: 0.28,
        metalness: 0.08,
        envMapIntensity: 0.38,
      });

      loadOrPaint(mFront, cfg.images?.front ?? cfg.coverURL ?? null, () => {
        const c = mkCanvas(1024, 1536);
        const ctx = c.getContext('2d')!;
        if (cfg.front) cfg.front(ctx, 1024, 1536);
        else paintDefaultFront(ctx, 1024, 1536, { title: cfg.title, author: cfg.author, bg: '#101420' });
        return c;
      });

      loadOrPaint(mBack, cfg.images?.back ?? null, () => {
        const c = mkCanvas(1024, 1536);
        const ctx = c.getContext('2d')!;
        if (cfg.back) {
          cfg.back(ctx, 1024, 1536);
          return c;
        }

        // Deep cinema dark background
        const grad = ctx.createLinearGradient(0, 0, 1024, 1536);
        grad.addColorStop(0, '#0c101a');
        grad.addColorStop(0.5, '#07090e');
        grad.addColorStop(1, '#05060a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1536);

        // Film strip perforations on left and right sides
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let y = 60; y < 1500; y += 75) {
          rr(ctx, 35, y, 40, 50, 8);
          ctx.fill();
          rr(ctx, 1024 - 75, y, 40, 50, 8);
          ctx.fill();
        }

        // Golden ornate double frame
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 5;
        rr(ctx, 95, 55, 834, 1426, 24);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 2;
        rr(ctx, 110, 70, 804, 1396, 18);
        ctx.stroke();

        // Top Brand Header: Filmino
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.font = 'bold 54px system-ui';
        ctx.fillText('FILMINO', 512, 170);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = 'bold 22px system-ui';
        ctx.fillText('EXCLUSIVE CINEMA COLLECTION', 512, 210);

        // Gold divider
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.fillRect(362, 240, 300, 3);

        // Movie Title (Persian)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px system-ui';
        ctx.fillText(cfg.title || '', 512, 350);

        // Original Title (English)
        if (cfg.originalTitle && cfg.originalTitle !== cfg.title) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.font = '600 30px system-ui';
          ctx.fillText(cfg.originalTitle.toUpperCase(), 512, 410);
        }

        // Unified IMDb Rating Badge & Score Box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        rr(ctx, 360, 465, 304, 60, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        rr(ctx, 360, 465, 304, 60, 16);
        ctx.stroke();

        ctx.fillStyle = '#f5c518';
        rr(ctx, 375, 477, 95, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = '900 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('IMDb', 422, 503);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        const ratingVal = cfg.rating || ((cfg.stars ?? 4) * 2).toFixed(1);
        ctx.fillText(ratingVal, 560, 506);

        // Year & Category pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        rr(ctx, 310, 550, 404, 46, 23);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 24px system-ui';
        ctx.fillText(`${cfg.author || 'سینما'} • سال ساخت: ${cfg.year || '—'}`, 512, 582);

        // Synopsis box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        rr(ctx, 160, 640, 704, 480, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        rr(ctx, 160, 640, 704, 480, 20);
        ctx.stroke();

        // Synopsis text
        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.font = '28px system-ui';
        const overview = cfg.desc || 'مشخصات کامل، تصاویر اختصاصی، آنونس و عوامل فیلم در پلتفرم فیلمینو.';
        const words = overview.split(' ');
        let line = '';
        let curY = 710;
        for (let i = 0; i < words.length && curY < 1080; i++) {
          const test = line ? line + ' ' + words[i] : words[i];
          if (ctx.measureText(test).width > 620) {
            ctx.fillText(line, 512, curY);
            line = words[i];
            curY += 48;
          } else {
            line = test;
          }
        }
        if (line && curY < 1080) ctx.fillText(line, 512, curY);

        // Barcode / Collectible Stamp bottom
        ctx.fillStyle = '#ffffff';
        rr(ctx, 340, 1180, 344, 90, 10);
        ctx.fill();
        ctx.fillStyle = '#000000';
        let barX = 360;
        while (barX < 660) {
          const bw = 2 + Math.random() * 5;
          if (Math.random() > 0.35) ctx.fillRect(barX, 1192, bw, 46);
          barX += bw + 2 + Math.random() * 3;
        }
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`FLM-${cfg.id || '9082'}-EXCLUSIVE`, 512, 1258);

        // Footer copyright
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '20px system-ui';
        ctx.fillText('FILMINO • ALL RIGHTS RESERVED', 512, 1340);

        return c;
      });

      // 3D Movie Poster Plaque (Face 0-3: Edges, Face 4: Front Poster, Face 5: Back)
      const posterMesh = new THREE.Mesh(posterGeo, [mEdge, mEdge, mEdge, mEdge, mFront, mBack]);
      posterMesh.position.set(0, 0, 0);
      posterMesh.castShadow = true;
      posterMesh.receiveShadow = true;
      float.add(posterMesh);

      // Dummy compatible groups so existing references never fail
      const pivot = new THREE.Group();
      float.add(pivot);
      const backPivot = new THREE.Group();
      float.add(backPivot);
      const spine = new THREE.Mesh(new THREE.BufferGeometry(), hitMat);
      const block = new THREE.Mesh(new THREE.BufferGeometry(), hitMat);
      const pages: THREE.Group[] = [];
      const pageF: number[] = [];
      const pagesB: THREE.Group[] = [];
      const pageFB: number[] = [];

      const blob = new THREE.Mesh(
        blobGeo,
        new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0.42, depthWrite: false }),
      );
      blob.scale.set(2.8, 3.6, 1);
      blob.position.set(0, -0.35, -0.6);
      blob.renderOrder = -5;
      root.add(blob);

      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.position.set(0, 0, 0);
      float.add(hit);

      const springs: Record<string, Spring> = {
        px: new Spring(0, 17, 6.8),
        py: new Spring(0, 17, 6.8),
        pz: new Spring(0, 17, 6.8),
        rx: new Spring(0, 17, 6.8),
        ry: new Spring(0, 17, 6.8),
        rz: new Spring(0, 17, 6.8),
        sc: new Spring(1, 17, 6.8),
        tiltX: new Spring(0, 120, 13),
        tiltY: new Spring(0, 120, 13),
        lift: new Spring(0, 120, 13),
        cover: new Spring(0, 90, 12),
        coverB: new Spring(0, 90, 12),
        drag: new Spring(0, 160, 16),
      };

      const b: Book = {
        cfg,
        index,
        root,
        float,
        pivot,
        backPivot,
        frontMesh: posterMesh,
        spine,
        block,
        pages,
        pageF,
        pagesB,
        pageFB,
        hit,
        springs,
        phase: Math.random() * 6.28,
        slotScale: 1,
        hitEdge: null,
        scr: { x: 0, y: 0 },
        orbY: 0,
        orbYv: 0,
        orbPhase: 'idle',
        orbTarget: 0,
        orbXs: new Spring(0, 60, 12),
        exit: null,
      };
      bookInstances.push(b);
      return b;
    }
    books.forEach(buildBook);
    const bookByHit = (m: THREE.Object3D) => bookInstances.find((b) => b.hit === m)!;

    // Floating leaves (detail view)
    const leaves = {
      items: [] as any[],
      anchor: null as Book | null,
      activate(book: Book) {
        this.anchor = book;
        this.items.forEach((l) => {
          l.kick.set(-l.hx + (Math.random() - 0.5) * 0.6, -l.hy + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.5);
          l.s.t = l.size;
          l.mesh.visible = true;
        });
      },
      deactivate() {
        this.items.forEach((l) => {
          l.s.t = 0;
        });
      },
      push(dx: number, dy: number) {
        if (!this.anchor) return;
        this.items.forEach((l) => {
          l.kick.x += dx * 2.4 * Math.random();
          l.kick.y += -dy * 2.4 * Math.random();
        });
      },
      update(dt: number, t: number) {
        if (!this.anchor) return;
        const ap = this.anchor.root.position;
        const w = RM ? 0.15 : 1;
        this.items.forEach((l) => {
          l.kick.multiplyScalar(Math.exp(-1.15 * dt));
          l.mesh.position.set(
            ap.x + l.hx + Math.sin(t * l.sp + l.ph) * 0.4 * w + l.kick.x,
            ap.y + l.hy + Math.cos(t * l.sp * 0.83 + l.ph * 1.3) * 0.3 * w + l.kick.y,
            ap.z * 0.4 + l.hz + l.kick.z,
          );
          l.mesh.rotation.x += l.rv.x * dt * (0.3 + w);
          l.mesh.rotation.y += l.rv.y * dt * (0.3 + w);
          l.mesh.rotation.z += l.rv.z * dt * (0.3 + w);
          const s = l.s.update(dt);
          l.mesh.scale.setScalar(Math.max(s, 0.0001));
          if (l.s.t === 0 && s < 0.01) l.mesh.visible = false;
        });
      },
    };
    (function buildLeaves() {
      // 4-point diamond star / cinema ember shape
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.35);
      shape.quadraticCurveTo(0.04, 0.04, 0.35, 0);
      shape.quadraticCurveTo(0.04, -0.04, 0, -0.35);
      shape.quadraticCurveTo(-0.04, -0.04, -0.35, 0);
      shape.quadraticCurveTo(-0.04, 0.04, 0, 0.35);
      const geo = new THREE.ShapeGeometry(shape, 8);
      const cols = [0xf59e0b, 0xfbbf24, 0xffd54f, 0xd97706];
      for (let i = 0; i < 16; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: cols[i % 4],
          emissive: cols[i % 4],
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.2,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        bookRoot.add(mesh);
        let hx = (Math.random() - 0.5) * 4.6;
        if (i % 5 === 0) hx += 2.8 * Math.sign(hx || 1);
        leaves.items.push({
          mesh,
          hx,
          hy: (Math.random() - 0.5) * 3.2,
          hz: -0.5 + Math.random() * 1.5,
          sp: 0.25 + Math.random() * 0.5,
          ph: Math.random() * 6.28,
          rv: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8),
          kick: new THREE.Vector3(),
          size: 0.12 + Math.random() * 0.14,
          s: new Spring(0, 60, 10),
        });
      }
    })();

    // Layout slots, state machine, carousel
    const state: {
      mode: 'hero' | 'opening' | 'detail' | 'closing';
      selected: Book | null;
      hovered: Book | null;
      pillLock: Book | null;
      kbIndex: number;
    } = { mode: 'hero', selected: null, hovered: null, pillLock: null, kbIndex: -1 };

    type Slot = { p: [number, number, number]; r: [number, number, number]; s: number };
    const SLOTS: { hero: Slot[]; detail: Slot | null; portrait: boolean } = { hero: [], detail: null, portrait: false };

    function computeSlots() {
      const a = dims.w / Math.max(1, dims.h);
      const portrait = a < 0.85;
      const fit = portrait ? clamp(a / 1.08, 0.38, 0.74) : clamp(a / 1.62, 0.52, 1);
      bookRoot.scale.setScalar(fit);
      bookRoot.position.y = 0.35 - (1 - fit) * 0.28;
      SLOTS.portrait = portrait;

      SLOTS.hero = SLOTS.portrait
        ? [
          { p: [-1.36, -0.28, -0.12], r: [-0.045, 0.4, 0.185], s: 1.25 },
          { p: [0.2, 0.08, 0.6], r: [-0.05, -0.1, -0.035], s: 1.35 },
          { p: [1.62, -0.32, -0.34], r: [-0.045, -0.42, -0.17], s: 1.25 },
        ]
        : [
          { p: [-2.05, -0.28, -0.12], r: [-0.045, 0.4, 0.185], s: 1.22 },
          { p: [0.25, -0.06, 0.6], r: [-0.05, -0.1, -0.035], s: 1.32 },
          { p: [2.35, -0.34, -0.34], r: [-0.045, -0.42, -0.17], s: 1.22 },
        ];

      if (!showDetailPanel) {
        SLOTS.detail = { p: [0, -0.05, 0.75], r: [0.02, -0.34, 0.05], s: SLOTS.portrait ? 0.94 : 1.08 };
        return;
      }

      if (SLOTS.portrait) {
        const el = dpRef.current;
        const panelH = el && el.offsetHeight > 40 ? el.offsetHeight : dims.h * 0.44;
        const gap = dims.h * 0.035,
          navB = dims.h * 0.1;
        const freeTop = navB;
        const freeBot = Math.max(dims.h - panelH - gap, freeTop + 140);
        const midPx = (freeTop + freeBot) / 2;
        const T13 = 0.23087,
          camZp = 9.9,
          zw = 0.8 * fit,
          rootY = -(1 - fit) * 0.28;
        const yw = 0.1 + (1 - (2 * midPx) / dims.h) * T13 * (camZp - zw);
        const availW = (((freeBot - freeTop) * 0.92) / dims.h) * 2 * T13 * (camZp - zw);
        const s = clamp(availW / fit / 2.65, 0.42, 0.92);
        SLOTS.detail = { p: [0, (yw - rootY) / fit, 0.8], r: [-0.02, -0.4, 0.06], s };
      } else {
        SLOTS.detail = { p: [-1.68, 0.0, 0.85], r: [0.02, -0.44, 0.08], s: 1.06 };
      }
    }

    function setTargets(b: Book, slot: Slot) {
      const s = b.springs;
      s.px.t = slot.p[0];
      s.py.t = slot.p[1];
      s.pz.t = slot.p[2];
      s.rx.t = slot.r[0];
      s.ry.t = slot.r[1];
      s.rz.t = slot.r[2];
      b.slotScale = slot.s;
    }

    const EASE = {
      hold: () => 1,
      outQuad: (t: number) => 1 - (1 - t) * (1 - t),
      outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
      inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    };
    const LIFT = 0.38,
      CLEAR = 4.2;

    function playY(b: Book, segs: any[]) {
      b.exit = { segs, i: 0, t: 0 };
    }
    function stepY(b: Book, dt: number) {
      const ex = b.exit!,
        s = b.springs;
      ex.t += dt;
      let seg = ex.segs[ex.i];
      while (seg && ex.t >= seg.d) {
        ex.t -= seg.d;
        s.py.v = seg.to;
        if (seg.end) seg.end();
        seg = ex.segs[++ex.i];
      }
      if (seg) s.py.v = seg.from + (seg.to - seg.from) * seg.ease(ex.t / seg.d);
      else b.exit = null;
      s.py.t = s.py.v;
      s.py.vel = 0;
    }
    function pinInPlace(b: Book) {
      const s = b.springs;
      s.px.t = s.px.v;
      s.pz.t = s.pz.v;
      s.rx.t = s.rx.v;
      s.ry.t = s.ry.v;
      s.rz.t = s.rz.v;
    }
    function sendOut(b: Book, i: number, delay: number) {
      const y0 = SLOTS.hero[i].p[1],
        here = b.springs.py.v,
        apex = y0 + LIFT;
      b.root.visible = true;
      pinInPlace(b);
      playY(b, [
        { d: delay, from: here, to: here, ease: EASE.hold },
        { d: 0.28, from: here, to: apex, ease: EASE.outQuad },
        { d: 0.9, from: apex, to: y0 - CLEAR, ease: EASE.inOutSine, end: () => { b.root.visible = false; } },
      ]);
    }
    function bringBack(b: Book, i: number, delay: number) {
      const here = b.springs.py.v;
      b.root.visible = true;
      pinInPlace(b);
      playY(b, [
        { d: delay, from: here, to: here, ease: EASE.hold },
        { d: 1.0, from: here, to: SLOTS.hero[i].p[1], ease: EASE.outQuint },
      ]);
    }

    // carousel: which VISIBLE-sized window of `bookInstances` sits in the 3 hero slots 
    function windowIndices(start: number, total: number, count: number) {
      const arr: number[] = [];
      for (let i = 0; i < count; i++) arr.push((start + i) % total);
      return arr;
    }
    let carouselStart = 0;
    let currentWindow: number[] = windowIndices(0, N, VISIBLE);
    let carouselBusy = false;

    function rebuildHitMeshes() {
      hitMeshes.length = 0;
      currentWindow.forEach((bi) => hitMeshes.push(bookInstances[bi].hit));
    }

    function applyMode() {
      if (state.mode === 'hero' || state.mode === 'closing') {
        currentWindow.forEach((bi, i) => {
          const slot = SLOTS.hero[i];
          if (slot) setTargets(bookInstances[bi], slot);
        });
      } else if (state.selected) {
        setTargets(state.selected, SLOTS.detail!);
      }
    }

    function shiftCarousel(dir: 1 | -1) {
      if (carouselBusy || state.mode !== 'hero' || N <= VISIBLE) return;
      carouselBusy = true;
      const outgoing = currentWindow;
      // Shift by 1 instead of shifting the entire visible window
      carouselStart = (((carouselStart + dir) % N) + N) % N;
      const incoming = windowIndices(carouselStart, N, VISIBLE);

      const toHide = outgoing.filter((bi) => !incoming.includes(bi));

      // Only push away the books that are actually leaving the screen
      toHide.forEach((bi) => {
        const oldIdx = outgoing.indexOf(bi);
        const slot = SLOTS.hero[oldIdx];
        const b = bookInstances[bi];
        if (slot) b.springs.px.t = slot.p[0] - dir * 6.5;
      });
      setT(() => toHide.forEach((bi) => { bookInstances[bi].root.visible = false; }), 650);

      incoming.forEach((bi, i) => {
        const slot = SLOTS.hero[i];
        if (!slot) return;
        const b = bookInstances[bi];
        const alreadyOnScreen = outgoing.includes(bi);
        b.root.visible = true;
        if (!alreadyOnScreen) {
          // New books fly in from the opposite side
          b.springs.px.set(slot.p[0] + dir * 6.5);
          b.springs.py.set(slot.p[1]);
          b.springs.pz.set(slot.p[2]);
          b.springs.rx.set(slot.r[0]);
          b.springs.ry.set(slot.r[1]);
          b.springs.rz.set(slot.r[2]);
          b.springs.sc.set(slot.s * 0.92);
        }
        setTargets(b, slot);
      });

      currentWindow = incoming;
      rebuildHitMeshes();
      setT(() => { carouselBusy = false; }, 700);
    }
    shiftCarouselRef.current = shiftCarousel;

    const camX = new Spring(0, 13, 6.5),
      camY = new Spring(0.1, 13, 6.5),
      camZ = new Spring(9.6, 13, 6.5);
    const lookX = new Spring(0, 13, 6.5),
      lookY = new Spring(0, 13, 6.5);
    const parX = new Spring(0, 60, 10),
      parY = new Spring(0, 60, 10);

    function camTo(mode: string) {
      if (mode === 'detail') {
        camX.t = SLOTS.portrait ? 0 : -0.25;
        camZ.t = SLOTS.portrait ? 10.4 : 9.6;
        lookX.t = SLOTS.portrait ? 0 : -0.35;
        lookY.t = SLOTS.portrait ? 0 : 0.15;
      } else {
        camX.t = 0;
        camZ.t = 9.6;
        lookX.t = 0;
        lookY.t = 0;
      }
    }

    const pillX = new Spring(0, 190, 23),
      pillY = new Spring(0, 190, 23);
    let pillOn = false;
    function showPill() {
      const el = openBtnRef.current;
      if (!el) return;
      el.classList.remove(...OPEN_BTN_OFF);
      el.classList.add(...OPEN_BTN_ON);
      pillOn = true;
    }
    function hidePill() {
      const el = openBtnRef.current;
      if (el) {
        el.classList.remove(...OPEN_BTN_ON);
        el.classList.add(...OPEN_BTN_OFF);
      }
      pillOn = false;
    }

    function open(book: Book | null) {
      if (state.mode !== 'hero' || !book) return;
      state.mode = 'opening';
      setUiMode('opening');
      state.selected = book;
      state.pillLock = null;
      state.kbIndex = -1;
      hidePill();
      book.exit = null;
      root!.classList.add('bs-transit');
      setSelectedCfg(book.cfg);
      onBookSelectRef.current?.(book.cfg);
      computeSlots();

      let out = 0;
      currentWindow.forEach((bi, i) => {
        const b = bookInstances[bi];
        if (b !== book) sendOut(b, i, out++ * 0.08);
      });

      setT(() => {
        if (state.mode !== 'opening' && state.mode !== 'detail') return;
        book.orbY = RM ? 0 : -6.2832;
        book.orbYv = RM ? 0 : 3;
        book.orbPhase = 'return';
        book.orbTarget = 0;
        book.orbXs.set(0);
        applyMode();
        camTo('detail');
      }, 760);
      setT(() => leaves.activate(book), 1000);
      setT(() => {
        if (state.mode === 'opening') {
          currentWindow.forEach((bi) => {
            const sibling = bookInstances[bi];
            if (sibling !== book) {
              sibling.exit = null;
              sibling.root.visible = false;
            }
          });
          root!.classList.add('bs-detail-open');
          state.mode = 'detail';
          setUiMode('detail');
        }
      }, 1400);
    }

    function close() {
      if (state.mode !== 'detail') return;
      state.mode = 'closing';
      setUiMode('closing');
      root!.classList.remove('bs-detail-open');
      onBookSelectRef.current?.(null);
      leaves.deactivate();
      orbit.drag = false;
      const b = state.selected;
      if (b) {
        b.orbTarget = Math.round(b.orbY / 6.2832) * 6.2832 + 6.2832;
        b.orbYv = Math.max(b.orbYv, 3);
        b.orbPhase = 'return';
        b.orbXs.t = 0;
      }
      setT(() => {
        root!.classList.remove('bs-transit');
        applyMode();
        camTo('hero');
        let back = 0;
        currentWindow.forEach((bi, i) => {
          const bk = bookInstances[bi];
          if (bk !== b) bringBack(bk, i, 0.85 + back++ * 0.1);
        });
      }, 250);
      setT(() => {
        if (state.mode === 'closing') {
          state.mode = 'hero';
          setUiMode('hero');
          state.selected = null;
          setSelectedCfg(null);
        }
      }, 1600);
    }

    const onCloseClick = () => close();
    closeBtnRef.current?.addEventListener('click', onCloseClick);

    // Input: pointer as hand, drag to peel, keyboard
    const ptr = {
      ndcX: 0,
      ndcY: 0,
      cx: 0,
      cy: 0,
      lastX: 0,
      lastY: 0,
      down: false,
      downX: 0,
      downY: 0,
      moved: 0,
      t0: 0,
      type: 'mouse',
      seen: false,
      id: null as number | null,
    };
    const isTouch = () => ptr.type === 'touch' || ptr.type === 'pen';
    let dragBook: Book | null = null,
      rayBook: Book | null = null;
    const orbit = { drag: false, dxAcc: 0, dyAcc: 0 };
    const ray = new THREE.Raycaster();
    const tmpV = new THREE.Vector3();

    const canvas = canvasEl;
    const onContextMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', onContextMenu);

    const onPointerLeave = () => {
      rayBook = null;
      state.pillLock = null;
      state.kbIndex = -1;
    };
    canvas.addEventListener('pointerleave', onPointerLeave);

    const localXY = (e: PointerEvent) => {
      const r = root!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (ptr.id !== null && e.pointerId !== ptr.id) return;
      const { x: cx, y: cy } = localXY(e);
      const dxN = (cx - ptr.lastX) / dims.w;
      const dyN = (cy - ptr.lastY) / dims.h;
      ptr.lastX = cx;
      ptr.lastY = cy;
      ptr.cx = cx;
      ptr.cy = cy;
      ptr.ndcX = (cx / dims.w) * 2 - 1;
      ptr.ndcY = -(cy / dims.h) * 2 + 1;
      ptr.type = e.pointerType || 'mouse';
      ptr.seen = true;
      if (state.mode === 'detail') leaves.push(dxN, dyN);
      if (ptr.down && dragBook) {
        ptr.moved += Math.abs(dxN * dims.w) + Math.abs(dyN * dims.h);
        dragBook.springs.drag.t = clamp(((ptr.downX - cx) / dims.w) * 3.4, 0, 1.0);
      }
      if (ptr.down && orbit.drag) {
        orbit.dxAcc += dxN;
        orbit.dyAcc += dyN;
        ptr.moved += Math.abs(dxN * dims.w) + Math.abs(dyN * dims.h);
      }
    };
    canvas.addEventListener('pointermove', onPointerMove);

    const onPointerDown = (e: PointerEvent) => {
      if (ptr.id !== null) return;
      root.focus({ preventScroll: true });
      ptr.id = e.pointerId;
      const { x: cx, y: cy } = localXY(e);
      ptr.cx = cx;
      ptr.cy = cy;
      ptr.lastX = cx;
      ptr.lastY = cy;
      ptr.ndcX = (cx / dims.w) * 2 - 1;
      ptr.ndcY = -(cy / dims.h) * 2 + 1;
      ptr.type = e.pointerType || 'mouse';
      ptr.seen = true;
      castRay();
      if (state.mode === 'hero' && rayBook) {
        ptr.down = true;
        dragBook = rayBook;
        ptr.downX = cx;
        ptr.downY = cy;
        ptr.moved = 0;
        ptr.t0 = performance.now();
        canvas.setPointerCapture(e.pointerId);
      } else if (state.mode === 'detail' && rayBook === state.selected) {
        ptr.down = true;
        orbit.drag = true;
        orbit.dxAcc = 0;
        orbit.dyAcc = 0;
        ptr.moved = 0;
        ptr.t0 = performance.now();
        canvas.setPointerCapture(e.pointerId);
      } else {
        state.pillLock = null;
        state.kbIndex = -1;
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    const onPointerUp = (e: PointerEvent) => {
      if (ptr.id !== null && e.pointerId !== ptr.id) return;
      ptr.id = null;
      orbit.drag = false;
      if (dragBook) {
        const slop = isTouch() ? 26 : 14;
        const limit = isTouch() ? 650 : 450;
        const wasDrag = ptr.moved > slop;
        dragBook.springs.drag.t = 0;
        if (!wasDrag && state.mode === 'hero' && performance.now() - ptr.t0 < limit) open(dragBook);
        dragBook = null;
      }
      ptr.down = false;
      if (isTouch()) rayBook = null;
    };
    window.addEventListener('pointerup', onPointerUp);

    const cancelPointer = (e?: PointerEvent) => {
      if (e && ptr.id !== null && e.pointerId !== ptr.id) return;
      ptr.id = null;
      ptr.down = false;
      orbit.drag = false;
      if (dragBook) {
        dragBook.springs.drag.t = 0;
        dragBook = null;
      }
      if (isTouch()) rayBook = null;
    };
    window.addEventListener('pointercancel', cancelPointer as any);
    canvas.addEventListener('lostpointercapture', cancelPointer as any);

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (state.mode !== 'hero') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (e.shiftKey) {
          shiftCarousel(e.key === 'ArrowRight' ? 1 : -1);
        } else {
          const d = e.key === 'ArrowRight' ? 1 : -1;
          state.kbIndex = ((state.kbIndex < 0 ? (d > 0 ? -1 : 1) : state.kbIndex) + d + VISIBLE) % VISIBLE;
          state.pillLock = null;
        }
        e.preventDefault();
      }
      if (e.key === 'Enter' && state.hovered) open(state.hovered);
    };
    root.addEventListener('keydown', onKeydown);

    function castRay() {
      ray.setFromCamera({ x: ptr.ndcX, y: ptr.ndcY } as THREE.Vector2, camera);
      const hits = ray.intersectObjects(hitMeshes, false);
      if (hits.length) {
        rayBook = bookByHit(hits[0].object);
        const lp = rayBook.hit.worldToLocal(hits[0].point.clone());
        rayBook.hitEdge = clamp((lp.x / 0.9) * 0.5 + 0.5, 0, 1);
      } else {
        rayBook = null;
      }
    }

    // Frame loop
    const timer = new THREE.Timer();
    timer.connect(document);
    const idle = RM ? 0 : 1;
    const DETAIL_OPEN_ANGLE = 0.88;
    const DETAIL_OPEN_SWAY = 0.035;

    function screenPos(b: Book) {
      b.root.getWorldPosition(tmpV).project(camera);
      b.scr.x = (tmpV.x * 0.5 + 0.5) * dims.w;
      b.scr.y = (-tmpV.y * 0.5 + 0.5) * dims.h;
    }

    function tickBook(b: Book, dt: number, t: number) {
      const s = b.springs;
      const isHov = state.hovered === b;
      const inDetail = state.mode === 'detail' && state.selected === b;
      const orbitActive = state.selected === b && state.mode !== 'hero';

      let activity = 0;
      if (orbitActive) {
        if (orbit.drag && inDetail) {
          const step = orbit.dxAcc * 6.5;
          orbit.dxAcc = 0;
          b.orbY += step;
          b.orbYv = clamp(b.orbYv * 0.5 + (step / Math.max(dt, 0.001)) * 0.5, -14, 14);
          b.orbXs.t = clamp(b.orbXs.t + orbit.dyAcc * 3.2, -0.55, 0.55);
          orbit.dyAcc = 0;
          b.orbPhase = 'drag';
        } else {
          b.orbXs.t = 0;
          if (b.orbPhase === 'drag') {
            if (Math.abs(b.orbYv) > 0.6) b.orbPhase = 'spin';
            else {
              b.orbPhase = 'return';
              b.orbTarget = Math.round((b.orbY + b.orbYv * 1.2) / Math.PI) * Math.PI;
            }
          }
          if (b.orbPhase === 'spin') {
            b.orbYv *= Math.exp(-0.9 * dt);
            b.orbY += b.orbYv * dt;
            if (Math.abs(b.orbYv) < 0.5) {
              b.orbPhase = 'return';
              b.orbTarget = Math.round((b.orbY + b.orbYv * 1.2) / Math.PI) * Math.PI;
            }
          } else if (b.orbPhase === 'return') {
            const acc = 16 * (b.orbTarget - b.orbY) - 8 * b.orbYv;
            b.orbYv += acc * dt;
            b.orbY += b.orbYv * dt;
            if (Math.abs(b.orbTarget - b.orbY) < 0.002 && Math.abs(b.orbYv) < 0.01) {
              b.orbY = b.orbTarget;
              b.orbYv = 0;
              b.orbPhase = 'idle';
            }
          }
        }
        const distRest = Math.abs(b.orbY - Math.round(b.orbY / 6.2832) * 6.2832);
        activity = clamp(Math.abs(b.orbYv) * 1.5 + (orbit.drag ? 1 : 0) + distRest * 2, 0, 1);
      }
      b.orbXs.update(dt);

      let coverBase = 0;
      if (inDetail) coverBase = DETAIL_OPEN_ANGLE + Math.sin(t * 0.8 + b.phase) * DETAIL_OPEN_SWAY * idle;
      const fan = orbitActive ? clamp(b.orbYv * 0.16, 0, 0.75) : 0;
      const fanB = orbitActive ? clamp(-b.orbYv * 0.16, 0, 0.75) : 0;
      let coverBBase = 0;
      if (inDetail) coverBBase = 0.2 + Math.sin(t * 0.8 + b.phase + 1.7) * 0.02 * idle;

      if (isHov && ptr.seen && state.mode === 'hero') {
        const dxN = (ptr.cx - b.scr.x) / (dims.w * 0.25);
        const dyN = (b.scr.y - ptr.cy) / (dims.h * 0.3);
        s.tiltY.t = clamp(dxN * 0.28, -0.15, 0.15);
        s.tiltX.t = clamp(-dyN * 0.1, -0.09, 0.1);
        s.lift.t = 0.3;
        // Keep the jacket closed while hovering. Opening it here exposed the
        // page block between the spine and front cover as a broken white seam.
        // The cover still opens intentionally after the book is selected.
        coverBase = 0;
      } else {
        s.tiltY.t = 0;
        s.tiltX.t = 0;
        s.lift.t = 0;
      }
      s.cover.t = coverBase + fan;
      s.coverB.t = coverBBase + fanB;
      s.sc.t = b.slotScale * (isHov && state.mode === 'hero' ? 1.09 : 1);

      s.px.update(dt);
      if (b.exit) stepY(b, dt);
      else s.py.update(dt);
      s.pz.update(dt);
      s.rx.update(dt);
      s.ry.update(dt);
      s.rz.update(dt);
      s.sc.update(dt);
      s.tiltX.update(dt);
      s.tiltY.update(dt);
      s.lift.update(dt);
      s.cover.update(dt);
      s.coverB.update(dt);
      s.drag.update(dt);

      b.float.position.y = Math.sin(t * 0.7 + b.phase) * 0.035 * idle;
      b.float.rotation.z = Math.sin(t * 0.9 + b.phase * 1.7) * 0.006 * idle;

      b.root.position.set(s.px.v, s.py.v, s.pz.v + s.lift.v);
      const sway = inDetail ? Math.sin(t * 0.45 + b.phase) * 0.035 * idle * (1 - activity) : 0;
      const swing = clamp(-s.px.vel * 0.12, -0.5, 0.5);
      b.root.rotation.set(s.rx.v + s.tiltX.v + b.orbXs.v, s.ry.v + s.tiltY.v + b.orbY + sway + swing, s.rz.v);
      b.root.scale.setScalar(Math.max(s.sc.v, 0.001));

    }

    let rafId = 0;
    let isInViewport = true;
    let lastFrameTime = 0;
    const frameInterval = 1000 / (lowPowerDevice ? 20 : 30);
    function animate(timestamp = performance.now()) {
      if (cancelled || !isInViewport || document.hidden) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(animate);
      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;
      timer.update(timestamp);
      const dt = Math.min(timer.getDelta(), 0.05);
      const t = timer.getElapsed();

      if (ptr.seen && (ptr.type === 'mouse' || ptr.down)) castRay();
      let hov: Book | null = null;
      if (state.mode === 'hero') {
        const kb = state.kbIndex >= 0 ? bookInstances[currentWindow[state.kbIndex]] : null;
        hov = rayBook || state.pillLock || kb || null;
      } else if (state.mode === 'detail') {
        hov = rayBook === state.selected ? rayBook : null;
      }
      state.hovered = hov;
      let cur = 'default';
      if (state.mode === 'hero' && hov) cur = 'pointer';
      else if (state.mode === 'detail' && state.selected) {
        if (orbit.drag) cur = 'grabbing';
        else if (rayBook === state.selected) cur = 'grab';
      }
      canvas.style.cursor = cur;

      bookInstances.forEach((b) => screenPos(b));
      bookInstances.forEach((b) => tickBook(b, dt, t));
      leaves.update(dt, t);

      parX.t = RM ? 0 : ptr.ndcX * 0.02;
      parY.t = RM ? 0 : -ptr.ndcY * 0.012;
      bookRoot.rotation.y = parX.update(dt);
      bookRoot.rotation.x = parY.update(dt);

      camera.position.set(camX.update(dt), camY.update(dt), camZ.update(dt));
      camera.lookAt(lookX.update(dt), lookY.update(dt), 0);

      if (state.mode === 'hero' && state.hovered && ptr.seen && !isTouch() && !(ptr.down && ptr.moved > 14)) {
        const tx = ptr.cx,
          ty = ptr.cy + 34;
        if (!pillOn) {
          pillX.set(tx);
          pillY.set(ty);
        }
        pillX.t = tx;
        pillY.t = ty;
        if (openBtnRef.current) {
          openBtnRef.current.style.left = pillX.update(dt) + 'px';
          openBtnRef.current.style.top = pillY.update(dt) + 'px';
        }
        if (!pillOn) showPill();
      } else {
        hidePill();
      }

      renderer.render(scene, camera);
    }

    function resumeAnimation() {
      if (!rafId && !cancelled && isInViewport && !document.hidden) animate();
    }

    // Entrance + resize
    function relayout() {
      const r = root!.getBoundingClientRect();
      dims.w = Math.max(1, Math.round(r.width));
      dims.h = Math.max(1, Math.round(r.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerDevice ? 1 : 1.25));
      renderer.setSize(dims.w, dims.h);
      camera.aspect = dims.w / dims.h;
      camera.updateProjectionMatrix();
      computeSlots();
      applyMode();
      camTo(state.mode === 'detail' || state.mode === 'opening' ? 'detail' : 'hero');
    }

    relayout();
    currentWindow.forEach((bi, i) => {
      const b = bookInstances[bi];
      const slot = SLOTS.hero[i];
      const s = b.springs;
      s.px.set(slot.p[0]);
      s.py.set(slot.p[1] - 3.9);
      s.pz.set(slot.p[2]);
      s.rx.set(slot.r[0]);
      s.ry.set(slot.r[1]);
      s.rz.set(slot.r[2] + 0.35 * (i === 1 ? -1 : Math.sign(slot.p[0])));
      s.sc.set(slot.s);
      b.slotScale = slot.s;
      setT(() => setTargets(b, slot), 240 + i * 150);
    });
    bookInstances.forEach((b, idx) => {
      if (!currentWindow.includes(idx)) b.root.visible = false;
    });
    rebuildHitMeshes();
    camTo('hero');
    animate();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isInViewport = entry.isIntersecting;
        if (isInViewport) resumeAnimation();
        else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { rootMargin: '160px' },
    );
    visibilityObserver.observe(root);

    const onVisibilityChange = () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else {
        resumeAnimation();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onWindowResize = () => relayout();
    let orientationTimeout: ReturnType<typeof setTimeout> | null = null;
    const onOrientation = () => {
      relayout();
      orientationTimeout = setT(relayout, 250);
    };
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onOrientation);
    let visualViewportHandler: (() => void) | null = null;
    if (window.visualViewport) {
      visualViewportHandler = () => relayout();
      window.visualViewport.addEventListener('resize', visualViewportHandler);
    }
    const ro = new ResizeObserver(() => relayout());
    ro.observe(root);

    // Cleanup
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      timeouts.forEach((id) => clearTimeout(id));
      if (orientationTimeout) clearTimeout(orientationTimeout);

      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      timer.dispose();
      ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onOrientation);
      if (visualViewportHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', visualViewportHandler);
      }
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', cancelPointer as any);
      root.removeEventListener('keydown', onKeydown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('lostpointercapture', cancelPointer as any);
      closeBtnRef.current?.removeEventListener('click', onCloseClick);

      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            Object.values(m).forEach((v: any) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose();
          });
        }
      });
      scene.environment?.dispose();
      scene.environment = null;
      renderer.dispose();
    };
  }, [books, showDetailPanel]);

  const themeVars = {
    '--bs-navy': themeColors?.navy ?? '#141a32',
    '--bs-pink': themeColors?.pink ?? '#f591ac',
    '--bs-cream': themeColors?.cream ?? '#fdfbf4',
    '--bs-lav': themeColors?.lav ?? '#c9d0ee',
    '--bs-peri': themeColors?.peri ?? '#96a2de',
    '--bs-bg-light': themeColors?.bgLight ?? themeColors?.bg ?? '#fafafa',
    '--bs-bg-dark': themeColors?.bgDark ?? themeColors?.bg ?? '#18181b',
    '--bs-fg-light': themeColors?.foregroundLight ?? '#18181b',
    '--bs-fg-dark': themeColors?.foregroundDark ?? '#fafafa',
  } as React.CSSProperties;

  const panelVisible = uiMode === 'detail';
  const heroWordVisible = mounted && uiMode === 'hero';
  const canCarousel = showCarousel && books.length > 3;

  const delayMap: Record<number, string> = {
    50: 'delay-[50ms]',
    130: 'delay-[130ms]',
    210: 'delay-[210ms]',
    270: 'delay-[270ms]',
    330: 'delay-[330ms]',
  };

  const dpChild = (delayMs: number) =>
    panelVisible
      ? `opacity-100 translate-y-0 transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${delayMap[delayMs] || ''}`
      : 'opacity-0 translate-y-[28px] transition-[opacity,transform] duration-[280ms] ease-out';

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label={`${heroTitle} book showcase`}
      data-state={uiMode}
      className={cn(
        'book-showcase relative isolate h-full min-h-[560px] overflow-hidden font-sans outline-none [container-type:size] [-webkit-tap-highlight-color:transparent]',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--bs-peri)]',
        'transition-colors duration-500 ease-out',
        'bg-background text-foreground',
        className,
      )}
      style={themeVars}
    >
      {/* hero word */}
      <div
        className={`pointer-events-none absolute left-1/2 top-[8%] z-[1] -translate-x-1/2 select-none transition-all duration-500 ease-out ${heroWordVisible ? 'translate-y-0 opacity-100' : uiMode === 'hero' ? '-translate-y-0 translate-y-[60px] opacity-0' : '-translate-y-11 opacity-0'
          }`}
      >
        <span className="block whitespace-nowrap text-foreground/[0.04] text-[clamp(4.5rem,22.5cqw,18rem)] font-extrabold leading-[0.85] tracking-[-0.015em]">
          {heroTitle}
        </span>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 z-[2] block h-full w-full touch-none" />

      {books.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-8 text-center text-sm text-current opacity-60">
          Add at least one book to display the showcase.
        </div>
      )}

      {showNav && (
        <nav
          aria-hidden={uiMode !== 'hero'}
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-[clamp(20px,4cqw,42px)] py-[clamp(18px,3cqh,26px)] transition-opacity duration-300',
            uiMode === 'hero' ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="text-[clamp(20px,2.2cqw,29px)] font-extrabold tracking-[-0.01em] text-current">
            {navTitle}
          </div>
        </nav>
      )}

      {canCarousel && (
        <>
          <button
            type="button"
            aria-label="آثار بعدی"
            onClick={() => shiftCarouselRef.current(1)}
            className={`absolute left-3 top-1/2 z-30 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card/90 text-foreground border border-border/60 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-card @min-[768px]:left-6 @min-[768px]:h-12 @min-[768px]:w-12 cursor-pointer ${uiMode === 'hero' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="آثار قبلی"
            onClick={() => shiftCarouselRef.current(-1)}
            className={`absolute right-3 top-1/2 z-30 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card/90 text-foreground border border-border/60 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-card @min-[768px]:right-6 @min-[768px]:h-12 @min-[768px]:w-12 cursor-pointer ${uiMode === 'hero' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
              }`}
          >
            <ChevronRight />
          </button>
        </>
      )}

      {showDetailPanel && (
        <div
          ref={dpRef}
          aria-live="polite"
          className={`absolute right-[7%] top-1/2 z-30 w-[min(560px,42%)] -translate-y-1/2 @max-[760px]:right-auto @max-[760px]:left-1/2 @max-[760px]:top-auto @max-[760px]:bottom-[3.5%] @max-[760px]:w-[min(560px,92cqw)] @max-[760px]:-translate-x-1/2 @max-[760px]:translate-y-0 ${panelVisible ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-[500ms]'
            }`}
        >
          <h1
            style={{ fontFamily: 'var(--font-yekan-bakh), "Yekan Bakh FaNum", sans-serif' }}
            className={`m-0 text-foreground text-[clamp(36px,4.5cqw,62px)] font-black leading-[1.1] tracking-tight @max-[760px]:text-[clamp(28px,7.5cqw,40px)] ${dpChild(50)}`}
          >
            {selectedCfg?.title}
          </h1>
          {selectedCfg?.originalTitle && selectedCfg.originalTitle !== selectedCfg.title && (
            <div dir="ltr" className={`mt-2 text-xs md:text-sm tracking-wider uppercase font-semibold text-amber-500 dark:text-amber-400 text-right ${dpChild(80)}`}>
              {selectedCfg.originalTitle}
            </div>
          )}
          <p className={`mt-[18px] max-w-[54ch] text-muted-foreground text-[clamp(14px,1.15cqw,17px)] leading-[1.7] @max-[760px]:mt-2.5 @max-[760px]:line-clamp-4 @max-[760px]:text-[14px] ${dpChild(130)}`}>
            {selectedCfg?.desc}
          </p>

          {/* Unified IMDb Rating & Info Box */}
          <div className={`mt-5 flex flex-wrap items-center gap-2.5 ${dpChild(210)}`}>
            <div className="inline-flex items-center gap-2 rounded-xl bg-card border border-border/80 px-3 py-1.5 shadow-2xs">
              <span className="rounded bg-[#f5c518] px-1.5 py-0.5 text-[11px] font-black text-black tracking-wider">
                IMDb
              </span>
              <span className="text-sm md:text-base font-black text-foreground" dir="ltr">
                {selectedCfg?.rating || ((selectedCfg?.stars ?? 4) * 2).toFixed(1)}
              </span>
            </div>

            {selectedCfg?.year && (
              <div className="inline-flex items-center rounded-xl bg-card border border-border/80 px-3 py-1.5 text-xs md:text-sm font-semibold text-muted-foreground shadow-2xs" dir="ltr">
                {selectedCfg.year}
              </div>
            )}

            {selectedCfg?.author && (
              <div className="inline-flex items-center rounded-xl bg-card border border-border/80 px-3 py-1.5 text-xs md:text-sm font-semibold text-muted-foreground shadow-2xs">
                {selectedCfg.author}
              </div>
            )}
          </div>

          {/* Action Buttons & Close link */}
          <div className={`mt-7 flex flex-col gap-3 ${dpChild(330)}`}>
            <div className="flex flex-wrap items-center gap-3">
              {selectedCfg?.id && (
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl px-6 font-bold shadow-md bg-amber-500 text-black hover:bg-amber-400 active:scale-95 transition-all"
                >
                  <Link
                    href={selectedCfg.href || (selectedCfg.mediaType === "tv" ? `/tv/${selectedCfg.id}` : `/movies/${selectedCfg.id}`)}
                  >
                    <span>مشاهده صفحه</span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Close button placed directly under the action buttons */}
            <div>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label="بستن و بازگشت به فهرست"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1.5 px-2 rounded-lg hover:bg-secondary/50"
              >
                <span className="text-sm leading-none">✕</span>
                <span>بستن و بازگشت به فهرست آثار</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BooksShowcase;
