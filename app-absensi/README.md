# 🛡️ Sistem Absensi Digital - PGRI Cikalong Wetan

Sistem manajemen kehadiran modern berbasis web (mobile-first) yang dibangun menggunakan Google Apps Script, terintegrasi penuh dengan Google Sheets sebagai database realtime.

![App Badge](https://img.shields.io/badge/Status-Production-success?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)

## ✨ Fitur Lengkap Aplikasi Absensi

### 📍 Smart Geolocation
- **Dual-Step GPS Acquisition**: Kombinasi `getCurrentPosition` (cepat) dan `watchPosition` (akurat) untuk penguncian lokasi instan.
- **Geofencing Akurat**: Validasi radius dengan koordinat hardcoded (fallback ke spreadsheet) untuk presisi tinggi.
- **Anti-Fake GPS**: Validasi browser-level untuk mencegah pemalsuan lokasi standar.
- **Realtime Location Tracking**: Menampilkan posisi pengguna saat ini di peta interaktif.

### 📸 Bukti Kehadiran
- **Selfie Compression**: Kompresi gambar client-side otomatis sebelum upload untuk menghemat kuota & storage.
- **Security PIN**: Validasi PIN 6 digit untuk setiap tindakan (Check-in, Check-out, Izin).
- **Foto Otomatis**: Pengambilan foto dilakukan secara otomatis saat proses absensi.
- **Validasi Wajah**: Sistem verifikasi kehadiran melalui foto wajah pengguna.

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Tampilan estetik dengan efek blur dan gradient modern.
- **Interactive Maps**: Peta Leaflet.js yang responsif dengan marker dinamis.
- **User-Friendly Forms**: Form izin dengan icon cards dan character counter.
- **Responsive Layout**: Desain yang optimal untuk berbagai ukuran layar (mobile-first approach).
- **Animasi Transisi**: Efek animasi halus untuk pengalaman pengguna yang lebih baik.

### 🔐 Keamanan & Otentikasi
- **Multi-Level Validation**: Sistem validasi ganda untuk lokasi dan identitas pengguna.
- **PIN Protection**: Perlindungan dengan kode PIN unik untuk setiap pengguna.
- **Session Management**: Manajemen sesi pengguna yang aman dan terenkripsi.

### 📊 Laporan & Analisis
- **Realtime Dashboard**: Tampilan data kehadiran secara real-time.
- **Statistik Harian/Mingguan/Bulanan**: Analisis kehadiran berdasarkan periode waktu tertentu.
- **Export Data**: Kemampuan ekspor data ke berbagai format (Excel, PDF).
- **Notifikasi Otomatis**: Pemberitahuan untuk kehadiran terlambat atau tidak hadir.

### 📅 Jadwal & Cuti
- **Manajemen Izin**: Sistem pengajuan dan persetujuan cuti/izin.
- **Kalender Interaktif**: Penjadwalan dan penampilan hari libur serta jadwal kerja.
- **Tipe Izin Lengkap**: Sakit, Keluarga, Dinas, Lainnya dengan deskripsi lengkap.

### ⏰ Waktu & Presensi
- **Jam Kerja Otomatis**: Sistem pencatatan waktu masuk dan pulang otomatis.
- **Toleransi Keterlambatan**: Pengaturan batas toleransi keterlambatan.
- **Perhitungan Jam Kerja**: Otomatisasi perhitungan durasi jam kerja per hari.

### 🛠️ Teknologi

| Komponen | Teknologi |
|----------|-----------|
| **Backend** | Google Apps Script (GAS) |
| **Database** | Google Sheets |
| **Frontend** | HTML5, CSS3 (Modern Variables), JavaScript (ES6+) |
| **UI Library** | SweetAlert2 (Modals), FontAwesome (Icons) |
| **Maps** | Leaflet.js |
| **Geolocation API** | HTML5 Geolocation |
| **Image Processing** | Client-side Image Compression |

## 🚀 Cara Penggunaan

1. **Akses Aplikasi**: Buka URL Web App melalui browser smartphone.
2. **Pilih Nama**: Pilih nama guru/staff dari dropdown.
3. **Check In**:
   - Pastikan GPS aktif (Tekan tombol 🔄 jika perlu).
   - Klik "Check In" -> Ambil Foto -> Masukkan PIN.
4. **Check Out**:
   - Klik "Check Out" -> Masukkan PIN.
5. **Izin/Sakit**:
   - Klik tombol "Pengajuan Izin".
   - Pilih jenis izin (Sakit/Keluarga/Dinas/Lainnya).
   - Isi keterangan & Masukkan PIN.

## ⚙️ Setup & Konfigurasi

### 1. Database (Google Sheets)
Pastikan Spreadsheet memiliki struktur sheet:
- `config`: Pengaturan radius, jam masuk/pulang, koordinat (optional).
- `database`: Data pegawai (Nama, NIP, Jabatan, PIN).
- `data-absensi`: Log kehadiran harian.
- `temp_photos`: (Disarankan) Folder Drive untuk foto.

### 2. Hardcoded Coordinates (`Code.js`)
Untuk akurasi maksimal, koordinat sekolah di-hardcode dalam object `SCHOOL_COORDINATES`:
```javascript
const SCHOOL_COORDINATES = {
    '20205293': { // NPSN
        lat: -6.753364...,
        lng: 107.449096...,
        radius: 100,
        name: 'SD N Pasirhalang'
    }
};
```

### 3. Deployment
Gunakan CLASP untuk deploy:
```bash
clasp push
clasp deploy
```

## 👨‍💻 Credits

**Developed by Susanto, S.Kom**
*Build with passion for Education Technology.*

Copyright © 2025 • All Rights Reserved