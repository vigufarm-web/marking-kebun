# Marking Kebun — percobaan

Aplikasi mencatat satu titik per tandan, pilihan warna pita, tanggal, posisi, blok, perubahan warna dan status panen. Untuk menjalankan lokal buka `Jalankan.cmd`. Unggah batas blok berupa ZIP SHP (.shp, .dbf, .prj) atau GeoJSON. GPS dapat meleset dan tidak menjamin dua titik mewakili tandan yang berbeda.

## Database bersama

Repositori ini tidak menyimpan data GPS. Sinkronisasi memerlukan proyek Supabase terpisah dan belum aktif sebelum disiapkan:

1. Buat proyek Supabase khusus, lalu jalankan `supabase.sql` di SQL Editor. Untuk peta bersama, ganti UUID admin pada `boundary-migration.sql` dan jalankan sekali.
2. Nonaktifkan pendaftaran umum. Buat akun petugas pada Authentication, dan untuk setiap akun yang boleh masuk daftarkan ID pengguna melalui SQL Editor: `insert into public.marking_members(user_id) values ('UUID-PENGGUNA');`. Hanya anggota yang didaftarkan dapat membaca dan menambah data. Semua anggota dapat membaca semua data marking; tidak ada pemisahan per blok.
3. Berikan URL proyek dan **publishable/anon key** ke petugas. Jangan pernah membagikan service role key atau secret key. Di aplikasi buka **Hubungkan database bersama**, isi URL, kunci publik, serta email dan password akun petugas masing-masing.
4. Tunggu status **Tersinkron**. Bila offline, catatan tetap lokal dan dicoba ulang saat koneksi kembali. Jangan hapus data browser sebelum sinkronisasi berhasil dan cadangan diunduh.

Setiap perubahan dicatat sebagai peristiwa baru. Klien menggabungkan ID unik dan menolak ID yang sama dengan isi berbeda. Bila dua petugas mengubah tandan yang sama, keadaan pada tanggal yang sama mengikuti waktu catatan dan ID sebagai penentu saat sama; koreksi memerlukan koordinasi petugas. Semua anggota dapat menambah peristiwa; aplikasi ini belum menyediakan peran admin, pemulihan atau pembatasan edit per orang.

Batas blok yang diunggah admin tersimpan secara privat dan dimuat oleh perangkat anggota. Peta GIS yang disalin adalah snapshot; pembaruan GIS tidak otomatis masuk dan harus diunggah ulang oleh admin. Peta dasar daring mungkin tidak tersedia tanpa internet; penggunaan offline memerlukan kunjungan awal saat online. Simpan cadangan rutin dan jangan menggunakan mode privat untuk data yang belum tersinkron.
