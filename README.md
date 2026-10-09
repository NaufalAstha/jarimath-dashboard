# Jarimath Kids Dashboard

Dashboard admin sederhana dengan HTML, CSS, JavaScript vanilla, dan Supabase Auth. Login hanya tersedia untuk akun admin yang sudah dibuat di Supabase; tidak ada halaman pendaftaran.

## Struktur folder

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── config.js
└── README.md
```

## Menjalankan project

1. Buat project di [Supabase](https://supabase.com/) dan buka **Project Settings → API**.
2. Isi `url` dan `anonKey` pada `js/config.js` dengan **Project URL** dan **anon/public key** project Anda.
3. Buat akun admin dari **Authentication → Users → Add user** di Supabase. Jangan menambahkan fitur signup publik.
4. Jalankan project melalui server lokal (contohnya ekstensi VS Code Live Server), lalu buka alamat lokal yang diberikan.

Jangan pernah memasukkan `service_role` key ke kode frontend. Nilai metrik dan aktivitas saat ini berupa tampilan awal, belum terhubung ke tabel data Supabase.
