# Uniport Executive Dashboard (React + Vite + TypeScript)

Prototipe peragaan dashboard eksekutif Asuransi Sinar Mas berdasarkan PRD "Uniport Executive Dashboard".
Hasil build berupa **satu berkas HTML mandiri** (`dist/index.html`) yang bisa dibuka lewat `file://` tanpa server atau internet.

```bash
npm install
npm run dev        # server pengembangan + HMR
npm run build      # typecheck + dist/index.html (semua JS/CSS di-inline)
npm run typecheck
```

## Akses portal lewat tautan terenkripsi

> **Sementara dimatikan.** Secara bawaan URL dibuka seperti biasa dan langsung masuk sebagai portal Direksi. Untuk
> menyalakannya lagi, isi `VITE_AKSES_TAUTAN=aktif` di `.env`, lalu jalankan `npm run api`.

Tidak ada login/logout. Setiap pengguna membuka portal lewat tautan `…/?akses=<token>`. Frontend mengirim token ke
API (`POST /api/akses/dekrip`), dan API men-decrypt token itu (AES-256-GCM, kunci `AKSES_KUNCI` di `.env`, **hanya di
server**) menjadi `{ peran, unitId }`. Token yang diubah, palsu, atau kedaluwarsa ditolak dengan 401.

```bash
cp .env.example .env && npm run kunci   # salin baris AKSES_KUNCI=… ke .env
npm run api                             # layanan akses di :8787 (dev server meneruskan /api ke sini)
npm run dev
npm run link                            # tautan contoh untuk keempat portal
npm run link -- pemimpin-wilayah KW2 7  # tautan untuk unit tertentu, berlaku 7 hari
```

| Portal | Dapat melihat |
| --- | --- |
| Direksi | Semua Kantor Wilayah, cabang, dan MO |
| Pemimpin Wilayah | Cabang dan MO di wilayahnya |
| Pimpinan Cabang | MO di cabangnya |
| Marketing Officer | Data miliknya sendiri |

`tools/api-akses.mjs` adalah contoh acuan untuk tim TI. Seluruh data contoh masih ikut di dalam bundle browser, jadi
hierarki di atas baru ditegakkan di tampilan. Agar benar-benar aman, API produksi harus mengembalikan **hanya data dalam
cakupan** hasil decrypt, bukan sekadar peran.

## API backend Go (Matrix)

Frontend memanggil backend Go lewat `/api-go/…`. Dev server meneruskannya ke `URL_GO` di `.env`, karena backend tidak
mengirim header CORS. Alamat server internal pun tidak ikut tertulis di kode browser. Untuk build produksi, reverse proxy
harus menyediakan jalur `/api-go` yang sama, atau set `VITE_API_GO` ke alamat yang mengizinkan CORS.

| Endpoint | Method | Dipakai untuk |
| --- | --- | --- |
| `matrix/kanwils` | GET | Pilihan filter Pemimpin Wilayah (portal Direksi). Kalau tidak terjangkau, dipakai daftar lokal. |
| `matrix/branches` | POST, body `{"kanwil": "<value>"}` | Pilihan filter Pimpinan Cabang. `value` diambil dari pilihan filter wilayah (`kanwils`). Kalau tidak terjangkau, dipakai daftar lokal. |
| `matrix/marketings` | POST, body `{"branch": "<value>"}` | Pilihan filter Marketing Officer. `value` diambil dari pilihan filter cabang (`branches`). Cabang tanpa MO mengembalikan `[]`. |

Ketiga endpoint mengembalikan `{ success, data: [{ value, label }] }`.

Klien ada di `src/api/matrix.ts`.

## Data: CONTOH, bukan asli

Repo ini belum memuat ekspor eReport, HCQ, eTarget, atau Matrix Distribution. `src/data/sumber.ts` membangkitkan
rincian cabang, MO, prospek, dan effort dengan PRNG ber-seed, jadi angkanya sama setiap kali dimuat. Hanya total nasional
yang dijangkarkan ke angka PRD (NWP 2025 Rp 583,0 M, Jan–Jul 2026 Rp 298,8 M, target Rp 740,0 M). Cabang dan MO
memakai kode (`Cabang 1.01`, `MO-0001`), bukan nama asli. Nama nasabah dan prospek tidak ada di model data (Aturan Emas).
Untuk memakai data asli, ganti `bangkitkanData()` dengan pemuat yang mengembalikan bentuk `SumberData` yang sama.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/config/dashboard.ts` | Ambang, bobot, SLA, dan periode. Ikut ter-inline ke HTML, jadi jangan simpan rahasia di sini |
| `src/data/sumber.ts` | Model data + generator data contoh |
| `src/logika/` | Agregasi per cakupan/peran, prioritas, proyeksi, AI Insight berbasis aturan (bukan LLM), dan ekspor CSV |
| `src/components/` | Sidebar, Topbar, Kartu, ikon, dan grafik SVG buatan sendiri (tanpa pustaka chart) |
| `src/pages/` | Susunan lengkap untuk pimpinan dan susunan ringkas untuk Marketing Officer |

