<<<<<<< HEAD
# Uas-GEN-AI
=======
# SIGAP Kota — Prototype Chatbot Aduan Smart City

Prototype UAS Generative AI. Terdiri dari 2 sisi:

- **Warga** → `chat.html` (chatbot) dan `progress.html` (progres aduan mereka sendiri)
- **Admin/Petugas** → `admin.html` (dashboard + kelola semua aduan)

Warga TIDAK punya akses ke `admin.html` (gak ada link ke sana dari halaman warga) — itu cuma diakses langsung lewat URL, mensimulasikan pemisahan akses.

## Fitur utama
- Dashboard admin untuk melihat dan mengelola laporan warga
- Halaman chat untuk mengirim aduan lewat chatbot
- Halaman hasil untuk melihat ringkasan laporan
- Halaman riwayat untuk memantau status aduan
- Login sederhana petugas untuk mengelola laporan

## Cara menjalankan di VSCode

Karena data disimpan pakai `localStorage` yang perlu dibagi antar halaman, file-file ini **harus dibuka lewat server lokal**, bukan di-double-click langsung (kalau di-double click, browser buka pakai `file://` dan localStorage antar file kadang gak konsisten).

Paling gampang pakai extension **Live Server**:

1. Buka folder `sigap-kota` ini di VSCode
2. Install extension **Live Server** (by Ritwick Dey) dari Extensions marketplace
3. Klik kanan `chat.html` → **Open with Live Server**
4. Otomatis kebuka di `http://127.0.0.1:5500/chat.html`
5. Buka juga `progress.html` dan `admin.html` di tab browser lain dengan cara yang sama (klik kanan → Open with Live Server), supaya bisa lihat data-nya nyambung

Alternatif tanpa extension, kalau ada Python terinstall, jalanin di terminal folder ini:
```
python -m http.server 5500
```
lalu buka `http://localhost:5500/chat.html` dst.

## Setup API Key

1. Buka `chat.html`, isi nama kamu dan Gemini API key di pojok kanan atas (ambil gratis di https://aistudio.google.com/apikey)
2. Key otomatis kesimpen di browser (localStorage), gak perlu diisi ulang tiap buka

## Alur pemakaian buat demo/screenshot laporan

1. Buka `chat.html`, isi nama + API key, kirim beberapa aduan lewat chat
2. Buka `progress.html` di tab lain (nama yang sama) → lihat aduan-aduan tadi dengan status "Baru"
3. Buka `admin.html` → lihat semua aduan masuk di Dashboard & tab Kelola Aduan, ubah status jadi "Diproses"/"Selesai"
4. Balik ke `progress.html` (kalau tab masih kebuka) → status ikut ke-update otomatis (event `storage`)

## Keterbatasan (bahan evaluasi P7)

- Belum ada sistem login/autentikasi asli — "nama" cuma dipakai buat filter tampilan, bukan keamanan
- Gemini API key dipanggil langsung dari browser (client-side), bukan lewat backend yang aman
- localStorage cuma tersimpan per-browser di device itu, belum ada database pusat beneran
>>>>>>> bed6db6 (Initial commit: UAS GEN AI)
# Sigap-Kota---Gen-AI-
