# 🎬 Filmino | فیلمینو

> A modern, interactive movie & TV discovery platform built with Next.js, TypeScript, Tailwind CSS and TMDB.

**فیلمینو (Filmino)** یک پلتفرم مدرن و تعاملی برای **کشف، جست‌وجو و بررسی فیلم‌ها، سریال‌ها و انیمیشن‌ها** است که با تمرکز بر تجربه کاربری، طراحی بصری، انیمیشن‌های تعاملی و معماری ماژولار توسعه یافته است.

این پروژه با استفاده از **Next.js 16 (App Router)**، **TypeScript**، **Tailwind CSS 4** و **GSAP** ساخته شده و داده‌های سینمایی را از **TMDB API** دریافت می‌کند.

---

## ✨ Features

### 🎨 Modern UI/UX

* طراحی مدرن و کاملاً Responsive
* پشتیبانی از **Dark / Light Mode**
* رابط کاربری فارسی با فونت **Yekan Bakh FaNum**
* طراحی یکپارچه با پالت رنگی Amber / Gold
* کامپوننت‌های قابل استفاده مجدد و معماری ماژولار

### 🎬 Movie & TV Discovery

* دریافت اطلاعات فیلم‌ها، سریال‌ها و انیمیشن‌ها از TMDB
* نمایش پوستر، بک‌دراپ، امتیاز، ژانر، کشور سازنده و اطلاعات تکمیلی
* نمایش بازیگران و عوامل تولید
* نمایش تریلرهای رسمی YouTube
* نمایش گالری تصاویر و پوسترها
* نمایش فصل‌ها و قسمت‌های سریال‌ها

### 🔍 Advanced Search & Filtering

* جست‌وجوی سریع با نتایج زنده
* میانبر **Ctrl + K** برای باز کردن جست‌وجوی سریع
* فیلتر بر اساس:

  * ژانر
  * سال انتشار
  * امتیاز
  * کشور سازنده
  * نوع محتوا
* مرتب‌سازی بر اساس محبوبیت، امتیاز و تاریخ انتشار

### 🎭 Interactive Animations

* انیمیشن‌های پیشرفته با **GSAP**
* استفاده از **ScrollTrigger**
* ویترین سه‌بعدی فیلم‌ها
* **3D Book Showcase**
* Staggered Grid
* گالری‌های تعاملی و افکت‌های Hover
* پشتیبانی از Touch و Drag در بخش‌های تعاملی

### 📌 Watchlist

* ذخیره فیلم‌ها و سریال‌های مورد علاقه
* ذخیره اطلاعات در `localStorage`
* امکان علامت‌گذاری آثار مشاهده‌شده
* بدون نیاز به ایجاد حساب کاربری

### ⚡ Performance

* استفاده از **Next.js App Router**
* Server-side Rendering
* Static Generation در بخش‌های مناسب
* Turbopack برای توسعه سریع‌تر
* Client-side caching با **TanStack Query**
* ساختار کامپوننتی و قابل توسعه

---

# 🛠 Tech Stack

| Technology            | Usage                               |
| --------------------- | ----------------------------------- |
| **Next.js 16**        | Framework & App Router              |
| **TypeScript**        | Type-safe development               |
| **Tailwind CSS 4**    | Styling & Responsive UI             |
| **GSAP**              | Advanced animations                 |
| **ScrollTrigger**     | Scroll-based animations             |
| **Shadcn / Radix UI** | UI primitives & components          |
| **TanStack Query**    | Client-side data fetching & caching |
| **TMDB API**          | Movie & TV data                     |
| **LocalStorage**      | Client-side Watchlist               |
| **Yekan Bakh FaNum**  | Persian typography                  |

---

# 🏗 Architecture

پروژه با رویکرد **Modular Architecture** طراحی شده تا بخش‌های مختلف رابط کاربری و منطق برنامه مستقل، قابل استفاده مجدد و قابل توسعه باشند.

```text
Filmino
│
├── public/
│   ├── images/
│   ├── icons/
│   └── static assets
│
├── src/
│   │
│   ├── app/
│   │   ├── page.tsx
│   │   ├── browse/
│   │   ├── search/
│   │   ├── category/[slug]/
│   │   ├── movies/[id]/
│   │   ├── tv/[id]/
│   │   ├── watchlist/
│   │   ├── contact/
│   │   ├── api/
│   │   │   └── tmdb/[...path]/
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── home/
│   │   ├── detail/
│   │   ├── filters/
│   │   ├── media/
│   │   ├── shared/
│   │   └── ui/
│   │
│   ├── fonts/
│   │   └── yekan-bakh/
│   │
│   ├── hooks/
│   │   ├── useWatchlist.ts
│   │   ├── useDebounce.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── tmdb/
│   │   ├── translations/
│   │   └── utils/
│   │
│   └── types/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

# 📱 Main Pages

### `/`

صفحه اصلی شامل:

* Hero Slider
* آثار محبوب و ترند
* دسته‌بندی‌های سریع
* ویترین سه‌بعدی فیلم‌ها
* پیشنهادهای سینمایی

### `/browse`

صفحه آرشیو با فیلتر و مرتب‌سازی پیشرفته.

### `/search`

جست‌وجوی عمیق در بین فیلم‌ها، سریال‌ها و انیمیشن‌ها.

### `/movies/[id]`

صفحه اختصاصی فیلم شامل:

* عنوان فارسی و انگلیسی
* خلاصه داستان
* امتیاز
* ژانر
* مدت زمان
* رده سنی
* بازیگران و عوامل
* تریلر
* گالری تصاویر

### `/tv/[id]`

صفحه اختصاصی سریال شامل تمام قابلیت‌های صفحه فیلم به همراه:

* فصل‌ها
* قسمت‌ها
* تاریخ انتشار
* مدت زمان هر قسمت
* تصاویر اپیزودها

### `/watchlist`

مدیریت آثار ذخیره‌شده و وضعیت تماشا.

### `/contact`

صفحه ارتباط با ما با طراحی تعاملی مبتنی بر GSAP و **Staggered Grid**.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/your-username/filmino.git
cd filmino
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

یک فایل `.env.local` در ریشه پروژه ایجاد کنید:

```env
TMDB_API_KEY=your_tmdb_api_key
TMDB_ACCESS_TOKEN=your_tmdb_access_token
NEXT_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p
```

> برای دریافت API Key و Access Token به حساب کاربری خود در TMDB نیاز دارید.

## 4. Run the development server

```bash
npm run dev
```

سپس به آدرس زیر بروید:

```text
http://localhost:3000
```

## 5. Production Build

```bash
npm run build
npm run start
```

---

# 🔐 API Architecture

برای مدیریت دسترسی به TMDB، درخواست‌ها مستقیماً از Client به API اصلی ارسال نمی‌شوند.

به‌جای آن، پروژه از یک **Server-side Proxy** استفاده می‌کند:

```text
Client
   │
   ▼
/api/tmdb/[...path]
   │
   ▼
TMDB API
```

این معماری باعث می‌شود:

* کلیدهای حساس API در Server باقی بمانند.
* درخواست‌ها از طریق Backend پروژه مدیریت شوند.
* منطق ارتباط با TMDB در یک نقطه متمرکز شود.
* امکان کنترل و توسعه لایه API در آینده وجود داشته باشد.

---

# 🎨 UI & Animation System

یکی از اهداف اصلی Filmino، ایجاد تجربه‌ای فراتر از یک آرشیو ساده فیلم است.

برای این منظور از مجموعه‌ای از کامپوننت‌های تعاملی استفاده شده است:

### 3D Book Showcase

نمایش آثار منتخب به صورت یک کتاب سه‌بعدی تعاملی با قابلیت تعامل با Mouse، Touch و Drag.

### Staggered Grid

گرید تعاملی مورد استفاده در صفحه Contact با انیمیشن‌های ورود، Hover و Transitionهای نرم.

### ScrollTrigger

اتصال انیمیشن‌ها به موقعیت Scroll برای ایجاد تجربه بصری پویا و سینمایی.

---

# 🧠 Data Management

داده‌های سمت Client با استفاده از **TanStack Query** مدیریت می‌شوند.

این لایه مسئول:

* Fetching
* Caching
* Synchronization
* مدیریت وضعیت Loading
* مدیریت خطاهای API

است.

در کنار آن، قابلیت Watchlist برای داده‌های محلی از `localStorage` استفاده می‌کند تا کاربر بدون نیاز به حساب کاربری بتواند آثار مورد علاقه خود را ذخیره کند.

---

# 🧩 Key Technical Challenges

در طول توسعه Filmino چند چالش مهم فنی حل شده است:

### 🎨 Design System Consistency

یکپارچه‌سازی کامل رنگ‌ها، Borderها، Buttonها، Glowها و Cardها برای ایجاد یک Visual Language یکپارچه.

### 🎭 Complex Animation Management

پیاده‌سازی و بهینه‌سازی انیمیشن‌های GSAP، مخصوصاً در بخش Staggered Grid و ویترین‌های سه‌بعدی.

### ⚡ Performance Optimization

کاهش Re-renderهای غیرضروری، استفاده مناسب از Client Components و Server Components و مدیریت Cache داده‌ها.

### 🔍 Search & Filtering

تلفیق جست‌وجوی سریع با فیلترهای چندگانه بدون ایجاد تجربه کاربری نامناسب یا Reloadهای غیرضروری.

### 🌐 API Integration

طراحی Proxy داخلی برای TMDB و جداسازی منطق API از رابط کاربری.

---

# 📸 Screenshots

> Screenshots پروژه را می‌توان در این بخش اضافه کرد.

```text
screenshots/
├── home.png
├── browse.png
├── search.png
├── movie-details.png
├── tv-details.png
└── watchlist.png
```

---

# 🗺 Roadmap

برخی قابلیت‌هایی که می‌توانند در نسخه‌های آینده اضافه شوند:

* [ ] Authentication & User Accounts
* [ ] Cloud-based Watchlist
* [ ] User Ratings & Reviews
* [ ] Personalized Recommendations
* [ ] Advanced Pagination / Infinite Scroll
* [ ] PWA Support
* [ ] Internationalization
* [ ] Better SEO & Structured Data
* [ ] Automated Testing
* [ ] CI/CD Pipeline

---

# ⚠️ Environment Variables

اطلاعات حساس پروژه را در Git ذخیره نکنید.

فایل زیر برای همین منظور در Repository قرار گرفته است:

```text
.env.example
```

فایل واقعی:

```text
.env.local
```

باید در `.gitignore` قرار داشته باشد.

---

# 📄 License

This project is created for educational and portfolio purposes.

Movie and TV data are provided by [TMDB](https://www.themoviedb.org/).

Filmino is not affiliated with or endorsed by TMDB.

---

## 👨‍💻 Author

**Abalfazl Daryoushi**

Computer Engineering Student & Software Developer

* GitHub: [@your-username](https://github.com/your-username)
* LinkedIn: [Your LinkedIn](https://linkedin.com/)
* Telegram: [@daryoushi_dev](https://t.me/daryoushi_dev)


