// In-memory cache for fast repeated translations
const translationCache = new Map<string, string>();

/**
 * Translates English text to Persian.
 * If text already contains Persian characters or is empty, returns original.
 */
export async function translateToPersian(text: string): Promise<string> {
  if (!text || !text.trim()) return "";

  // If text already contains Persian/Arabic characters, return as is
  if (/[\u0600-\u06FF]/.test(text)) {
    return text;
  }

  const trimmed = text.trim();
  const cached = translationCache.get(trimmed);
  if (cached) return cached;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fa&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Translation API error: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((chunk: unknown[]) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
        .join("");

      if (translated && translated.trim()) {
        translationCache.set(trimmed, translated.trim());
        return translated.trim();
      }
    }
  } catch (error) {
    console.warn("Translation failed for text snippet:", trimmed.slice(0, 40), error);
  }

  return text;
}
