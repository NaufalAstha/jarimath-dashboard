# Jarimath Kids Dashboard

Dashboard admin sederhana dengan HTML, CSS, JavaScript vanilla, dan Supabase Auth. Login hanya tersedia untuk akun admin yang sudah dibuat di Supabase; tidak ada halaman pendaftaran.

Halaman login tersedia di `index.html`; setiap bagian dashboard memiliki file HTML tersendiri di folder `html/`: `dashboard.html`, `siswa.html`, `mentor.html`, dan `keuangan.html`. Perilaku data dashboard dikelola bersama oleh `js/app.js`; semua halaman memakai helper klien `js/supabase-client.js`.

## Fitur dashboard

- Navigasi Dashboard, Data Siswa, Data Mentor, dan Laporan Keuangan.
- Grafik garis ringkasan dashboard yang dapat diganti antara murid baru, revenue, margin profit, dan cost, dengan filter periode harian, mingguan, bulanan, dan tahunan.
- Setiap bagian dashboard dapat dibuka langsung melalui file HTML masing-masing.
- Data siswa dan mentor dapat ditambah, diubah, dihapus, dan dicari.
- Data siswa mencatat informasi orang tua, usia, asal sekolah, dan program; admin dapat mengelola nama program beserta SPP bulanannya.
- Data mentor mencatat nama dan nomor telepon; admin dapat mengatur tarif per anak, batas siswa harian, dan tanggal pembayaran default maupun khusus per mentor.
- Dashboard mendukung penugasan mentor-siswa per tanggal dan menghitung pendapatan bulanan berdasarkan jumlah siswa unik yang diajar; pembayaran bulan sebelumnya disimpan sebagai biaya ketika admin membuka halaman setelah tanggal jatuh tempo.
- Transaksi pemasukan/pengeluaran dapat dikelola; biaya tetap bulanan dihitung otomatis mulai tanggal yang ditentukan, ringkasan saldo diperbarui, dan laporan dapat diunduh sebagai CSV.
- Data pada halaman admin tersimpan di Supabase setelah skema database dijalankan. Mode demo tetap memakai data contoh dan penyimpanan lokal browser; data demo tidak dikirim ke Supabase.
- Login admin tetap menggunakan Supabase Auth dan membutuhkan konfigurasi seperti di bawah.

## Struktur folder

```text
.
├── index.html
├── html/
│   ├── dashboard.html
│   ├── siswa.html
│   ├── mentor.html
│   └── keuangan.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── login.js
│   ├── config.js
│   └── supabase-client.js
├── supabase/
│   └── schema.sql
└── README.md
```

## Menjalankan project

1. Buat project di [Supabase](https://supabase.com/) dan buka **Project Settings → API**.
2. Isi `url` dan `anonKey` pada `js/config.js` dengan **Project URL** dan **anon/public key** project Anda. Jangan gunakan `service_role` key.
3. Buat akun admin dari **Authentication → Users → Add user** di Supabase. Jangan menambahkan fitur signup publik.
4. Jalankan seluruh isi `supabase/schema.sql` di **SQL Editor** project Supabase untuk membuat atau memperbarui tabel serta kebijakan aksesnya. Skrip menambahkan tabel program, biaya tetap, penugasan mentor, pembayaran mentor, dan pengaturan pembayaran beserta kolom siswa/mentor yang baru.
5. Jalankan project melalui server lokal (contohnya ekstensi VS Code Live Server), lalu buka alamat lokal yang diberikan.

Kebijakan tabel hanya mengizinkan pengguna terautentikasi; buat akun admin melalui Supabase dan jangan mengaktifkan pendaftaran publik. Jangan pernah memasukkan `service_role` key ke kode frontend. Jika tabel atau kebijakan belum disiapkan, dashboard menampilkan pesan error Supabase alih-alih mengganti data admin dengan data demo. Jika autentikasi gagal, halaman login menampilkan pesan konfigurasi, koneksi, konfirmasi email, pembatasan percobaan, atau kredensial sesuai error yang diterima dari Supabase.
