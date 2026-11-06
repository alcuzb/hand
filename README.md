# HandShape

**Qo‘l harakatlari bilan boshqariladigan 3D shakl.** Hammasi brauzerda ishlaydi, backend va `npm` kerak emas. / A 3D shape controlled by hand gestures, fully in the browser.

## Boshqaruv
- **Birinchi qo‘l** shaklni olib yuradi. Ko‘tarilgan barmoqlar soni shaklni tanlaydi: 0 silindr, 1 chiziq, 2 tekis rom, 3 uchburchakli prizma, 4 kub, 5 beshburchakli prizma.
- **Ikkinchi qo‘l:** chimdish yoki musht — kichraytiradi, ochiq kaft — kattalashtiradi; ko‘rsatkich barmoqni tez siltash — aylantiradi; bilakni burash — qiyalatadi.

## Ishga tushirish
`python -m http.server 5500` va http://localhost:5500 (kamerani ruxsat bering). Kamerasiz sinash: `/?demo`.
Yoki GitHub Pages orqali onlayn qo‘ying (HTTPS).

## Sozlash
`app.js` boshidagi `CFG` — tezlik, balandlik, o‘lcham, aylanish.

Texnologiyalar: Three.js, MediaPipe Hand Landmarker (CDN orqali).
