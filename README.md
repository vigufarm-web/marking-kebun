# Marking Kebun

Aplikasi mencatat satu titik per tandan, warna pita, tanggal, posisi, blok, perubahan warna dan panen. Petugas masuk dengan akun sendiri; nama diambil dari akun, bukan ditulis setiap kali. GPS mulai mencari posisi setelah masuk, tetapi izin lokasi tetap harus diberikan pada HP. GPS dapat meleset dan tidak menjamin dua titik mewakili tandan yang berbeda.

## Penggunaan

Buka aplikasi, masuk dengan email dan password, izinkan lokasi, pilih tanggal, tunggu posisi dan tekan warna pita. Pilih titik untuk merevisi atau menandai panen. Admin dapat membuat akun petugas melalui menu Kelola akun petugas. Semua petugas yang terdaftar dapat membaca seluruh peta dan catatan marking. Password awal dimasukkan langsung oleh admin ke aplikasi dan tidak boleh dikirim ke log atau ditulis di repositori.

Batas blok yang diunggah admin tersimpan privat dan dimuat oleh perangkat anggota. Peta GIS adalah salinan; perubahan GIS tidak otomatis masuk dan harus diunggah ulang. Peta dasar mungkin kosong tanpa internet. Saat offline catatan disimpan di browser, lalu dikirim saat koneksi kembali. Tunggu status Tersinkron sebelum menutup atau membersihkan browser. Cadangkan data rutin; jangan memakai mode privat.

## Penyiapan proyek baru

1. Buat proyek Supabase khusus, nonaktifkan pendaftaran publik, dan jalankan `supabase.sql`.
2. Buat akun admin melalui Supabase Authentication, lalu masukkan UUID, nama dan peran admin ke `marking_members` melalui SQL Editor. Hanya anggota terdaftar yang mendapat akses.
3. Ganti UUID admin pada `boundary-migration.sql`, jalankan sekali, dan unggah peta sebagai admin.
4. Deploy `supabase/functions/marking-users/index.ts` sebagai Edge Function `marking-users`; service role key hanya boleh berada di server. Kunci publishable/anon aman untuk browser selama RLS aktif. Jangan pernah menaruh secret/service role key di repositori.
5. Untuk proyek yang menggunakan skema lama, adaptasi `member-profile-migration.sql`; gunakan RLS yang mewajibkan ID serta nama pembuat sesuai akun. Catatan lokal lama tanpa identitas akun tidak otomatis dikirim agar tidak salah atribusi.

Setiap perubahan disimpan sebagai peristiwa baru. ID unik mencegah pengulangan; saat dua petugas merevisi tandan yang sama pada tanggal yang sama, catatan terakhir menurut waktu dan ID menjadi tampilan aktif sementara riwayat tetap ada. Jam HP yang tidak benar dapat mengacaukan urutan. Aplikasi belum menyediakan perbaikan administrasi atas data lama, manajemen perubahan password, atau sinkronisasi otomatis peta dari GIS.
