# Website Redesign Plan — Simple, Single-Page, trueawrah.com-style

**Tareekh:** 8 Nov 2026
**Kis ke liye:** Google Antigravity (Planning mode). Ye file "kya banana hai" batati hai; prompts Section 8 mein hain.
**Scope:** sirf `hijabulmunazza-SinglePageIntroWebsite/` (website). Engine / admin / AGENTS.md rules waise hi rahenge.
**Reference site:** https://trueawrah.com/ — **layout aur feel** copy karni hai, **text, images, logo, brand name bilkul nahi** (wo ek alag brand hai, men's activewear).

---

## 1. Abhi kya ghalat hai (audit, 8 Nov 2026 — `main` branch, localhost:3000)

| # | Masla | Detail |
|---|-------|--------|
| 1 | **Bohot busy / heavy design** | 3 fonts (Cormorant + Playfair + Inter), gold borders, gradients, ticker bar, badges, chat popup, watermark — sab ek saath. trueawrah: 1 font, white background, bohot saari khali jagah. |
| 2 | **Media queries toote hue hain** | `style.css` mein sirf 3 breakpoints (`640`, `768`, `1024`) aur wo bhi file ke aakhir mein idhar udhar. Mobile pe header ka logo text "MANUFACTURER & WHOLESALE • EST. 2026" icons ke neeche ghus jata hai, ticker overlap karta hai, hero ka text container se bahar jata hai. Koi mobile-first approach nahi. |
| 3 | **Tags bohot zyada** | Har card pe: 2 image badges (FACTORY BESTSELLER + INTEGRATED NIQAB) + category label + specs line + 3 swatches + 3 prices (current, original, wholesale) + 3 buttons (WhatsApp, Insta, TikTok) + View Details. trueawrah card: 1 badge, title, colour, 1 line, price, 1 button. |
| 4 | **Scroll smooth nahi** | Sirf `scroll-behavior: smooth` (ye sirf anchor links pe asar karta hai). trueawrah **Lenis** library use karta hai — wheel/touch scroll pe inertia aati hai. |
| 5 | **Alag collection page** | `collection.html` + home pe "View Entire Catalog" button. Aap chahte hain: **sab products home page pe**, koi alag page nahi. |
| 6 | **Currency / country** | Nahi hai. Chahiye: header mein `🇵🇰 PK · PKR` dropdown → country chunein → saare prices us currency mein (estimate) dikhein. |
| 7 | **CSS bohot bara** | `style.css` 2,938 lines — purane cart/checkout, collection, ticker, chat ke styles sab ek file mein. |

---

## 2. Target design (trueawrah se jo lena hai)

Maine trueawrah ko browser mein naap kar ye values nikali hain:

| Cheez | trueawrah | Hijab ke liye |
|-------|-----------|---------------|
| Font | Montserrat (sirf 1), headings bold | **1 font**: Montserrat ya Inter (Inter already loaded hai). Headings 600–700 weight. Serif fonts hata dein. |
| Background | Pure white `#fff`, text near-black | White + cream section cards (`#f5f3ee`) + ek accent (brand ka gold/sage) sirf buttons/links ke liye |
| Header | Sticky, 81px, white; logo left · nav centre (3 items) · right: `PK · PKR` pill + account + cart icons | Sticky 72px: logo left · nav centre (Home · Collection · Wholesale · Contact — **sab same page ke anchors**) · right: **Country/Currency pill** + WhatsApp icon. Mobile: logo + currency pill + hamburger. |
| Announcement bar | 1 line, black, centred, chhota text | 1 line, chhota: "Free delivery on orders over Rs 2,500 · Open parcel check · COD" — **ticker/animation nahi** |
| Hero | Centred bara heading (3 lines), 1 sub-line, 1 button, neeche 2 product photos | Same: centred heading (Roman Urdu/English), 1 line, **1 button** ("Collection dekhein" → scroll), neeche 2 abaya photos |
| Feature strip | 4 cards, light grey bg, icon circle + bold title + 1 line | 4 cards: Open Parcel COD · Factory Rates · 7-Day Exchange · Nationwide Delivery |
| Section spacing | `padding: 80px 0` har section | Same (`clamp(48px, 8vw, 80px)`) |
| Product grid | Eyebrow "TOP SELLERS" + H2; `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`; card: white, 1px light border, radius 16px, **koi shadow nahi**; image square (1:1); 1 badge bottom-left on image (white pill, 12px); title 22px; colour name; 1-line description; price 18px bold + strike original; 1 black pill button right | Same, **1 col mobile / 2 col tablet / 3 col desktop**. Card contents Section 3 mein. |
| Smooth scroll | Lenis (`<html class="lenis">`) | **Lenis** via CDN (Section 5) |
| Footer | Logo + tagline · Quick Links · Follow · policies row · "Display rates by ExchangeRate-API" | Same 3 columns + policy links (privacy, terms, faq) + rates attribution |

**Jo trueawrah se NAHI lena:** unka text, unke product names, unki images, logo, "Giveaway", "Track Order", cart/account icons (hamari site pe order nahi hota).

---

## 3. Product card — simple version

```
┌──────────────────────────┐
│  [ product image 1:1 ]   │
│  ▪ BESTSELLER (1 badge,  │  ← sirf 1 badge, aur sirf jahan zaroori ho
│    optional)             │
├──────────────────────────┤
│ Signature French Jilbab  │  ← title (2 lines max)
│ Midnight Navy ● ● ●      │  ← colour name + swatches (max 3)
│ Korean crepe · Niqab     │  ← 1 line, max 2 points
│ Rs 4,850  ~~Rs 6,500~~   │  ← price (currency selector se badlega)
│ [ WhatsApp ]  [ DM ]     │  ← sirf 2 buttons
└──────────────────────────┘
```

**Hatao:** doosra badge, "FRENCH JILBABS" category label, wholesale price line (ye Wholesale section mein ek dafa likhein), TikTok button (TikTok sirf header/footer mein), "View Details" overlay (poora card click → `product.html`).

**Badge sirf 3 types:** `Bestseller`, `New`, `Sale` — aur ek product pe sirf ek.

---

## 4. Single page structure (collection page khatam)

```
1. Announcement bar (1 line)
2. Header (sticky)
3. Hero
4. Feature strip (4)
5. Collection  ← SAB products yahin. Filter pills: All · Jilbabs · Abayas · Hijabs
                 Pehle 9 dikhein, neeche "Mazeed dekhein" button se baqi load (same page).
6. Wholesale (ek simple card: MOQ, rate, WhatsApp button)
7. Reviews (3 cards, scroll-snap row on mobile)
8. Latest from Instagram (already hai, data/posts.json)
9. Opt-in form (already hai — modal ke bajaye page section)
10. Footer
```

- `collection.html` → `archive/` mein move; `.htaccess`/`_redirects` mein `/collection.html → /#collection`.
- `product.html` rahega (detail page), lekin usi simple design mein.
- Chat popup aur watermark: **hata dein** ya sirf ek chhota WhatsApp floating button rakhein (trueawrah pe bhi koi popup nahi).

---

## 5. Smooth scroll (Lenis)

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.4/dist/lenis.min.js"></script>
<script>
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  // anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href')); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: -72 });
  }));
</script>
```
- CSS se `scroll-behavior: smooth` hata dein (Lenis ke saath conflict).
- `prefers-reduced-motion: reduce` pe Lenis start na karein.
- Version CDN pe check karke pin karein.

---

## 6. Country / Currency selector (header)

**Behaviour (trueawrah jaisa):**
- Header pill: `🇵🇰 PK · PKR ⌄` → click → dropdown: title "Choose your display country", sub-line "Rounded price estimates. Payment stays in PKR.", search box, country list (flag + name + code), footer line "Prices are shown and charged in PKR."
- Country chunte hi **page ke saare prices** us currency mein badal jayein (cards, product page, wholesale, reviews mein likhe prices nahi).
- Choice `localStorage` mein save; agli visit pe wahi.
- Pehli visit: default **PK · PKR** (IP-detection nahi — simple rakhein).

**Implementation:**
1. HTML mein har price ko data attribute do: `<span class="price" data-pkr="4850">Rs 4,850</span>`. Original/strike price bhi: `data-pkr="6500"`.
2. `js/currency.js`:
   - Country → currency map (sirf ~25 countries jahan se customers aate hain: PK, SA, AE, QA, KW, OM, BH, GB, US, CA, AU, DE, FR, NL, SE, NO, TR, MY, ID, SG, ZA, IN, BD, EG, IR) — poori duniya ki list zaroori nahi; baqi ke liye "USD" fallback.
   - Rates: **build-time JSON** `data/rates.json` (`{ "base": "PKR", "date": "...", "rates": { "USD": 0.0036, ... } }`). Ek chhota script `scripts/update_rates.js` ExchangeRate-API (free tier) se hafte mein ek baar ye file update kare — browser se live API call **nahi** (key leak + rate limit). Agar `rates.json` purana (>14 din) ho to bhi chale, sirf "estimate" likha rahe.
   - Format: `Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })` → "$17", "SAR 65", "£14". Rounding: 10 se upar → integer; chhote amounts 1 decimal.
   - PKR pe wapas aaye to original "Rs 4,850" text.
3. WhatsApp/DM prefilled message mein **hamesha PKR** likha jaye (payment PKR mein hai).
4. Footer: "Display rates by ExchangeRate-API" (unki free tier ki shart hai).

---

## 7. CSS / responsive rules (media queries theek karna)

- **Nayi `css/style.css` scratch se** (purani → `archive/css/style.old.css`). Target: < 900 lines.
- **Mobile-first:** base styles = 375px; phir `@media (min-width: 640px)`, `(min-width: 900px)`, `(min-width: 1200px)` — sirf ye 3, file ke us hisse ke saath jahan component hai (header ke media queries header ke neeche, card ke card ke neeche).
- Container: `max-width: 1200px; padding-inline: 16px` (mobile) → `24px` (≥640) → `32px` (≥900).
- Grid: `grid-template-columns: 1fr` → `repeat(2,1fr)` @640 → `repeat(3,1fr)` @900. Gap 16px → 24px.
- Typography: `clamp()` se — H1 `clamp(32px, 6vw, 56px)`, H2 `clamp(26px, 4vw, 40px)`, body 16px.
- Images: `aspect-ratio: 1/1; object-fit: cover; width: 100%` — koi fixed height nahi.
- Header mobile: logo (sirf image/wordmark, tagline text nahi) + currency pill + hamburger; nav full-screen overlay.
- `font-display: swap`, sirf 1 Google font 2 weights (400, 600/700).
- Buttons: min-height 44px (touch), full-width on mobile.
- Horizontal overflow test: `document.documentElement.scrollWidth === innerWidth` har breakpoint pe.
- Font Awesome hata ke sirf 4–5 inline SVG icons (WhatsApp, Instagram, TikTok, search, chevron) — page halka hoga.

---

## 8. Antigravity prompts (copy → paste, order mein)

Workspace: `Hijab ul munnazah`. Har prompt se pehle Antigravity Implementation Plan dega — approve karein, phir code.

### Prompt W1 — Base: nayi CSS, header, hero, Lenis

```text
Read AGENTS.md and docs/PLAN_Website-Redesign.md fully. Work only in hijabulmunazza-SinglePageIntroWebsite/. Branch: website-redesign.
Goal: rebuild the home page in the simple, airy style described in plan sections 2, 5 and 7 (layout/feel of trueawrah.com — never its text, images or branding).
1. Move css/style.css to archive/css/style.old.css. Write a new mobile-first css/style.css (base = 375px; breakpoints only at min-width 640 / 900 / 1200), one font (Inter 400/600/700), white background, cream section cards, one accent colour from the current design-system.css. Keep css/design-system.css variables.
2. index.html: announcement bar (1 static line, no ticker), sticky header (logo left, 4 anchor nav links centre, currency pill placeholder + WhatsApp icon right; mobile = logo + pill + hamburger with full-screen menu), hero (centred H1, 1 line, 1 button that scrolls to #collection, 2 product photos below), 4-card feature strip. Remove the chat popup, watermark and ticker (archive the JS).
3. Add Lenis smooth scroll exactly as in plan section 5; remove scroll-behavior:smooth; respect prefers-reduced-motion.
4. Replace Font Awesome with inline SVG icons.
Keep the other sections untouched for now (they will be restyled in W2) but make sure nothing overflows horizontally at 375px.
Done when: 375px and 1280px screenshots show no overflow, header never overlaps, Lenis scrolling works; docs/PROGRESS.md updated. Commit, do not push.
```

### Prompt W2 — Single-page collection + simple cards

```text
Continue on branch website-redesign. Read docs/PLAN_Website-Redesign.md sections 3 and 4.
1. Move ALL products from collection.html into index.html #collection (one source: create data/products.json with id, title, colourName, swatches, badge (one of bestseller|new|sale|null), line, pricePkr, originalPkr, images, category; render cards from it with a small js/products.js). Show 9 first, "Mazeed dekhein" button appends the rest on the same page. Filter pills: All · Jilbabs · Abayas · Hijabs.
2. Card = exactly plan section 3: 1:1 image, max ONE badge (white pill bottom-left), title (2 lines), colour name + up to 3 swatches, one spec line, price + strike price, two buttons (WhatsApp, Insta DM). Whole card links to product.html?id=... Remove category label, wholesale price line, TikTok button and View Details overlay from cards.
3. Move collection.html to archive/ and add a redirect rule for /collection.html → /#collection (Cloudflare _redirects file). Update every nav/footer link.
4. Restyle Wholesale, Reviews, Instagram feed, Opt-in (now a page section, not a modal) and Footer to the new style; keep their content and the existing Supabase/analytics logic in js/main.js and js/config.js working.
5. product.html: same header/footer/card styling; keep WhatsApp/DM prefill logic.
Done when: all products appear on the home page, cards match the plan sketch, no page links to collection.html, 375/640/900/1280 screenshots attached, PROGRESS.md updated. Commit, do not push.
```

### Prompt W3 — Country / currency selector

```text
Continue on branch website-redesign. Read docs/PLAN_Website-Redesign.md section 6.
1. Every price in index.html, product.html and data/products.json renders with data-pkr. Build js/currency.js: header pill "🇵🇰 PK · PKR ⌄" → dropdown (title "Choose your display country", sub-line "Rounded price estimates. Payment stays in PKR.", search input, country list with flag + name + code, footer line "Prices are shown and charged in PKR."). Selecting a country converts all data-pkr prices using data/rates.json and Intl.NumberFormat; saves choice in localStorage; PKR restores the original "Rs x,xxx" text. Keyboard + mobile friendly (bottom sheet on <640px).
2. data/rates.json (base PKR) + scripts/update_rates.js that fetches ExchangeRate-API using an API key from an environment variable (never in code) and rewrites the JSON. Do NOT call the API from the browser. Add the "Display rates by ExchangeRate-API" footer line.
3. WhatsApp / Instagram prefilled messages must always state the PKR price.
Done when: choosing SA, GB and US converts every visible price and persists on reload; PKR restores exact original text; PROGRESS.md updated. Commit, do not push.
```

### Prompt W4 — Polish + check

```text
Continue on branch website-redesign.
1. Audit every page (index, product, contact, faq, privacy, terms) at 375 / 640 / 900 / 1280 with the browser agent: no horizontal overflow, header never overlaps content, tap targets ≥ 44px, images not stretched. Fix what you find.
2. Lighthouse-style checks: single font, no unused CSS from the archive, images lazy-loaded, total CSS < 900 lines.
3. Walkthrough with before/after screenshots at 375 and 1280. PROGRESS.md: what changed, how to test, what is left.
Commit, do not push. Wait for the owner before merging to main.
```

---

## 9. Aapke faislay (W1 se pehle)

1. Font: **Inter** (already hai) ya **Montserrat** (trueawrah wala)?
2. Accent colour: maujooda gold rakhein ya sage/olive (abaya photos ke saath)?
3. Hero mein 2 photos kaunsi (navy + mocha jilbab)?
4. Chat popup: poora hatana hai ya sirf ek chhota floating WhatsApp button?
5. Currency list: upar wali 25 countries kaafi hain?
6. Wholesale price har card se hata kar sirf Wholesale section mein — theek hai?

---

## 10. Sources

- trueawrah.com ko 8 Nov 2026 ko browser mein naapa: Next.js app, Montserrat, Lenis smooth scroll, sticky 81px header, grid `sm:grid-cols-2 lg:grid-cols-3` gap 24px, section padding 80px, card radius 16px, no shadow, 1:1 images, "Display rates by ExchangeRate-API".
- [Lenis (GitHub)](https://github.com/darkroomengineering/lenis)
- [ExchangeRate-API docs](https://www.exchangerate-api.com/docs/overview)
