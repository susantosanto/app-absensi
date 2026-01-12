# Progress Laporan Aplikasi Absensi SD Negeri Pasirhalang

## Fitur-fitur Aplikasi

### Fitur untuk User Guru
1. **Check In/Check Out**: Guru dapat melakukan absensi masuk dan pulang dengan menyertakan foto selfie sebagai bukti kehadiran
2. **Pengajuan Izin**: Guru dapat mengajukan izin dengan berbagai jenis (Sakit, Keluarga, Dinas, Lainnya) beserta keterangan dan bukti foto jika diperlukan
3. **Validasi GPS**: Sistem memastikan kehadiran guru hanya dapat dilakukan jika berada di dalam radius sekolah (100 meter)
4. **PIN Otentikasi**: Setiap guru memiliki PIN unik untuk memverifikasi identitas saat melakukan absensi
5. **Tampilan Jam Digital**: Menampilkan waktu real-time saat melakukan absensi
6. **Statistik Kehadiran**: Menampilkan jumlah kehadiran, izin, dan alpha untuk bulan berjalan
7. **Pemilihan Nama**: Guru memilih nama dari daftar yang telah terdaftar di database sekolah
8. **Validasi Waktu**: Sistem memeriksa apakah guru datang terlambat dan meminta alasan jika melewati jam masuk
9. **Kondisi Keterlambatan**: Jika guru datang setelah jam masuk, sistem akan menandai status sebagai "Terlambat" dan meminta alasan
10. **Batas Waktu Izin**: Pengajuan izin harus dilakukan sebelum jam batas izin (default: 09:00)
11. **Validasi Ganda**: Guru tidak dapat melakukan Check In lebih dari sekali dalam sehari
12. **Prasyarat Check Out**: Guru hanya dapat melakukan Check Out jika sudah melakukan Check In pada hari yang sama
13. **Validasi Ganda Check Out**: Guru tidak dapat melakukan Check Out lebih dari sekali dalam sehari
14. **Validasi Keterangan Izin**: Keterangan izin harus minimal 10 karakter
20. **Validasi PIN**: Sistem memverifikasi PIN guru sebelum memproses absensi atau izin
21. **Pembatasan Percobaan PIN**: Jika PIN salah 3 kali berturut-turut, akun guru akan dikunci selama 5 menit
22. **Branding Sekolah Otomatis**: Aplikasi menampilkan logo dan nama sekolah secara dinamis berdasarkan NPSN
23. **Skeleton Loading**: Animasi skeleton saat memuat logo untuk pengalaman pengguna yang lebih halus
24. **Loading Screen Bertema**: Menampilkan logo sekolah pada layar awal "Memuat Aplikasi"

### Fitur untuk User Administrator (di Spreadsheet)
1. **Setup Database Awal**: Membuat struktur sheet dan data awal termasuk config, database guru, data absensi, dan jadwal kerja
2. **Generate Laporan Bulanan**: Membuat sheet rekapitulasi absensi berdasarkan bulan dan tahun tertentu
3. **Update Jadwal Kerja**: Mengatur jadwal kerja bulan tertentu (otomatis menandai hari kerja/libur)
4. **Pemeliharaan Foto**: Menghapus foto lama (>3 bulan) untuk menghemat storage Google Drive
5. **Manajemen Data Guru**: Menambahkan, mengedit, atau menghapus data guru di sheet database
6. **Konfigurasi Sekolah**: Mengatur koordinat, jam masuk/pulang, jam batas izin, dan PIN admin di sheet config
7. **Manajemen Absensi**: Melihat dan mengelola data absensi di sheet data-absensi

## Syarat dan Kondisi Penggunaan Aplikasi

### Syarat untuk Check In
1. **Lokasi**: Guru harus berada dalam radius sekolah (100 meter dari koordinat sekolah)
2. **Pemilihan Nama**: Guru harus memilih nama dari dropdown sebelum dapat melakukan Check In
3. **Validasi PIN**: Guru harus memasukkan PIN yang benar (6 digit)
4. **Foto Selfie**: Guru harus mengambil foto selfie sebagai bukti kehadiran
5. **Tidak Double**: Guru tidak dapat melakukan Check In lebih dari sekali dalam sehari
6. **Jam Masuk**: Jika guru datang setelah jam masuk (default: 07:00), sistem akan menandai sebagai terlambat dan meminta alasan

### Syarat untuk Check Out
1. **Lokasi**: Guru harus berada dalam radius sekolah (100 meter dari koordinat sekolah)
2. **Pemilihan Nama**: Guru harus memilih nama dari dropdown sebelum dapat melakukan Check Out
3. **Validasi PIN**: Guru harus memasukkan PIN yang benar (6 digit)
4. **Sudah Check In**: Guru harus sudah melakukan Check In pada hari yang sama
5. **Tidak Double**: Guru tidak dapat melakukan Check Out lebih dari sekali dalam sehari

### Syarat untuk Pengajuan Izin
1. **Pemilihan Nama**: Guru harus memilih nama dari dropdown sebelum dapat mengajukan izin
2. **Validasi PIN**: Guru harus memasukkan PIN yang benar (6 digit)
3. **Batas Waktu**: Pengajuan izin harus dilakukan sebelum jam batas izin (default: 09:00)
4. **Keterangan**: Keterangan izin harus diisi minimal 10 karakter
5. **Jenis Izin**: Guru harus memilih jenis izin (Sakit, Keluarga, Dinas, Lainnya)
6. **Foto Bukti**: Jika diperlukan, guru dapat menyertakan foto bukti untuk jenis izin tertentu

### Kondisi Keterlambatan
1. **Deteksi Keterlambatan**: Sistem membandingkan waktu saat ini dengan jam masuk yang telah ditentukan
2. **Status Terlambat**: Jika waktu Check In melewati jam masuk, status otomatis menjadi "Terlambat"
3. **Permintaan Alasan**: Guru wajib memberikan alasan keterlambatan
4. **Pencatatan**: Keterlambatan dicatat dalam sheet data-absensi dengan keterangan yang diberikan

### Validasi dan Keamanan
1. **Validasi GPS Wajib**: Absensi hanya dapat dilakukan di dalam radius sekolah
2. **Validasi PIN**: Setiap aksi absensi diawali dengan verifikasi PIN
3. **Pembatasan Percobaan**: Jika PIN salah 3 kali, akun akan dikunci 5 menit
4. **Validasi Ganda**: Sistem mencegah Check In/Out ganda dalam sehari
5. **Validasi Waktu Izin**: Izin hanya dapat diajukan sebelum jam batas izin

## Alur Penggunaan Aplikasi

### Alur untuk Guru
1. **Akses Aplikasi**: Guru mengakses URL aplikasi dengan parameter NPSN (misalnya: `...exec?npsn=20205293`)
2. **Pemilihan Nama**: Guru memilih nama dari dropdown yang menampilkan daftar guru terdaftar
3. **Validasi Lokasi**: Sistem mengecek apakah guru berada di dalam radius sekolah melalui GPS
4. **Proses Check In**:
   - Klik tombol "Check In" (aktif hanya jika di lokasi sekolah)
   - Ambil foto selfie menggunakan kamera depan
   - Masukkan PIN 6 digit
   - Jika terlambat (setelah jam masuk), masukkan alasan keterlambatan
   - Data disimpan ke sheet data-absensi
5. **Proses Check Out**:
   - Klik tombol "Check Out" (aktif hanya jika di lokasi sekolah dan sudah Check In hari itu)
   - Masukkan PIN 6 digit
   - Data disimpan ke sheet data-absensi
6. **Pengajuan Izin**:
   - Klik tombol "Pengajuan Izin"
   - Pilih jenis izin (Sakit, Keluarga, Dinas, Lainnya)
   - Tulis keterangan detail (minimal 10 karakter)
   - Masukkan PIN 6 digit
   - Data izin disimpan ke sheet data-absensi

### Alur untuk Administrator
1. **Akses Spreadsheet**: Buka spreadsheet database sekolah (SD Negeri Pasirhalang)
2. **Setup Awal**: Jalankan fungsi "Setup Database Awal" dari menu "Admin Absensi" untuk membuat struktur sheet
3. **Pengelolaan Data Guru**: Tambahkan atau edit data guru di sheet "database"
4. **Konfigurasi Sekolah**: Atur parameter sekolah di sheet "config" (koordinat, jam kerja, dll)
5. **Generate Laporan**: Gunakan menu "Generate Laporan Bulanan" untuk membuat rekap absensi per bulan
6. **Update Jadwal**: Gunakan menu "Update Jadwal Kerja" untuk mengatur hari kerja/libur
7. **Pemeliharaan**: Gunakan "Hapus Foto Lama" untuk mengelola storage Drive

## Implementasi Multi-Sekolah dengan NPSN

Aplikasi ini dirancang untuk digunakan oleh beberapa sekolah dengan membedakan NPSN di URL. Berikut cara implementasinya:

1. **Registrasi Sekolah**: Setiap sekolah memiliki NPSN unik yang didaftarkan di `SCHOOL_REGISTRY` di Code.js
2. **Database Terpisah**: Setiap NPSN dipetakan ke Spreadsheet ID yang berbeda, sehingga setiap sekolah memiliki database terpisah
3. **Koordinat Sekolah**: Setiap NPSN memiliki koordinat GPS dan radius yang berbeda di `SCHOOL_COORDINATES`
4. **URL Unik**: Guru mengakses URL dengan parameter NPSN yang berbeda untuk setiap sekolah (misalnya `...exec?npsn=20205293` untuk SDN Pasirhalang, `...exec?npsn=12345678` untuk sekolah lain)

### Proses Pembuatan Salinan untuk Sekolah Baru
1. **Salin Spreadsheet**: Buat salinan dari spreadsheet SD Negeri Pasirhalang
2. **Ubah Nama File**: Ganti nama file spreadsheet dengan nama sekolah baru
3. **Update Config**: Sesuaikan data di sheet "config" dengan informasi sekolah baru (koordinat, jam kerja, dll)
4. **Update Data Guru**: Ganti data guru di sheet "database" dengan data guru sekolah baru
5. **Tambahkan ke Registry**: Tambahkan pasangan NPSN dan Spreadsheet ID baru ke `SCHOOL_REGISTRY` dan `SCHOOL_COORDINATES` di Code.js
118. **Dapatkan URL Baru**: Gunakan URL Apps Script yang sama dengan parameter NPSN sekolah baru
119. **Tambahkan Logo**: Simpan file `logo.png` di folder yang sama dengan spreadsheet sekolah untuk mengaktifkan branding otomatis.

Dengan pendekatan ini, satu aplikasi dapat melayani banyak sekolah secara terpisah dan aman, dengan data yang terisolasi masing-masing sekolah.

## Update Terbaru (Januari 2026)

### Integrasi Logo & Branding
1. **Otomatisasi Logo**: Sistem sekarang mencari file `logo.png` di folder Google Drive sekolah dan menampilkannya sebagai logo utama.
2. **UI/UX Enhancement**:
   - Implementasi **Skeleton Loader** pada semua kontainer logo.
   - Perbesaran ukuran logo di halaman Login (85px), Dashboard (60px dengan zoom 1.2x), dan Loading Screen (100px).
   - Penghapusan nama sekolah di halaman login untuk tampilan yang lebih minimalis dan profesional.
3. **Backend logic**: Penambahan fungsi `getSchoolLogo` dan `getSchoolPublicData` untuk mendukung fetching data tanpa perlu login terlebih dahulu.