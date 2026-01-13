# 🚀 Roadmap Fitur Masa Depan (Future Features)

Dokumen ini berisi daftar ide fitur modern, *out of the box*, dan krusial untuk pengembangan SIKADIR selanjutnya. Fitur-fitur ini dirancang untuk meningkatkan keamanan, efisiensi administratif, dan kesejahteraan pengguna tanpa membebani kinerja spreadsheet secara berlebihan.

## 1. AI Face Verification (Verifikasi Wajah Biometrik)
**Masalah:** Foto selfie biasa masih memungkinkan kecurangan (titip absen, foto layar HP lain, atau foto benda mati).
**Solusi:** Mengintegrasikan library AI ringan (seperti `face-api.js`) di sisi klien (browser) sebelum foto dikirim ke server.
**Cara Kerja:**
*   Saat kamera terbuka, AI secara otomatis mendeteksi keberadaan wajah manusia.
*   Tombol "Check In" **terkunci** (disabled) sampai AI mengonfirmasi adanya wajah asli.
*   *(Advanced)* Membandingkan vektor wajah di kamera dengan "Foto Profil Master" yang tersimpan di database untuk memastikan identitas.
**Dampak:** Menutup celah keamanan "titip absen" secara signifikan dan meningkatkan integritas data.

## 2. Real-time "Tukin" (Tunjangan Kinerja) Estimator
**Masalah:** Guru sering tidak menyadari dampak finansial langsung dari keterlambatan atau ketidakhadiran.
**Solusi:** Gamifikasi finansial yang menampilkan estimasi pendapatan atau potongan Tunjangan Kinerja (Tukin) secara *real-time* di dashboard.
**Cara Kerja:**
*   Admin mengatur parameter potongan di Spreadsheet (misal: Terlambat 1 menit = Potongan Rp X).
*   Setiap kali guru terlambat, dashboard menampilkan notifikasi visual: *"Anda terlambat 15 menit. Estimasi potongan Tukin bulan ini: Rp 15.000"*.
*   Menampilkan grafik "Potensi Tukin yang Bisa Diselamatkan" jika disiplin.
**Dampak:** Menjadi motivator disiplin terkuat karena menyentuh aspek psikologis finansial pengguna.

## 3. Smart PDF Report Generator (Siap Cetak untuk Dinas)
**Masalah:** Admin sekolah menghabiskan waktu berjam-jam untuk memindahkan data dari Spreadsheet ke format laporan Word/Excel resmi Dinas Pendidikan yang kaku.
**Solusi:** Generator PDF otomatis yang sesuai persis dengan format resmi Dinas.
**Cara Kerja:**
*   Menggunakan **Google Docs Template** sebagai acuan desain laporan.
*   Script secara otomatis mengisi *placeholder* seperti `{{NAMA}}`, `{{NIP}}`, `{{REKAP_HADIR}}` ke dalam dokumen.
*   Menyematkan Tanda Tangan Digital (QR Code) Kepala Sekolah secara otomatis.
*   Output langsung berupa file PDF siap cetak/kirim.
**Dampak:** Menghemat waktu administrasi bulanan secara drastis (dari jam menjadi detik) dan mengurangi *human error*.

## 4. WhatsApp Notification Gateway (Personal Assistant)
**Masalah:** Notifikasi di dalam aplikasi web sering terlewat karena user tidak selalu membuka browser, namun user sangat aktif di WhatsApp.
**Solusi:** Bot WhatsApp proaktif yang bertindak sebagai asisten pribadi guru.
**Cara Kerja:**
*   **Reminder Pagi (06:30):** *"Selamat Pagi Pak Budi, jangan lupa Check In sebelum 07:00 agar tidak terlambat."*
*   **Konfirmasi Sukses:** *"Absen diterima pukul 06:55. Semangat mengajar!"*
*   **Peringatan Bahaya:** *"Sistem mendeteksi Anda belum absen hingga 07:15. Apakah Anda lupa atau berhalangan?"*
**Dampak:** Mengurangi tingkat "lupa absen" secara drastis dan meningkatkan komunikasi sekolah.

## 5. Mood & Health Tracker (Kesejahteraan Guru)
**Masalah:** Sistem absensi konvensional hanya mencatat kehadiran fisik, mengabaikan kondisi mental dan kesehatan guru yang mempengaruhi kualitas pengajaran.
**Solusi:** Pendekatan humanis dengan menambahkan pelacak suasana hati sederhana saat Check In.
**Cara Kerja:**
*   Menambahkan pertanyaan simpel *"Bagaimana perasaan Anda hari ini?"* dengan pilihan emoji (Senang, Semangat, Biasa, Kurang Sehat, Stress).
*   Data ini tidak mempengaruhi gaji, tetapi dipantau oleh Kepala Sekolah.
*   Jika guru memilih status negatif (Sakit/Stress) selama 3 hari berturut-turut, sistem mengirim notifikasi *private* ke Kepala Sekolah untuk melakukan pendekatan personal/memberi dukungan.
**Dampak:** Membangun budaya sekolah yang peduli (*care*) dan memanusiakan guru, bukan hanya menganggap mereka sebagai objek administrasi.

## 6. Jurnal Mengajar Digital (Integrated Daily Logbook)
**Masalah:** Absensi hanya mencatat kehadiran fisik, namun administrasi guru (Jurnal Kelas/LKH) masih sering dilakukan manual di buku tulis terpisah.
**Solusi:** Mengintegrasikan pengisian Jurnal Mengajar ke dalam alur **Check Out**.
**Cara Kerja:**
*   Saat tombol Check Out ditekan, sebelum foto, muncul form singkat: *"Materi apa yang diajarkan hari ini?"* dan *"Kelas berapa?"*.
*   Data ini disimpan di sheet terpisah (`jurnal-mengajar`) yang terhubung dengan data absensi.
*   Bisa di-export menjadi Laporan Kinerja Harian (LKH) otomatis.
**Dampak:** Efisiensi administrasi guru (One-Stop Application) dan memudahkan Kepala Sekolah memantau progres kurikulum.

## 7. Event Attendance via Dynamic QR (Absensi Rapat/Upacara)
**Masalah:** Absensi harian sudah digital, tapi absensi Rapat Dinas, Upacara, atau Pelatihan masih menggunakan kertas keliling (tanda tangan manual).
**Solusi:** Fitur scanner QR Code di dalam aplikasi untuk kegiatan insidental.
**Cara Kerja:**
*   Admin membuat "Event" baru di dashboard (misal: Rapat Evaluasi).
*   Sistem menghasilkan QR Code unik yang ditampilkan di layar proyektor.
*   Guru membuka menu "Scan Event" di SIKADIR, scan QR di layar.
*   Kehadiran tercatat spesifik untuk event tersebut.
**Dampak:** Digitalisasi total ekosistem sekolah, tidak ada lagi kertas absensi yang tercecer.

## 8. Facility Reporting (Lapor Kerusakan Sarpras)
**Masalah:** Kerusakan fasilitas sekolah (lampu mati, kursi rusak, atap bocor) sering terlambat ditangani karena alur pelaporan yang birokratis/lupa lapor.
**Solusi:** Menu pelaporan cepat berbasis foto (Crowdsourcing Maintenance).
**Cara Kerja:**
*   Guru melihat kerusakan -> Buka menu "Lapor Sarpras".
*   Foto kerusakan -> Beri keterangan singkat -> Kirim.
*   Operator Sarpras/Kepsek mendapat notifikasi di Spreadsheet/WA.
*   Status perbaikan bisa dipantau (Dilaporkan -> Sedang Diperbaiki -> Selesai).
**Dampak:** Pemeliharaan fasilitas sekolah menjadi jauh lebih responsif dan terdata.

## 9. Offline-First Architecture (Anti-Blank Spot)
**Masalah:** Koneksi internet di beberapa area sekolah sering tidak stabil, menyebabkan proses Check In gagal (loading terus menerus).
**Solusi:** Mengubah arsitektur menjadi *Offline-First* menggunakan Service Workers & IndexedDB.
**Cara Kerja:**
*   Jika internet mati, data absensi (Foto + Koordinat + Waktu) disimpan di memori HP (Local Storage) secara terenkripsi.
*   Aplikasi memberikan notifikasi *"Koneksi terputus. Data disimpan offline."*
*   Saat sinyal kembali (online), aplikasi secara otomatis meng-upload data yang tertunda di latar belakang (*Background Sync*).
**Dampak:** Menjamin guru tetap bisa absen 100% walau internet mati total saat jam masuk.

## 10. Gamification & Leaderboard (Guru Teladan)
**Masalah:** Rutinitas absensi bisa membosankan dan terasa hanya sebagai kewajiban administratif.
**Solusi:** Menambahkan elemen permainan (Gamifikasi) yang positif.
**Cara Kerja:**
*   Sistem memberikan poin untuk ketepatan waktu (misal: Check In < 06:45 = +10 Poin).
*   Menampilkan "Leaderboard Bulanan" (Top 3 Guru Terrajin) di dashboard.
*   Memberikan lencana digital (Badges) seperti *"Early Bird"*, *"Perfect Attendance"*, atau *"Tech Savvy"*.
**Dampak:** Mengubah mindset dari "takut terlambat" menjadi "semangat datang pagi", meningkatkan atmosfer positif di sekolah.

## 11. Digital Visitor Management (Buku Tamu Digital)
**Masalah:** Pencatatan tamu sekolah (Orang tua, Dinas, Paket) masih manual di buku tulis, sulit direkap dan kurang aman.
**Solusi:** QR Code di pos satpam/lobby. Tamu scan -> Isi data diri & Tujuan -> Foto Wajah.
**Cara Kerja:**
*   Tamu mengisi form digital.
*   Guru/Staf yang dituju mendapat notifikasi WA: *"Ada tamu A ingin bertemu Bapak/Ibu"*.
*   Satpam memiliki dashboard tamu hari ini.
**Dampak:** Meningkatkan keamanan sekolah dan citra profesionalitas di mata pengunjung.

## 12. Panic Button (Sistem Darurat Sekolah)
**Masalah:** Respon terhadap keadaan darurat (kebakaran, kecelakaan siswa, perkelahian) sering terlambat karena alur komunikasi yang panik.
**Solusi:** Tombol darurat khusus di dashboard aplikasi.
**Cara Kerja:**
*   Guru menekan tombol "SOS".
*   Pilih jenis darurat (Medis/Api/Keamanan).
*   Sistem membunyikan alarm di HP seluruh guru lain & Satpam beserta lokasi pelapor.
**Dampak:** Mempercepat respon time penanganan kecelakaan/bencana di lingkungan sekolah.

## 13. Asset Borrowing Tracker (Peminjaman Inventaris)
**Masalah:** Aset sekolah (Infocus, Laptop, Sound System) sering tidak terlacak keberadaannya atau lupa dikembalikan.
**Solusi:** Manajemen peminjaman aset berbasis QR Code pada barang.
**Cara Kerja:**
*   Guru scan QR pada barang saat mengambil. Status barang berubah menjadi *"Dipinjam oleh [Nama]"*.
*   Saat mengembalikan, scan lagi untuk check-in barang.
*   Admin bisa melihat posisi aset secara real-time.
**Dampak:** Mencegah kehilangan aset sekolah dan memudahkan inventarisasi.

## 14. Student Attendance Integration (Absensi Siswa)
**Masalah:** Guru sudah absen digital, namun absensi siswa masih menggunakan buku kertas yang harus direkap ulang oleh TU.
**Solusi:** Modul absensi siswa di dalam aplikasi guru.
**Cara Kerja:**
*   Guru memilih kelas yang diajar.
*   Muncul daftar nama siswa, guru tinggal tap status (Hadir/Sakit/Izin/Alpha).
*   Rekapitulasi kehadiran siswa otomatis terkirim ke Wali Kelas & TU.
**Dampak:** Mengurangi beban administrasi guru dan TU, data kehadiran siswa realtime.

## 15. Digital Document Vault (Arsip Kepegawaian Pribadi)
**Masalah:** Guru sering membutuhkan dokumen penting (SK, Surat Tugas, Slip Gaji) secara mendadak saat sedang tidak membawa berkas fisik.
**Solusi:** Repositori dokumen digital pribadi yang aman.
**Cara Kerja:**
*   TU mengupload dokumen ke folder Drive guru.
*   Guru bisa melihat dan mengunduh SK, Slip Gaji, atau Surat Tugas langsung dari aplikasi kapan saja.
**Dampak:** Memudahkan urusan birokrasi guru, akses dokumen penting dalam genggaman.

## 16. Dynamic Time-Based Themes (Tema Waktu Dinamis)
**Masalah:** Tampilan aplikasi yang statis terasa membosankan dan monoton jika dilihat setiap hari.
**Solusi:** Mengubah tema warna dan nuansa aplikasi secara otomatis berdasarkan waktu (Pagi/Siang/Sore/Malam).
**Cara Kerja:**
*   **Pagi:** Gradasi Sunrise (Oranye-Biru).
*   **Siang:** Bright Blue (Energik).
*   **Sore:** Sunset (Ungu-Jingga).
*   **Malam:** Deep Dark Mode.
**Dampak:** Memberikan pengalaman visual yang segar dan kontekstual setiap kali membuka aplikasi.

## 17. Swipe-to-Confirm Button (Geser untuk Absen)
**Masalah:** Tombol klik biasa terasa standar dan rawan tertekan tidak sengaja.
**Solusi:** Mengganti tombol Check In/Out dengan mekanisme *Slider* (Geser).
**Cara Kerja:**
*   User menggeser tombol dari kiri ke kanan untuk konfirmasi.
*   Disertai efek getar (*Haptic Feedback*) saat geseran selesai.
**Dampak:** Memberikan sensasi interaksi fisik yang memuaskan (*satisfying*) dan mencegah *accidental click*.

## 18. Parallax Tilt Effect (Kartu 3D Interaktif)
**Masalah:** Desain flat design terkadang terlihat terlalu datar dan kurang premium.
**Solusi:** Menambahkan efek kedalaman (3D) pada kartu informasi menggunakan sensor Gyroscope HP.
**Cara Kerja:**
*   Saat HP dimiringkan, kartu status dan jam akan bergerak sedikit berlawanan arah (*Tilt Effect*).
*   Memberikan ilusi bahwa elemen UI mengambang di atas layar.
**Dampak:** Meningkatkan estetika UI menjadi sangat modern, premium, dan interaktif.

## 19. Weather-Based Greeting (Sapaan Berbasis Cuaca)
**Masalah:** Sapaan "Selamat Pagi" terasa robotik dan kurang personal.
**Solusi:** Mengintegrasikan data cuaca lokal untuk memberikan sapaan yang relevan.
**Cara Kerja:**
*   Mengambil data cuaca via API gratis (OpenMeteo) berdasarkan GPS.
*   Menampilkan animasi cuaca halus (Hujan/Cerah/Mendung) di header.
*   Pesan kontekstual: *"Hujan turun, hati-hati di jalan Pak/Bu!"*.
**Dampak:** Menciptakan koneksi emosional antara aplikasi dan pengguna.

## 20. Confetti & Sound Reward (Perayaan Kecil)
**Masalah:** Tidak ada apresiasi instan saat guru berhasil datang tepat waktu.
**Solusi:** Memberikan *micro-reward* visual dan audio.
**Cara Kerja:**
*   Jika Check In **Tepat Waktu**: Layar dipenuhi animasi *Confetti* (kertas warna-warni) dan suara *chime* sukses.
*   Jika Terlambat: Hanya notifikasi sukses standar.
**Dampak:** *Gamification* sederhana yang memicu dopamin, membuat guru lebih semangat untuk datang tepat waktu.

---

### Catatan Implementasi
Semua fitur di atas dirancang untuk tetap menggunakan arsitektur **Serverless (Google Apps Script)** dan **Spreadsheet** sebagai basis data, sehingga biaya operasional tetap **GRATIS/Rendah** namun dengan fitur setara aplikasi korporat berbayar.

*Dokumen ini dibuat sebagai bahan pertimbangan pengembangan SIKADIR versi selanjutnya.*