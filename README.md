# SIGAP Kota

Tugas UAS Generative AI. Chatbot buat warga lapor masalah kota jalan rusak, sampah numpuk, banjir, dll terus petugas bisa pantau dan tindak lanjuti dari dashboard admin.

Ada dua pintu masuk: warga buka `index.html` buat ngobrol sama chatbot-nya, admin buka `admin.html` buat lihat dan kelola laporan yang masuk. Nggak ada link dari halaman warga ke admin, jadi akses admin cuma lewat URL langsung cukup buat simulasi pemisahan hak akses doang, belum ada autentikasi beneran.

## Cara kerjanya

Chatbot-nya nggak langsung nerima laporan mentah-mentah. Dia nanya satu-satu dulu: masalahnya apa, lokasinya di mana, udah parah belum, sejak kapan, sama nomor HP buat kontak. Baru setelah lengkap semua, AI-nya ngeklasifikasiin jadi laporan resmi kategori, prioritas, instansi yang harus nanganin dan muncul ringkasan sebelum warga klik kirim.

Warga bisa cek status laporannya sendiri lewat nomor HP di tab Riwayat. Petugas login di dashboard admin, lihat semua laporan masuk, ubah status jadi diproses/selesai.

## Setup

Backend-nya Express + SQLite + Gemini API. Jalanin:

```
npm install
```

Bikin file `.env` di root:
```
GEMINI_API_KEY=api-key-gemini-kamu
PORT=3000
```

Key-nya ambil gratis di https://aistudio.google.com/apikey.

Terus:
```
npm run dev
```

Frontend-nya harus dibuka lewat server lokal, jangan double-click file-nya langsung. Paling gampang pakai Live Server di VSCode klik kanan `Frontend/index.html`, pilih Open with Live Server. Atau kalau ada Python, jalanin `python -m http.server 5500` dari folder Frontend terus buka `localhost:5500/index.html`.

## Login admin (demo)

```
Username: petugas
Password: 123456
```

Ini hardcoded, bukan sistem login sungguhan — cuma buat kebutuhan demo.

## Yang masih kurang

Belum ada autentikasi asli, database-nya masih SQLite lokal (belum ada yang di cloud), dan kadang Gemini API-nya kena limit pas lagi rame dipakai orang banyak kalau itu kejadian, backend udah kasih pesan error yang jelas ke user, bukan error mentah.
