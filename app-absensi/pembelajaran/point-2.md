# 📚 Point 2: getSchoolPublicData() - Load Data Publik Sekolah

## Penjelasan Lengkap dalam Bahasa Indonesia

---

## 🎯 1. PENGERTIAN DAN TUJUAN FUNGSI

### 1.1 Apa Itu getSchoolPublicData()?

`getSchoolPublicData(npsn)` adalah fungsi yang bertugas untuk **mengambil data publik sekolah** yang diperlukan untuk ditampilkan di halaman login aplikasi. Data ini mencakup:

- **Nama sekolah** - Untuk ditampilkan sebagai branding
- **Logo sekolah** - Untuk ditampilkan di halaman login

Fungsi ini sangat penting karena memberikan identitas visual ke setiap sekolah yang menggunakan aplikasi absensi ini.

### 1.2 Kapan Fungsi Ini Dipanggil?

Fungsi ini dipanggil pada saat-saat berikut:

1. **Saat halaman pertama kali dimuat** - Untuk menampilkan logo dan nama sekolah sebelum user login
2. **Saat user membuka aplikasi** - Untuk menampilkan branding sekolah yang bersangkutan
3. **Saat perlu menampilkan info sekolah** - Data ini bersifat "publik" karena tidak memerlukan autentikasi

### 1.3 Mengapa Fungsi Ini Diperlukan?

Tanpa fungsi ini, semua sekolah akan tampil sama di halaman login. Dengan adanya fungsi ini:
- Setiap sekolah bisa menampilkan logo masing-masing
- Nama sekolah yang tampil sesuai dengan sekolah user
- User merasa lebih personal dengan sekolahnya
- Mendukung sistem multi-sekolah dengan satu aplikasi

### 1.4 Output yang Dihasilkan

Fungsi ini mengembalikan objek JSON seperti berikut:

```javascript
{
  success: true,  // Jika berhasil
  data: {
    schoolName: "SDN Pasirhalang",  // Nama sekolah
    logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."  // Logo dalam format base64
  }
}

// Jika gagal:
{
  success: false,
  message: 'NPSN tidak terdaftar.'
}
```

---

## 🧠 2. LOGIKA ALGORITMA

### 2.1 Penjelasan Masalah

Masalah yang perlu diselesaikan adalah: **"Bagaimana cara mengambil dan menampilkan data publik sekolah (nama dan logo) dengan validasi yang baik?"**

Masalah ini dipecah menjadi beberapa langkah:

```
Langkah 1: Validasi NPSN
├── Apakah NPSN kosong/null?
└── Apakah NPSN terdaftar di registry?

Langkah 2: Buka Database
├── Ambil Spreadsheet ID dari registry
└── Buka spreadsheet menggunakan ID tersebut

Langkah 3: Ambil Konfigurasi
├── Baca sheet "config"
└── Ambil nama sekolah dari konfigurasi

Langkah 4: Ambil Logo
├── Cari file "logo.png" di folder Google Drive
├── Jika ada → Convert ke format base64
└── Jika tidak ada → Gunakan nilai null

Langkah 5: Kembalikan Hasil
├── Susun objek response
└── Return ke frontend
```

### 2.2 Flowchart (Diagram Alur)

```
                    ┌─────────────────────────┐
                    │  Mulai Fungsi           │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Ambil Parameter npsn   │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  NPSN Valid dan         │
                    │  Terdaftar?             │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │  TIDAK (Gagal)  │                 │  YA (Lanjut)    │
    │                 │                 │                 │
    │ Return error    │                 │ Buka Spreadsheet│
    │ message         │                 │ dengan ID       │
    └─────────────────┘                 └────────┬────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────────┐
                                    │  Load Config dari       │
                                    │  sheet "config"         │
                                    └───────────┬─────────────┘
                                                │
                                                ▼
                                    ┌─────────────────────────┐
                                    │  Ambil Logo dari        │
                                    │  Google Drive           │
                                    └───────────┬─────────────┘
                                                │
                                                ▼
                                    ┌─────────────────────────┐
                                    │  File logo.png          │
                                    │  Ditemukan?             │
                                    └───────────┬─────────────┘
                                                │
                              ┌─────────────────┴─────────────────┐
                              │                                   │
                              ▼                                   ▼
                    ┌─────────────────┐                 ┌─────────────────┐
                    │  TIDAK          │                 │  YA             │
                    │                 │                 │                 │
                    │ logo = null     │                 │ Convert ke      │
                    │                 │                 │ Base64          │
                    └────────┬────────┘                 └────────┬────────┘
                             │                                   │
                             └─────────────────┬─────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────────┐
                                    │  Susun Response:        │
                                    │  {                      │
                                    │    success: true,       │
                                    │    data: {              │
                                    │      schoolName: ...,   │
                                    │      logo: ...          │
                                    │    }                    │
                                    │  }                      │
                                    └───────────┬─────────────┘
                                                │
                                                ▼
                                    ┌─────────────────────────┐
                                    │  Return Response        │
                                    └───────────┬─────────────┘
                                                │
                                                ▼
                                    ┌─────────────────────────┐
                                    │  Selesai                │
                                    └─────────────────────────┘
```

### 2.3 Tahap Pembentukan Algoritma

#### Tahap 1: Validasi NPSN
Sebelum melakukan operasi apapun, kita harus memastikan NPSN yang diberikan valid. Jika NPSN tidak valid, tidak perlu melakukan operasi lain yang akan sia-sia.

**Logika:**
```
JIKA NPSN kosong ATAU NPSN tidak terdaftar di registry
  → Gagal, kembalikan pesan error
LAKUKAN
  → Lanjutkan ke tahap berikutnya
```

#### Tahap 2: Membuka Spreadsheet
Setelah NPSN valid, kita perlu membuka database (spreadsheet) sekolah tersebut. Setiap sekolah punya spreadsheet berbeda, dan kita perlu tahu spreadsheet mana yang harus dibuka.

**Logika:**
```
Dari SCHOOL_REGISTRY, cari Spreadsheet ID berdasarkan NPSN
Buka spreadsheet menggunakan SpreadsheetApp.openById()
```

#### Tahap 3: Membaca Konfigurasi
Dari spreadsheet, kita perlu membaca konfigurasi sekolah, terutama nama sekolah. Nama sekolah bisa diambil dari sheet "config".

**Logika:**
```
Gunakan fungsi loadConfig() untuk membaca sheet "config"
Ambil property namaSekolah dari hasil config
```

#### Tahap 4: Mengambil Logo dari Google Drive
Logo sekolah disimpan di Google Drive, di folder yang sama dengan spreadsheet. Kita perlu mencari file dengan nama "logo.png".

**Logika:**
```
Ambil file spreadsheet dari Drive
Ambil folder parent dari file tersebut
Cari file dengan nama "logo.png" di dalam folder tersebut
JIKA ditemukan:
  → Baca file sebagai blob
  → Convert blob ke bytes
  → Encode bytes ke base64
  → Format: "data:image/png;base64,xxxxx"
JIKA tidak ditemukan:
  → logo = null
```

#### Tahap 5: Menyusun dan Mengembalikan Response
Setelah semua data terkumpul, susun objek response dan kembalikan ke frontend.

**Logika:**
```
Buat objek dengan format:
{
  success: true/false,
  data: {
    schoolName: (nama sekolah dari config atau fallback),
    logo: (base64 string atau null)
  }
}
Return objek tersebut
```

---

## 📝 3. PENJELASAN DETAIL BARIS PER BARIS

### 3.1 Deklarasi Fungsi dan Try-Catch (Baris 266-269)

```javascript
function getSchoolPublicData(npsn) {
  try {
```

**Penjelasan:**

**`function getSchoolPublicData(npsn) {`**

Ini adalah baris untuk mendeklarasikan fungsi baru dengan ketentuan:

- **`function`** - Kata kunci JavaScript untuk membuat fungsi
- **`getSchoolPublicData`** - Nama fungsi yang kita buat
  - Kata "get" menunjukkan fungsi ini mengambil/mengembalikan data
  - Kata "PublicData" menunjukkan jenis data yang diambil
  - Kata "School" menunjukkan data tersebut tentang sekolah
  - Kata "NPSN" menunjukkan parameter yang diperlukan
- **`(npsn)`** - Parameter input fungsi
  - NPSN adalah singkatan dari "Nomor Pokok Sekolah Nasional"
  - Ini adalah identitas unik setiap sekolah di Indonesia
  - Tipe datanya bisa string atau number

**`try {`**

- Ini adalah awal dari blok try-catch untuk menangani error
- Semua kode yang berisiko error ditaruh di dalam blok try
- Jika terjadi error, program tidak akan crash, melainkan akan masuk ke blok catch
- Ini adalah praktik yang sangat penting dalam pemrograman

---

### 3.2 Validasi NPSN (Baris 270-272)

```javascript
    if (!npsn || !SCHOOL_REGISTRY[npsn]) {
      return { success: false, message: 'NPSN tidak terdaftar.' };
    }
```

**Penjelasan:**

Ini adalah blok kondisi untuk memvalidasi NPSN yang diberikan. Mari kita bedah satu per satu:

**`if (!npsn || !SCHOOL_REGISTRY[npsn]) {`**

Ini adalah kondisi dengan dua bagian yang dihubungkan dengan operator OR (`||`):

**Bagian 1: `!npsn`**

| Nilai npsn | !npsn (Hasil) | Arti |
|------------|---------------|------|
| `"20205293"` | `false` | NPSN ada, lanjut |
| `null` | `true` | NPSN kosong |
| `undefined` | `true` | NPSN tidak ada |
| `""` (kosong) | `true` | NPSN kosong |

Operator `!` (NOT) akan membalikkan nilai boolean. Jika npsn kosong/null, maka `!npsn` akan bernilai `true`.

**Bagian 2: `!SCHOOL_REGISTRY[npsn]`**

- `SCHOOL_REGISTRY` adalah objek besar yang menyimpan mapping dari NPSN ke Spreadsheet ID
- Contoh isi: `{ "20205293": "1-elR-0kxj...", "20206262": "1hVDa2Cg..." }`
- `[npsn]` adalah cara mengakses property objek dengan nama yang dinamis
- Jika NPSN tidak terdaftar, `SCHOOL_REGISTRY[npsn]` akan mengembalikan `undefined`
- Operator `!` akan mengubah `undefined` menjadi `true`

**Operator OR (`||`)**

```
JIKA Bagian 1 BENAR ATAU Bagian 2 BENAR
  → Jalankan blok if
LAKUKAN
  → Lanjutkan ke kode setelah blok if
```

**Contoh:**
- NPSN = null → `!null` = true → ENTER blok if ✅
- NPSN = "99999999" (tidak terdaftar) → `!undefined` = true → ENTER blok if ✅
- NPSN = "20205293" (terdaftar) → `!"1-elR..."` = false → SKIP blok if ✅

**`return { success: false, message: 'NPSN tidak terdaftar.' };`**

- `return` = keluar dari fungsi dan kembalikan nilai
- `{ ... }` = membuat objek baru
- `success: false` = menandakan operasi gagal
- `message: 'NPSN tidak terdaftar.'` = pesan error yang akan ditampilkan ke user

---

### 3.3 Membuka Spreadsheet (Baris 271-272)

```javascript
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);
```

**Penjelasan:**

**Baris 1: `const spreadsheetId = SCHOOL_REGISTRY[npsn];`**

- `const` = deklarasi variabel konstanta (tidak bisa diubah nilainya)
- `spreadsheetId` = nama variabel untuk menyimpan ID spreadsheet
- `SCHOOL_REGISTRY[npsn]` = mengambil Spreadsheet ID dari registry berdasarkan NPSN
- Contoh: Jika npsn = "20205293", maka `spreadsheetId` akan berisi "1-elR-0kxjBwsM4TatxDY-XIJBuy69hUY6zM3hMIlFwk"

**Baris 2: `const ss = SpreadsheetApp.openById(spreadsheetId);`**

- `SpreadsheetApp` adalah layanan Google Apps Script untuk mengakses Google Sheets
- `.openById()` adalah method untuk membuka spreadsheet berdasarkan ID
- `spreadsheetId` adalah parameter yang berisi ID spreadsheet
- `ss` adalah variabel yang menyimpan object spreadsheet (nama "ss" adalah singkatan dari "spreadsheet")
- Object `ss` ini akan digunakan untuk operasi selanjutnya seperti membaca sheet, menulis data, dll

---

### 3.4 Load Config dan Ambil Logo (Baris 274-275)

```javascript
    const config = loadConfig(ss, npsn);
    const logoBase64 = getSchoolLogo(spreadsheetId);
```

**Penjelasan:**

**Baris 1: `const config = loadConfig(ss, npsn);`**

- `loadConfig()` adalah fungsi pembantu (helper function) yang telah didefinisikan di tempat lain
- Fungsi ini membaca konfigurasi dari sheet "config" di spreadsheet
- Parameter pertama (`ss`) = object spreadsheet yang baru dibuka
- Parameter kedua (`npsn`) = NPSN sekolah (untuk lookup koordinat hardcoded)
- Hasilnya adalah object `config` yang berisi:
  - `namaSekolah` - Nama sekolah
  - `lat`, `lng`, `radius` - Koordinat dan radius geofencing
  - `jamMasuk`, `jamBatasIzin`, `jamPulang` - Konfigurasi waktu
  - dll

**Baris 2: `const logoBase64 = getSchoolLogo(spreadsheetId);`**

- `getSchoolLogo()` adalah fungsi pembantu untuk mengambil logo dari Google Drive
- Fungsi ini mencari file "logo.png" di folder yang sama dengan spreadsheet
- Jika ditemukan, file dikonversi ke format base64
- Jika tidak ditemukan, akan mengembalikan `null`
- Hasilnya disimpan di variabel `logoBase64`

---

### 3.5 Mengembalikan Response Berhasil (Baris 277-283)

```javascript
    return {
      success: true,
      data: {
        schoolName: config.namaSekolah || ss.getName(),
        logo: logoBase64
      }
    };
```

**Penjelasan:**

**`return { ... };`**

- Mengembalikan objek response
- Format ini adalah standar API yang digunakan di seluruh aplikasi

**`success: true`**

- Menandakan operasi berhasil
- Frontend akan memeriksa flag ini untuk menentukan langkah selanjutnya

**`data: { ... }`**

- Objek yang berisi data yang diminta

**`schoolName: config.namaSekolah || ss.getName()`**

Ini adalah logika fallback menggunakan operator OR (`||`):

| config.namaSekolah | ss.getName() | Hasil |
|-------------------|--------------|-------|
| "SDN Pasirhalang" | "Copy of Template" | "SDN Pasirhalang" ✅ |
| "" (kosong) | "SDN Pasirhalang" | "SDN Pasirhalang" ✅ |
| null | "SDN Pasirhalang" | "SDN Pasirhalang" ✅ |

Logika: Gunakan `config.namaSekolah` jika ada dan tidak kosong. Jika tidak, gunakan `ss.getName()` sebagai cadangan.

**`logo: logoBase64`**

- Logo dalam format base64 atau `null` jika tidak ada
- Format: `"data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."`

---

### 3.6 Menangani Error (Baris 284-286)

```javascript
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

**Penjelasan:**

**`} catch (error) {`**

- `}` = menutup blok try
- `catch (error)` = memulai blok untuk menangkap error
- `error` = object yang berisi informasi error
  - `error.name` = jenis error
  - `error.message` = pesan error
  - `error.stack` = jejak/error stack

**`return { success: false, message: error.message };`**

- Jika terjadi error di blok try, kode ini akan dieksekusi
- `success: false` = menandakan operasi gagal
- `error.message` = mengambil pesan error untuk debugging
- User akan melihat pesan ini di frontend

**`}` dan `}`**

- Penutup blok catch dan penutup fungsi

---

## 💡 4. CONTOH KASUS (EDGE CASES)

### Kasus 1: NPSN Null

**Input:**
```javascript
getSchoolPublicData(null)
```

**Proses:**
```
if (!null || !SCHOOL_REGISTRY[null])
  → true || true
  → true
→ RETURN error
```

**Hasil:**
```javascript
{ success: false, message: 'NPSN tidak terdaftar.' }
```

---

### Kasus 2: NPSN Valid, Logo Tidak Ada

**Input:**
```javascript
getSchoolPublicData("20205293")
// Folder tidak punya file "logo.png"
```

**Proses:**
```
Validasi NPSN → LULUS
Buka spreadsheet → BERHASIL
Load config → BERHASIL (namaSekolah = "SDN Pasirhalang")
Get logo → TIDAK DITEMUKAN (null)

Return {
  success: true,
  data: {
    schoolName: "SDN Pasirhalang",
    logo: null
  }
}
```

**Frontend Handling:**
```javascript
if (response.data.logo === null) {
  // Tampilkan logo default
} else {
  // Tampilkan logo sekolah
}
```

---

### Kasus 3: NPSN Valid, Logo Ada

**Input:**
```javascript
getSchoolPublicData("20205293")
// Folder punya file "logo.png"
```

**Proses:**
```
Validasi NPSN → LULUS
Buka spreadsheet → BERHASIL
Load config → BERHASIL
Get logo → DITEMUKAN, convert ke base64

Return {
  success: true,
  data: {
    schoolName: "SDN Pasirhalang",
    logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

**Frontend:**
```html
<img src="data:image/png;base64,..." alt="Logo SDN Pasirhalang">
```

---

### Kasus 4: Config Kosong, Pakai Fallback

**Input:**
```javascript
getSchoolPublicData("20205293")
// Cell B8 (namaSekolah) kosong
```

**Proses:**
```
config.namaSekolah = "" (kosong)
ss.getName() = "SDN Pasirhalang"

schoolName = "" || "SDN Pasirhalang"
           = "SDN Pasirhalang" (fallback bekerja!)
```

**Hasil:**
```javascript
{
  success: true,
  data: {
    schoolName: "SDN Pasirhalang",
    logo: null
  }
}
```

---

## 📊 5. VISUALISASI ALUR DATA

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Form.html)                      │
│                                                             │
│  Saat halaman dimuat:                                       │
│  google.script.run.getSchoolPublicData(npsn)              │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (getSchoolPublicData)             │
│                                                             │
│  1. VALIDASI NPSN                                           │
│     if (!npsn || !SCHOOL_REGISTRY[npsn])                   │
│         → Jika gagal: return error                         │
│                                                             │
│  2. BUKA SPREADSHEET                                       │
│     spreadsheetId = SCHOOL_REGISTRY[npsn]                  │
│     ss = SpreadsheetApp.openById(spreadsheetId)            │
│                                                             │
│  3. LOAD CONFIG                                            │
│     config = loadConfig(ss, npsn)                          │
│     → Ambil: namaSekolah, koordinat, jam, dll              │
│                                                             │
│  4. AMBIL LOGO                                             │
│     logoBase64 = getSchoolLogo(spreadsheetId)              │
│     → Cari logo.png di folder Drive                        │
│     → Convert ke base64 jika ada                           │
│                                                             │
│  5. SUSUN RESPONSE                                         │
│     {                                                       │
│       success: true,                                        │
│       data: {                                               │
│         schoolName: config.namaSekolah || ss.getName(),    │
│         logo: logoBase64                                   │
│       }                                                     │
│     }                                                       │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  KEMBALI KE FRONTEND                       │
│                                                             │
│  {                                                         │
│    "success": true,                                        │
│    "data": {                                               │
│      "schoolName": "SDN Pasirhalang",                      │
│      "logo": "data:image/png;base64,..."                   │
│    }                                                       │
│  }                                                         │
│                                                             │
│  Frontend menampilkan:                                     │
│  - Logo sekolah di halaman login                          │
│  - Nama sekolah sebagai branding                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 6. RINGKASAN KONSEP YANG DIPELAJARI

### 6.1 Konsep JavaScript

| Konsep | Contoh Kode | Penjelasan |
|--------|-------------|------------|
| **Deklarasi Fungsi** | `function getSchoolPublicData(npsn) { }` | Membuat fungsi baru |
| **Try-Catch** | `try { } catch (error) { }` | Menangani error dengan aman |
| **Operator OR (||)** | `config.namaSekolah \|\| ss.getName()` | Logika fallback |
| **Operator NOT (!)** | `!npsn` | Membalikkan nilai boolean |
| **Akses Property Objek** | `SCHOOL_REGISTRY[npsn]` | Mengakses property dengan nama dinamis |
| **Object Literal** | `{ success: true, data: { ... } }` | Membuat objek |
| **Konstanta** | `const spreadsheetId = ...` | Variabel yang tidak bisa diubah |

### 6.2 Konsep Google Apps Script

| Konsep | Contoh Kode | Penjelasan |
|--------|-------------|------------|
| **SpreadsheetApp** | `SpreadsheetApp.openById()` | Layanan untuk mengakses Google Sheets |
| **Object Spreadsheet** | `ss.getName()` | Method untuk mengakses properti spreadsheet |
| **Fungsi Helper** | `loadConfig(ss, npsn)` | Memecah kode menjadi fungsi kecil |
| **Return Object** | `return { success: true, ... }` | Mengembalikan data ke pemanggil |

### 6.3 Konsep Arsitektur Aplikasi

| Konsep | Penjelasan |
|--------|------------|
| **Validasi Input** | Memeriksa data yang masuk sebelum diproses |
| **Registry Pattern** | Pemetaan NPSN ke Spreadsheet ID untuk akses cepat |
| **Fallback Logic** | Menggunakan nilai cadangan jika nilai utama kosong |
| **Error Handling** | Menangani error agar aplikasi tidak crash |
| **API Response Format** | Format standar untuk respons ke frontend |

---

## ✅ 7. KESIMPULAN

### Apa yang Dipelajari dari Fungsi Ini?

1. **Cara Validasi Input** - Memeriksa NPSN sebelum melakukan operasi apapun
2. **Cara Mengakses Spreadsheet** - Menggunakan SpreadsheetApp untuk membuka database
3. **Registry Pattern** - Pemetaan NPSN ke database dengan akses O(1)
4. **Fallback Logic** - Menggunakan nilai cadangan dengan operator `||`
5. **Error Handling** - Try-catch untuk mencegah aplikasi crash
6. **API Design** - Format response standar dengan success flag dan data
7. **Data Publik vs Privat** - Data yang bisa diakses tanpa login (logo, nama sekolah)

### Mengapa Fungsi Ini Penting?

- Memberikan identitas visual ke setiap sekolah
- Mendukung sistem multi-sekolah dalam satu aplikasi
- Menampilkan branding yang personal
- Terintegrasi dengan Google Drive untuk logo

---

Apakah ada bagian tertentu dari fungsi `getSchoolPublicData()` yang ingin dijelaskan lebih detail?