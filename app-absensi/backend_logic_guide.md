# Spesifikasi Fitur & Alur Logika Sistem Absensi (App-Script)

Dokumen ini menjelaskan secara detail gambaran fitur aplikasi, arsitektur sistem, dan logika teknis berdasarkan desain tampilan (`Form.html`) dan kebutuhan sistem.

---

## 1. Arsitektur Sistem (Terpisah)

### A. Core System
- **1 Web App Pusat** (`Code.js`) milik Developer
- Deploy sebagai **Web App** dengan setting:
  - Execute as: **Me** (Developer)
  - Who has access: **Anyone** (Publik)
- **Direct Dashboard Access**: User langsung masuk ke dashboard tanpa halaman login (karena limitation Apps Script untuk maintain session)

### B. Database Spreadsheet
- **Banyak File** (1 File per Sekolah) milik Klien
- Setiap sekolah memiliki Spreadsheet Database terpisah
- Diakses oleh Core System via **Spreadsheet ID**

### C. Master Registry
- **Hardcoded Object** di Script (`Registry.gs` atau dalam `Code.js`)
- Format: **NPSN (Nomor Pokok Sekolah Nasional)** → **Spreadsheet ID**

**Contoh:**
```javascript
const SCHOOL_REGISTRY = {
  '20219021': '1abc...xyz_spreadsheet_id_SD_Pasirhalang',
  '20219022': '1def...uvw_spreadsheet_id_SMP_Bandung',
  '69962401': '1ghi...rst_spreadsheet_id_SMK_Jakarta'
};
```

---

## 2. Struktur Database Spreadsheet (Per Sekolah)

### Sheet `database` (Data Guru)
| Kolom | Field | Keterangan |
|-------|-------|------------|
| A | Nama Lengkap | Nama lengkap guru |
| B | NIP | Nomor Induk Pegawai |
| C | Jabatan | Contoh: Guru Kelas, Waka Kurikulum |
| D | Unit Kerja | Contoh: Kelas 1A, Kelas 2B |
| E | **PIN** | **Wajib 6 digit angka** (plain text untuk simplicity) |

### Sheet `data-absensi` (Log Harian)
| Kolom | Field | Keterangan |
|-------|-------|------------|
| A | Timestamp | Format: `2025-12-15 07:30:45` |
| B | Nama Guru | Nama lengkap dari dropdown |
| C | Jenis | `Check In` / `Check Out` / `Izin` |
| D | Status | `Hadir` / `Terlambat` / `Izin` |
| E | Koordinat | Format: `lat,long` (contoh: `-6.9175,107.6191`) |
| F | **Link Foto** | URL Google Drive (contoh: `https://drive.google.com/file/d/abc123/view`) |
| G | Keterangan / Alasan | Untuk Terlambat/Izin/Jenis Izin |
| H | Override By Admin | Flag "YES" jika manual override oleh admin |
| I | Admin Name | Nama admin yang melakukan override |

### Sheet `config` (Pengaturan Sekolah)
| Cell | Parameter | Contoh Value |
|------|-----------|--------------|
| B1 | `LATITUDE_SEKOLAH` | `-6.9175` |
| B2 | `LONGITUDE_SEKOLAH` | `107.6191` |
| B3 | `RADIUS_METER` | `100` (meter) |
| B4 | `JAM_MASUK` | `07:00` (Batas dianggap Terlambat) |
| B5 | `JAM_BATAS_IZIN` | `09:00` (Batas pengajuan izin) |
| B6 | `JAM_PULANG` | `14:00` (Minimal Check Out) |

### Sheet `jadwal-kerja` (Hari Kerja Efektif)
**Struktur:**
| Kolom A | Kolom B | Kolom C |
|---------|---------|---------|
| Tanggal | Status | Keterangan |

**Contoh Data:**
```
2025-12-01    Kerja      -
2025-12-02    Kerja      -
2025-12-03    Libur      Hari Minggu
2025-12-04    Kerja      -
2025-12-10    Libur      Libur Nasional
```

**Tujuan:** Untuk menghitung **Alpha** secara akurat (hari kerja yang tidak ada record Check In).

---

## 3. Logika Bisnis Detail

### A. Tampilan Statistik (Card Hadir/Izin/Alpha)

**Data Source:** Spreadsheet Database Sekolah (bukan dari Core System)

**Default State:**
- Saat belum pilih nama: Tampilkan simbol **"-"**

**Setelah User Memilih Nama:**
Sistem menghitung data **bulan berjalan** dari sheet `data-absensi` dan `jadwal-kerja`:

1. **Hadir**:
   - Count record jenis `Check In` dengan status `Hadir` bulan ini
   - Formula: `COUNT(Jenis="Check In" AND Status="Hadir" AND MONTH=current)`

2. **Izin**:
   - Count record dengan status `Izin` bulan ini
   - Formula: `COUNT(Status="Izin" AND MONTH=current)`

3. **Alpha**:
   - **Hari Kerja Efektif** - **Jumlah Kehadiran (Hadir + Izin)**
   - Ambil dari `jadwal-kerja`: Count tanggal dengan Status = `Kerja` di bulan ini
   - Formula: `(Hari Kerja) - (Hadir + Izin)`

**Contoh:**
- Bulan Desember ada 20 hari kerja (dari `jadwal-kerja`)
- Guru A: Hadir 15x, Izin 2x
- Alpha = 20 - (15 + 2) = **3 hari**

---

### B. Mekanisme Check In (Arrival)

**Flow:**
1. Guru klik tombol **"Check In"**
2. **Validasi GPS** (WAJIB):
   - Ambil koordinat real-time dari device
   - Hitung jarak ke koordinat sekolah (Haversine formula)
   - **Jika di luar radius**: 
     - ❌ **DITOLAK** dengan alert: *"Anda berada di luar area sekolah. Absensi tidak dapat dilakukan."*
     - Sistem berhenti di sini
     - **Exception:** Admin bisa override (lihat section Error Handling)
   - **Jika dalam radius**: Lanjut ke step berikutnya

3. **Validasi Waktu Masuk**:
   - Ambil jam sekarang
   - Bandingkan dengan `JAM_MASUK` dari config
   - **Tepat Waktu** (≤ JAM_MASUK):
     - Status = `Hadir`
     - Lanjut ke foto
   - **Terlambat** (> JAM_MASUK):
     - Status = `Terlambat`
     - **Prompt WAJIB muncul**: Modal input "Anda terlambat [X menit]. Masukkan alasan:"
     - Guru input alasan (misal: "Ban bocor di jalan")
     - Alasan disimpan ke Kolom G

4. **Ambil Foto Selfie**:
   - Buka kamera device
   - Guru ambil foto
   - **Compress foto** (resize 600px, quality 60%)
   - **Upload ke Google Drive** (folder terorganisir: Absensi-Foto/YYYY-MM/NPSN-xxxxx)
   - Simpan **URL foto** ke Kolom F

5. **Validasi PIN**:
   - Input 6 digit PIN
   - Cocokkan dengan PIN di sheet `database` (Kolom E)
   - **Jika salah**: 
     - Hitung attempt (max 3x dalam 1 sesi)
     - Setelah 3x salah: Lockout 5 menit
   - **Jika benar**: Lanjut submit

6. **Submit Data**:
   - Simpan semua data ke sheet `data-absensi`
   - Tampilkan success message dengan timestamp

---

### C. Mekanisme Check Out (Departure)

**Flow:**
1. Guru klik tombol **"Check Out"**
2. **Validasi Sudah Check In**:
   - Cek apakah ada record `Check In` hari ini untuk user tersebut
   - **Jika belum Check In**: 
     - ❌ Alert: *"Anda belum melakukan Check In hari ini."*
     - Proses dibatalkan
   - **Jika sudah Check In**: Lanjut

3. **Validasi Waktu Minimal**:
   - Ambil jam sekarang
   - Bandingkan dengan `JAM_PULANG` dari config
   - **Jika < JAM_PULANG**:
     - ⚠️ Warning: *"Anda check out lebih awal dari jam pulang. Lanjutkan?"*
     - Tombol: `Ya, Lanjutkan` | `Batal`
   - **Jika ≥ JAM_PULANG**: Langsung lanjut

4. **Validasi GPS** (OPSIONAL untuk Check Out):
   - Bisa diaktifkan atau dinonaktifkan via config
   - Jika aktif, sama seperti Check In (dalam radius sekolah)

5. **Ambil Foto** (OPSIONAL):
   - Bisa diskip untuk Check Out
   - Jika diaktifkan, sama seperti Check In (compress + upload ke Drive)

6. **Input PIN**:
   - Sama seperti Check In
   - Validasi dengan database

7. **Submit Data**:
   - Simpan record baru ke `data-absensi` dengan:
     - Jenis = `Check Out`
     - Status = `Hadir` (default)
     - Koordinat + Foto (jika ada)

---

### D. Mekanisme Izin (Permission)

**Flow:**
1. Guru klik tombol **"Ajukan Izin"**
2. **Validasi Waktu Batas**:
   - Cek jam sekarang vs `JAM_BATAS_IZIN`
   - **Jika lewat batas**:
     - ❌ Alert: *"Batas waktu pengajuan izin (09:00) sudah habis."*
     - Tombol disabled/hidden
   - **Jika masih dalam batas**: Lanjut

3. **Form Izin**:
   - **Dropdown Jenis Izin**:
     - `Sakit`
     - `Kepentingan Keluarga`
     - `Dinas Luar`
     - `Lainnya`
   - **Textarea Alasan**: Input detail (minimal 10 karakter)
   - **Foto Bukti**: 
     - Ambil foto (surat dokter / undangan / dll)
     - Compress + upload ke Drive

4. **Input PIN**: Validasi seperti biasa

5. **Submit**:
   - Simpan ke `data-absensi`:
     - Jenis = `Izin`
     - Status = `Izin`
     - Kolom G = `[Jenis Izin] - [Alasan]` (contoh: `Sakit - Demam tinggi`)

---

### E. Validasi PIN (Detail)

**Rules:**
- PIN harus **tepat 6 digit angka**
- Validasi case-sensitive (meski angka semua)
- **Attempt Limit**: Max 3x percobaan salah per sesi
- **Lockout**: Setelah 3x salah, disable input PIN selama **5 menit**
- **Timer**: Tampilkan countdown "Coba lagi dalam X:XX"

**Implementation:**
```javascript
let pinAttempts = 0;
let lockoutUntil = null;

function validatePIN(inputPIN, userName) {
  // Cek lockout
  if (lockoutUntil && new Date() < lockoutUntil) {
    return { success: false, message: "Terlalu banyak percobaan. Coba lagi dalam " + getRemainingTime() };
  }
  
  // Ambil PIN dari database
  const correctPIN = getUserPIN(userName); // dari sheet database
  
  if (inputPIN === correctPIN) {
    pinAttempts = 0;
    return { success: true };
  } else {
    pinAttempts++;
    if (pinAttempts >= 3) {
      lockoutUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
      return { success: false, message: "PIN salah 3x. Akun dikunci 5 menit." };
    }
    return { success: false, message: `PIN salah. Sisa percobaan: ${3 - pinAttempts}x` };
  }
}
```

---

## 4. GPS & Location Handling

### A. Strict Validation (Default)

**Rules:**
- Koordinat WAJIB dalam radius yang ditentukan
- **Jika di luar radius**: Absensi **DITOLAK**
- No exceptions kecuali override admin

**Haversine Formula** (Calculate Distance):
```javascript
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
```

### B. Error Handling

**Skenario 1: GPS Tidak Tersedia / Permission Denied**
- Alert: *"Tidak dapat mengakses lokasi. Pastikan GPS aktif dan izinkan akses lokasi."*
- Tombol: `Coba Lagi` | `Hubungi Admin`
- **Admin Override**: 
  - Admin masuk dengan kredensial khusus
  - Bisa approve manual attendance via dashboard admin
  - Data tetap masuk dengan flag `MANUAL_OVERRIDE`

**Skenario 2: GPS Accuracy Rendah**
- Jika accuracy > 50 meter:
  - Warning: *"Akurasi GPS rendah. Tunggu sebentar atau pindah ke area terbuka."*
  - Auto-retry setiap 3 detik (max 5x)

**Skenario 3: GPS Error (Unknown)**
- Generic error message
- Log error ke Apps Script Logger
- Sediakan opsi manual input koordinat untuk **admin only**

### C. Admin Override Mechanism

**Trigger:** Guru tidak bisa absen karena GPS error

**Flow:**
1. Guru hubungi Admin (via WA/Telpon)
2. Admin login ke **Admin Dashboard** (beda URL atau protected page)
3. Admin pilih:
   - Nama Guru
   - Tanggal
   - Jenis (Check In/Out)
   - Koordinat manual (atau skip validation)
4. Admin submit dengan **Admin PIN** khusus
5. Data masuk dengan flag tambahan:
   - Kolom H (baru): `OVERRIDE_BY_ADMIN`
   - Kolom I (baru): `Admin Name`

---

## 5. Photo Storage (Google Drive - Optimized for Scale)

### Mengapa Google Drive (Bukan Base64):

**Masalah Base64 untuk 600-700 User:**
- ❌ Cell size limit: 50,000 karakter (Base64 foto ~60-80KB)
- ❌ Performance: Spreadsheet dengan 24,000 rows/bulan akan **sangat lambat**
- ❌ Load time: 30+ detik untuk baca spreadsheet
- ❌ Concurrent access: 600 user jam 07:00 akan crash

**Solusi: Upload ke Google Drive + Simpan URL**

### Architecture (Optimized)

**Folder Structure:**
```
📁 Root Drive (Milik Service Account atau Developer)
 └─ 📁 Absensi-Foto
     ├─ 📁 2025-12
     │   ├─ 📁 NPSN-20219021 (SD Pasirhalang)
     │   │   ├─ GuruA_20251201_0730_CheckIn.jpg
     │   │   ├─ GuruA_20251201_1430_CheckOut.jpg
     │   │   └─ GuruB_20251201_0745_CheckIn.jpg
     │   └─ 📁 NPSN-20219022 (SMP Bandung)
     │       └─ ...
     └─ 📁 2026-01
         └─ ...
```

**Benefits:**
- ✅ Organized by month (easy to auto-delete old)
- ✅ Separated by school NPSN
- ✅ Filename include timestamp untuk unique

### Implementation Flow

#### **1. Client-Side Compression (Form.html)**

```javascript
/**
 * Compress foto SEBELUM upload
 * Target: 600px width, quality 60% = ~20-30KB per file
 */
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Resize to max 600px width (aggressive for mobile)
                const maxWidth = 600;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress quality 60% (balance size vs quality)
                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/jpeg',
                    0.6
                );
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

#### **2. Server-Side Upload (Code.gs)**

```javascript
/**
 * Upload foto ke Google Drive dengan folder organization
 */
function uploadPhotoToDrive(base64Data, fileName, npsn) {
    try {
        // Decode base64
        const base64Content = base64Data.split(',')[1]; // Remove "data:image/jpeg;base64,"
        const blob = Utilities.newBlob(
            Utilities.base64Decode(base64Content),
            'image/jpeg',
            fileName
        );
        
        // Get or create folder structure
        const folder = getOrCreatePhotoFolder(npsn);
        
        // Upload file
        const file = folder.createFile(blob);
        
        // Set sharing permission (Anyone with link can view)
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // Return public URL
        return file.getUrl();
        
    } catch (error) {
        Logger.log('Upload Error: ' + error.message);
        return null;
    }
}

/**
 * Get atau create folder structure: Absensi-Foto/2025-12/NPSN-xxxxx
 */
function getOrCreatePhotoFolder(npsn) {
    const rootFolderName = 'Absensi-Foto';
    const today = new Date();
    const yearMonth = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM');
    
    // 1. Root folder
    let rootFolder = getFolderByName(rootFolderName);
    if (!rootFolder) {
        rootFolder = DriveApp.createFolder(rootFolderName);
    }
    
    // 2. Year-Month folder
    let monthFolder = getFolderByName(yearMonth, rootFolder);
    if (!monthFolder) {
        monthFolder = rootFolder.createFolder(yearMonth);
    }
    
    // 3. NPSN folder
    const npsnFolderName = 'NPSN-' + npsn;
    let npsnFolder = getFolderByName(npsnFolderName, monthFolder);
    if (!npsnFolder) {
        npsnFolder = monthFolder.createFolder(npsnFolderName);
    }
    
    return npsnFolder;
}

/**
 * Helper: Find folder by name
 */
function getFolderByName(name, parentFolder) {
    const folders = parentFolder ? parentFolder.getFoldersByName(name) : DriveApp.getFoldersByName(name);
    return folders.hasNext() ? folders.next() : null;
}
```

#### **3. Generate Unique Filename**

```javascript
/**
 * Format: NamaGuru_YYYYMMDD_HHMM_Type.jpg
 * Contoh: JohnDoe_20251215_0730_CheckIn.jpg
 */
function generatePhotoFilename(namaGuru, type) {
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
    const sanitizedName = namaGuru.replace(/[^a-zA-Z0-9]/g, ''); // Remove special chars
    
    return `${sanitizedName}_${timestamp}_${type}.jpg`;
}
```

### Auto-Delete Old Photos (Save Storage)

**Strategy:** Keep last 3 months only (delete older)

```javascript
/**
 * Auto-delete photos older than 3 months
 * Run via: Admin Menu atau Time-based Trigger
 */
function autoDeleteOldPhotos() {
    const rootFolder = getFolderByName('Absensi-Foto');
    if (!rootFolder) {
        Logger.log('Folder Absensi-Foto tidak ditemukan');
        return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3); // 3 bulan yang lalu
    
    const cutoffYearMonth = Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy-MM');
    
    let deletedCount = 0;
    const monthFolders = rootFolder.getFolders();
    
    while (monthFolders.hasNext()) {
        const folder = monthFolders.next();
        const folderName = folder.getName(); // Format: "2025-12"
        
        // Bandingkan string (karena format yyyy-MM bisa di-compare langsung)
        if (folderName < cutoffYearMonth) {
            // Trash entire folder (soft delete)
            folder.setTrashed(true);
            deletedCount++;
            Logger.log('Deleted folder: ' + folderName);
        }
    }
    
    SpreadsheetApp.getUi().alert(
        `✅ Auto-delete selesai!\n\n` +
        `Folder yang dihapus: ${deletedCount}\n` +
        `Cutoff date: ${cutoffYearMonth}`
    );
}
```

### Storage Estimation (600-700 Users)

**Monthly Usage:**
- 600 user × 2 foto/hari (Check In + Out) × 20 hari kerja = 24,000 foto
- Compressed size: ~25KB/foto
- **Total/bulan**: 24,000 × 25KB = **600MB**

**With 3-Month Retention:**
- 600MB × 3 = **1.8GB** (well within 15GB free Drive)

**Spreadsheet Size (URL only):**
- 24,000 rows × 50 char URL = **1.2MB** (very fast load!)
- vs Base64: 24,000 × 60KB = **1.44GB** (super slow!)

### Performance Comparison

| Metric | Base64 | Drive URL |
|--------|--------|-----------|
| Size per row | 60KB | 0.05KB |
| 24k rows total | 1.44GB | 1.2MB |
| Load time | 30+ sec | <2 sec |
| Upload time | Instant | 3-5 sec |
| Concurrent 600 user | ❌ Crash | ✅ OK |
| Storage limit | Sheet cell 50k char | Drive 15GB free |

**Winner: Drive URL** ✅

### Error Handling

**Upload Failed Scenarios:**

1. **No Internet:**
   - Save to LocalStorage queue
   - Auto-retry when online
   
2. **Drive Quota Exceeded:**
   - Alert admin
   - Trigger auto-delete old photos
   
3. **Permission Error:**
   - Check service account permissions
   - Fallback to user's own Drive

**Code Example:**
```javascript
function processCheckInWithPhoto(data) {
    try {
        const photoUrl = uploadPhotoToDrive(data.photo, data.filename, data.npsn);
        
        if (!photoUrl) {
            // Upload failed - save without photo or retry
            return {
                success: false,
                message: 'Upload foto gagal. Coba lagi atau hubungi admin.'
            };
        }
        
        // Save to spreadsheet with URL
        saveAttendance({
            ...data,
            photoUrl: photoUrl
        });
        
        return { success: true, photoUrl: photoUrl };
        
    } catch (error) {
        Logger.log('Error: ' + error.message);
        return { success: false, message: error.message };
    }
}
```

---

## 6. Direct Dashboard Access (No Login Page)

### Masalah Apps Script:
- ❌ Tidak bisa maintain session/state antar page load
- ❌ Tidak ada cookie persistence untuk multi-page auth
- ❌ Setiap doGet() adalah fresh request

### Solusi: Single Page Application (SPA)

**Architecture:**
```
URL: https://script.google.com/macros/s/xxx/exec?npsn=20219021
  ↓
Direct load ke Dashboard (Form.html)
  ↓
Semua interaksi via JavaScript client-side
  ↓
Submit data via google.script.run ke Code.gs
```

**Implementation:**
1. **Hapus** konsep login page terpisah
2. **Form.html** langsung jadi main interface
3. **Initial Load** via URL parameter:
   ```javascript
   // Di Form.html
   const urlParams = new URLSearchParams(window.location.search);
   const npsn = urlParams.get('npsn');
   
   // Kirim ke server untuk load data sekolah
   google.script.run
     .withSuccessHandler(initDashboard)
     .loadSchoolData(npsn);
   ```
4. **Server Side** (Code.gs):
   ```javascript
   function doGet(e) {
     const npsn = e.parameter.npsn;
     
     // Validasi NPSN di registry
     if (!SCHOOL_REGISTRY[npsn]) {
       return HtmlService.createHtmlOutput('NPSN tidak valid');
     }
     
     // Load Form.html langsung
     return HtmlService.createHtmlOutputFromFile('Form')
       .setTitle('Sistem Absensi')
       .addMetaTag('viewport', 'width=device-width, initial-scale=1');
   }
   
   function loadSchoolData(npsn) {
     const spreadsheetId = SCHOOL_REGISTRY[npsn];
     const ss = SpreadsheetApp.openById(spreadsheetId);
     
     // Load config, database, dll
     return {
       config: getConfig(ss),
       teachers: getTeachers(ss),
       schoolName: ss.getName()
     };
   }
   ```

**User Experience:**
1. Guru scan QR Code → QR berisi URL: `...exec?npsn=20219021`
2. Browser langsung buka dashboard
3. Guru pilih nama → Statistik muncul
4. Guru klik Check In/Out/Izin → Flow langsung jalan
5. **No login, no session, no redirect**

---

## 7. Error Handling & Edge Cases

### A. Koneksi Internet Terputus

**Saat Submit Data:**
- Detect offline: `!navigator.onLine`
- Simpan data ke **LocalStorage** browser:
  ```javascript
  function saveOfflineData(data) {
    let queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    queue.push(data);
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
    alert('Koneksi terputus. Data disimpan sementara.');
  }
  ```
- **Auto-sync** saat online kembali:
  ```javascript
  window.addEventListener('online', () => {
    syncOfflineQueue();
  });
  
  function syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    queue.forEach(data => {
      google.script.run.processAttendance(data);
    });
    localStorage.removeItem('offlineQueue');
    alert('Data offline berhasil disinkronkan!');
  }
  ```

### B. Spreadsheet Tidak Ditemukan

**Trigger:** NPSN salah atau Spreadsheet ID invalid

**Response:**
```javascript
try {
  const ss = SpreadsheetApp.openById(spreadsheetId);
} catch (e) {
  return {
    error: true,
    message: 'Database sekolah tidak ditemukan. Hubungi administrator.'
  };
}
```

### C. Sheet Config Kosong / Belum Setup

**Validation:**
```javascript
function validateConfig(config) {
  const required = ['LATITUDE_SEKOLAH', 'LONGITUDE_SEKOLAH', 'RADIUS_METER', 'JAM_MASUK'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    return {
      error: true,
      message: `Konfigurasi belum lengkap: ${missing.join(', ')}`
    };
  }
  return { error: false };
}
```

### D. Duplicate Check In di Hari yang Sama

**Validation sebelum submit:**
```javascript
function isDuplicateCheckIn(userName, today) {
  const sheet = ss.getSheetByName('data-absensi');
  const data = sheet.getDataRange().getValues();
  
  const exists = data.some(row => {
    const rowDate = new Date(row[0]).toDateString();
    const todayStr = today.toDateString();
    return row[1] === userName && row[2] === 'Check In' && rowDate === todayStr;
  });
  
  if (exists) {
    return {
      error: true,
      message: 'Anda sudah melakukan Check In hari ini.'
    };
  }
  return { error: false };
}
```

---

## 8. Complete Flow Diagram

### FLOW 1: Check In Process

```
START
  ↓
[Guru klik Check In]
  ↓
[Ambil GPS Coordinates] ────→ [Error GPS?] ──Yes→ [Show Retry/Contact Admin] → END
  ↓ No                                           
[Hitung Jarak ke Sekolah]
  ↓
[Di luar radius?] ──Yes→ [DITOLAK] → Alert → END
  ↓ No
[Cek Jam Sekarang vs JAM_MASUK]
  ↓
[Terlambat?] ──Yes→ [Prompt Input Alasan] → [Save to Kolom G]
  ↓ No              ↓
[Status = Hadir] ←┘
  ↓
[Buka Kamera] → [Ambil Foto] → [Compress to Base64]
  ↓
[Input PIN (6 digit)]
  ↓
[Validasi PIN] ────→ [Salah?] ──Yes→ [Attempt++] → [>3x?] ──Yes→ [Lockout 5 Min] → END
  ↓ No                                   ↓ No
  │                                   [Retry]
  │                                      ↑
  └──────────────────────────────────────┘
  ↓
[Submit ke data-absensi]
  ↓
[Success Message]
  ↓
END
```

### FLOW 2: Check Out Process

```
START
  ↓
[Guru klik Check Out]
  ↓
[Cek Record Check In Hari Ini] ──→ [Tidak Ada?] ──Yes→ [Alert Belum Check In] → END
  ↓ No
[Cek Jam Sekarang vs JAM_PULANG]
  ↓
[< JAM_PULANG?] ──Yes→ [Confirm "Check Out Lebih Awal?"] ──No→ END
  ↓ No              ↓ Yes
  └────────────────┘
  ↓
[Input PIN]
  ↓
[Validasi] ──→ [Salah?] ──Yes→ [Retry/Lockout] → END
  ↓ No
[Submit data-absensi]
  ↓
END
```

### FLOW 3: Izin Process

```
START
  ↓
[Guru klik Ajukan Izin]
  ↓
[Cek Jam vs JAM_BATAS_IZIN] ──→ [Lewat Batas?] ──Yes→ [Tombol Disabled/Alert] → END
  ↓ No
[Form Izin Muncul]
  ↓
[Pilih Jenis Izin] → [Input Alasan] → [Ambil Foto Bukti]
  ↓
[Compress Foto ke Base64]
 ↓
[Input PIN]
  ↓
[Validasi PIN] ──→ [Salah?] ──Yes→ [Retry/Lockout] → END
  ↓ No
[Submit dengan Status=Izin]
  ↓
END
```

---

## 9. API Endpoints (google.script.run)

### Client → Server Functions:

| Function Name | Parameters | Return | Purpose |
|---------------|------------|--------|---------|
| `loadSchoolData` | `npsn` | `{config, teachers, schoolName}` | Initial load sekolah data |
| `getTeacherStats` | `userName, npsn` | `{hadir, izin, alpha}` | Ambil statistik bulanan |
| `processCheckIn` | `{userName, coords, photo, pin, reason}` | `{success, message}` | Submit Check In |
| `processCheckOut` | `{userName, coords, pin}` | `{success, message}` | Submit Check Out |
| `processIzin` | `{userName, jenisIzin, alasan, photo, pin}` | `{success, message}` | Submit Izin |
| `validatePIN` | `userName, pin, npsn` | `{valid, message}` | Cek PIN validity |
| `adminOverride` | `{adminPIN, teacherName, data}` | `{success}` | Manual approval |

---

## 10. Timeline Implementasi (Priority)

### Phase 1: Core Foundation (P1) - Est. 3-5 hari
- [x] Setup Registry (NPSN → Spreadsheet ID)
- [ ] Create sheet templates (database, data-absensi, config, jadwal-kerja)
- [ ] Implement `doGet()` direct dashboard access
- [ ] Basic UI Form.html (nama dropdown, statistik cards)

### Phase 2: Check In/Out Logic (P1) - Est. 5-7 hari
- [ ] GPS validation function (Haversine)
- [ ] GPS strict mode (reject out of radius)
- [ ] Late detection & reason prompt
- [ ] Photo capture + Base64 compression
- [ ] PIN validation with lockout
- [ ] Submit Check In logic
- [ ] Check Out validation & submit

### Phase 3: Izin System (P2) - Est. 3-4 hari
- [ ] Izin button + time validation
- [ ] Form jenis izin
- [ ] Photo bukti izin
- [ ] Submit izin logic

### Phase 4: Statistics & Calculation (P2) - Est. 4-5 hari
- [ ] Setup jadwal-kerja sheet
- [ ] Calculate Hadir (from data-absensi)
- [ ] Calculate Izin (from data-absensi)
- [ ] Calculate Alpha (workdays - hadir - izin)
- [ ] Display real-time stats

### Phase 5: Error Handling & Edge Cases (P2) - Est. 3-4 hari
- [ ] Offline data queue (LocalStorage)
- [ ] GPS error handling
- [ ] Admin override mechanism
- [ ] Duplicate check validation
- [ ] Config validation

### Phase 6: Testing & Optimization (P3) - Est. 2-3 hari
- [ ] Test semua flow (Check In/Out/Izin)
- [ ] Test edge cases (GPS error, offline, duplicate)
- [ ] Performance optimization (load time)
- [ ] Cross-device testing (Android/iOS)

**Total Estimasi: 20-28 hari kerja**

---

## 11. Security Considerations

### A. Data Privacy
- PIN stored as **plain text** (acceptable untuk internal school system)
- Photo Base64 hanya accessible via spreadsheet permissions
- Spreadsheet hanya bisa diakses oleh akun sekolah

### B. Access Control
- Web App public, tapi butuh valid NPSN untuk akses data
- Invalid NPSN = error page
- Admin override butuh admin PIN terpisah (kolom khusus di config)

### C. Abuse Prevention
- PIN lockout 5 menit setelah 3x salah
- GPS strict mode prevent fake location (dengan margin error 50m accuracy)
- Duplicate check prevent spam Check In

---

**END OF SPECIFICATION**
