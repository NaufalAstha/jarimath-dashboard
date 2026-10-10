# Jarimath Kids Dashboard

Dashboard admin sederhana dengan HTML, CSS, JavaScript vanilla, dan Supabase Auth. Login hanya tersedia untuk akun admin yang sudah dibuat di Supabase; tidak ada halaman pendaftaran.

Halaman login (`index.html` dan `js/login.js`) dipisahkan dari dashboard (`dashboard.html` dan `js/app.js`). Keduanya memakai helper klien bersama `js/supabase-client.js`.

## Fitur dashboard

- Navigasi Dashboard, Data Siswa, Data Mentor, dan Laporan Keuangan.
- Data siswa dan mentor dapat ditambah, diubah, dihapus, dan dicari.
- Transaksi pemasukan/pengeluaran dapat dikelola; ringkasan saldo dihitung otomatis dan laporan dapat diunduh sebagai CSV.
- Tombol **Masuk ke mode demo** dapat digunakan tanpa konfigurasi Supabase. Mode ini memakai data contoh dan menyimpan perubahan di penyimpanan lokal browser; data demo tidak dikirim ke Supabase.
- Login admin tetap menggunakan Supabase Auth dan membutuhkan konfigurasi seperti di bawah.

## Struktur folder

```text
.
├── index.html
├── dashboard.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── login.js
│   ├── config.js
│   └── supabase-client.js
└── README.md
```

## Menjalankan project

1. Buat project di [Supabase](https://supabase.com/) dan buka **Project Settings → API**.
2. Isi `url` dan `anonKey` pada `js/config.js` dengan **Project URL** dan **anon/public key** project Anda. Jangan gunakan `service_role` key.
3. Buat akun admin dari **Authentication → Users → Add user** di Supabase. Jangan menambahkan fitur signup publik.
4. Jalankan project melalui server lokal (contohnya ekstensi VS Code Live Server), lalu buka alamat lokal yang diberikan.

Jangan pernah memasukkan `service_role` key ke kode frontend. Data siswa, mentor, dan transaksi pada versi ini adalah data demo lokal, belum terhubung ke tabel Supabase. Jika autentikasi gagal, halaman login menampilkan pesan konfigurasi, koneksi, konfirmasi email, pembatasan percobaan, atau kredensial sesuai error yang diterima dari Supabase.
