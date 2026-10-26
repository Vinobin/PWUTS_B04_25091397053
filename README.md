# KantinKita — UTS Pemrograman Web

**Mahasiswa:** Bintang Rahmad Novianto  
**NIM:** 25091397053  
**Kelas:** D4 Manajemen Informatika 2025B  
**Kelompok proposal:** 4  
**Topik:** Sistem Pemesanan Makanan Kantin Kampus Berbasis Web

## Ringkasan

Ini adalah **proyek UTS individu** berdasarkan proposal kelompok KantinKita.
hanya front end Tidak ada PHP, database, atau pengiriman transaksi sungguhan. Setelah validasi berhasil, aplikasi membuat **bukti pesanan simulasi** di browser, termasuk catatan opsional pelanggan. Kode `KK-...` merupakan kode contoh, bukan nomor transaksi nyata.

## Pemetaan tugas UTS

| Poin | Implementasi | File |
|---|---|---|
| **2.a** Homepage responsif HTML/CSS/JS + navigasi AJAX | Halaman utama, header, hero, CTA, menu unggulan; URL hash dan `fetch()` memuat `pages/*.html` tanpa full reload | `index.html`, `pages/beranda.html`, `assets/style.css`, `assets/app.js` |
| **2.b** Konten interaktif | Katalog makanan/minuman/camilan, pencarian, filter, urut harga, tambah/kurangi/hapus isi keranjang, total otomatis, `localStorage` | `pages/menu.html`, `assets/menu.json`, `assets/app.js` |
| **2.c** Form transaksi + validasi JS | Nama, email, kategori pengguna, metode bayar, catatan opsional, checkbox persetujuan; kesalahan ditampilkan sebelum tombol berhasil; contoh bukti pesanan | `pages/pesan.html`, `assets/app.js` |
| **2.d** Tiap mahasiswa berbeda | Bagian Bintang terbatas pada pelanggan, bukan pengelolaan menu atau status pembayaran | Pembagian kelompok |
| **2.e** Dokumentasi | Tujuan, struktur berkas, panduan, pengujian, keterbatasan | `README.md` |

**Catatan persyaratan:** Instruksi 2.c menyebut validasi JavaScript *sebelum submit ke server HTTP*. Dalam versi tanpa backend ini, validasi dan simulasi submit ada, namun **tidak ada transaksi yang benar-benar dikirim atau diterima server**.
## Struktur proyek

```text
PWUTS_B04_25091397053/
├── index.html
├── pages/
│   ├── beranda.html
│   ├── menu.html
│   └── pesan.html
├── assets/
│   ├── app.js
│   ├── style.css
│   ├── menu.json
│   └── images
└── README.md
```

## Cara menjalankan di XAMPP

3. Buka **XAMPP Control Panel** → nyalakan **Apache** saja. **MySQL tidak diperlukan**.
4. Buka `http://localhost/PWUTS_B04_25091397053/` di browser. **Jangan membuka `index.html` dengan double-click**, karena navigasi AJAX memerlukan HTTP.
5. Gunakan alur Beranda → Menu Kantin → + Tambah → Pesan → isi form → Buat pesanan.

## Skenario uji

1. Periksa tampilan desktop dan sempit (DevTools responsive).
2. Klik Beranda, Menu Kantin, Pesan.
3. Cari `nasi`; filter kategori `Minuman`; urutkan termurah/termahal.
4. Tambahkan menu, ubah jumlah dengan `+` dan `−`, hapus, periksa total harga dan badge di header.
5. Klik `Buat pesanan` dengan kolom kosong untuk memicu pesan validasi.
6. Isi contoh nama `Bintang`, email `bintang@example.com`, kategori `Mahasiswa`, pembayaran `Tunai di kantin`, catatan `Sambal dipisah`, centang persetujuan dan submit.
7. Pastikan tampil kode contoh `KK-...`, menu yang dipesan, total, dan catatan `Sambal dipisah`. Keranjang kembali kosong.
8. Periksa bahwa **tidak ada pesan database error** dan tidak perlu import SQL.

## Penjelasan singkat

- **AJAX:** `route()` meminta berkas `pages/beranda.html`, `pages/menu.html`, atau `pages/pesan.html` dengan `fetch()` dan memasangnya pada `#main`. Pergantian hash `#menu`/`#pesan` tidak me-reload halaman.
- **Katalog:** `renderMenu()` menyaring daftar menu berdasarkan pencarian, kategori, dan urutan harga dari `assets/menu.json`.
- **Keranjang:** fungsi `change()`, `renderCart()`, dan `saveCart()` menangani jumlah dan total; disimpan sementara di `localStorage`.
- **Validasi:** `submitOrder()` memeriksa kelengkapan/format nama, email, kategori, metode pembayaran, catatan maksimal 200 karakter, persetujuan, serta minimal satu produk di keranjang.
- **Simulasi:** bila valid, `showReceipt()` membuat bukti contoh pada halaman tanpa HTTP POST. Input ditampilkan dengan `textContent` agar karakter HTML pelanggan tidak ditafsirkan sebagai markup.

## Batasan

- Tidak ada akun, PHP, MySQL, admin, maupun integrasi pembayaran.
- Tidak ada pencatatan pesanan sungguhan atau pengurangan stok pusat. Stok berasal dari `menu.json` sebagai data contoh.
- Keranjang menggunakan localStorage di browser tempat aplikasi dibuka, dan bukti hanya muncul setelah simulasi checkout.
