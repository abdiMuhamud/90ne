# 9ONE Café — website

Premium site for 9ONE Café, Masalaha, Hargeisa. Static HTML/CSS/JS — no build step.

- `index.html` — page structure
- `css/style.css` — design system and layout
- `js/main.js` — smooth scroll, reveals, menu, open/closed status
- `js/scene.js` — Three.js 3D hero (cup, latte art, steam, beans)
- `js/menu-data.js` — **edit prices and items here**
- `js/order.js` + `css/order.css` — in-site ordering: bag, sizes/sides, checkout (delivery, pickup, dine-in) sent to the café on WhatsApp (+252 63 883 3831)

Table QR codes: link to `https://90ne.vercel.app/?table=5` (any number) to open the site in dine-in mode for that table.
- `assets/img` — photography (from the in-house menu)

Run locally with any static server, e.g. `npx serve .`. Deploys to Vercel as a static site.
