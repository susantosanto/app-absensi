# 📚 **PELAJARAN BAGIAN 1: doGet() - ENTRY POINT APLIKASI**

Mari kita mulai dari fungsi yang pertama kali dieksekusi saat user membuka aplikasi Web App.

---

## 🎯 **1. PENGERTIAN DAN TUJUAN FUNGSI**

### 1.1 Apa Fungsi Ini?
`doGet(e)` adalah **Entry Point** atau gerbang utama aplikasi Web App Google Apps Script.

### 1.2 Kapan Dieksekusi?
Setiap kali user mengakses URL aplikasi:
```
https://script.google.com/macros/s/SCRIPT_ID/exec?npsn=20205293
                                        ↑
                                    Parameter ini
                                    yang ditangkap
```

### 1.3 Tujuan Utama
1. **Menerima parameter dari URL** (NPSN)
2. **Validasi NPSN** (apakah sekolah terdaftar?)
3. **Load dan render halaman HTML** (Form.html)
4. **Pass variabel ke frontend** (untuk conditional rendering)

### 1.4 Output Yang Dihasilkan
```javascript
HtmlOutput object → Halaman HTML lengkap yang siap ditampilkan di browser
```

---

## 🧠 **2. ALGORITMA: PEMIKIRAN LOGIKA STEP-BY-STEP**

### 2.1 Problem Statement
> "Bagaimana cara membuat aplikasi Web App yang bisa melayani banyak sekolah berdasarkan NPSN dari URL parameter?"

### 2.2 Breakdown Masalah

```
┌─────────────────────────────────────────────┐
│  PROBLEM: Multi-Sekolah Entry Point       │
└───────────────┬───────────────────────────┘
                │
    ┌───────────┴───────────┬─────────────┬─────────────┐
    │                       │             │             │
    ▼                       ▼             ▼             ▼
┌──────────┐      ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Terima   │      │ Validasi     │  │ Load     │  │ Render   │
│ Parameter │      │ NPSN        │  │ Template │  │ HTML     │
│ dari URL  │      │ Terdaftar?  │  │ HTML     │  │ ke       │
└────┬─────┘      └──────┬───────┘  └─────┬────┘  └─────┬────┘
     │                    │                │              │
     ▼                    ▼                ▼              ▼
  e.parameter        SCHOOL_REGISTRY    createTemplate  evaluate()
    .npsn              [npsn]         FromFile
```

### 2.3 Flowchart Algoritma

```
START
  │
  ├─▶ Ambil parameter NPSN dari URL
  │    (e.parameter.npsn)
  │
  ├─▶ Load HTML Template
  │    (HtmlService.createTemplateFromFile('Form'))
  │
  ├─▶ Validasi NPSN
  │    │
  │    ├─▶ NPSN null/undefined?
  │    │    │
  │    │    ├─▶ YA → Set template.npsn = null
  │    │    │
  │    │    └─▶ TIDAK → Lanjut
  │    │
  │    ├─▶ NPSN terdaftar di SCHOOL_REGISTRY?
  │    │    │
  │    │    ├─▶ TIDAK → Set template.npsn = null
  │    │    │
  │    │    └─▶ YA → Set template.npsn = valid NPSN
  │
  ├─▶ Evaluate Template
  │    (Convert template ke HtmlOutput)
  │
  ├─▶ Configure HTML Output
  │    ├─▶ Set Title: "SIKADIR v.2.0"
  │    ├─▶ Set Meta Tag: viewport (mobile-friendly)
  │    └─▶ Set X-Frame-Options: ALLOWALL
  │
  └─▶ RETURN: HtmlOutput object

END
```

### 2.4 Tahap Pembentukan Algoritma

**TAHAP 1: Parameter Extraction (Pengambilan Parameter)**
```
Dari URL, kita perlu:
- Extract parameter "npsn"
- Simpan untuk validasi selanjutnya
```

**TAHAP 2: Template Loading (Loading Template)**
```
Google Apps Script punya 2 cara render HTML:
1. createHtmlOutput() - HTML statis (tidak bisa pass variabel)
2. createTemplateFromFile() - HTML dinamis (BISA pass variabel)

Kita pakai cara 2 karena perlu pass NPSN ke frontend
```

**TAHAP 3: Parameter Validation (Validasi Parameter)**
```
Validasi 3 kondisi:
1. Parameter NPSN ada di URL?
2. NPSN terdaftar di SCHOOL_REGISTRY?
3. Validasi result harus di-pass ke frontend

Frontend akan:
- Show error jika NPSN null
- Show app jika NPSN valid
```

**TAHAP 4: HTML Rendering (Rendering HTML)**
```
Template harus di-evaluate sebelum di-return:
- Proses semua scriptlet template (<?= ... ?>)
- Convert ke final HTML string
- Siap ditampilkan di browser
```

**TAHAP 5: Output Configuration (Konfigurasi Output)**
```
HtmlOutput perlu beberapa konfigurasi:
- Title (tab browser)
- Viewport (mobile responsive)
- X-Frame-Options (iframe embedding permissions)
```

---

## 📝 **3. PENJELASAN BARIS PER BARIS**

### 3.1 Function Signature (Line 231)

```javascript
function doGet(e) {
```

**Penjelasan:**

**`function` = Keyword untuk deklarasi fungsi**
- Ini adalah reserved keyword di JavaScript
- Mengindikasikan bahwa kita sedang membuat fungsi baru

**`doGet` = Nama fungsi (MUST BE EXACT)**
- **CRITICAL:** Google Apps Script MENCARI fungsi dengan nama persis `doGet`
- Tidak boleh diganti (bukan `do_get`, `DoGet`, `getDo`, dll)
- Ini adalah **predefined function name** untuk Web Apps
- **Function lain yang predefined:**
  - `doPost(e)` - Untuk POST requests
  - `doGet(e)` - Untuk GET requests (Web Apps)
  
**Mengapa doGet?**
- Web App biasanya menggunakan HTTP GET request
- Browser mengakses URL dengan GET method
- Google Apps Script otomatis routing ke `doGet()` untuk GET requests

**`(e)` = Parameter event object**
- `e` = Nama parameter (singkatan dari "event")
- Type: Object yang berisi informasi tentang request
- **Properties yang tersedia:**
  ```javascript
  e.parameter = { npsn: "20205293" }  // URL query parameters
  e.queryString = "npsn=20205293"      // Raw query string
  e.context = { ... }                    // Execution context
  e.postData = { ... }                   // Untuk POST requests
  ```

**`{` = Awal body fungsi**
- Semua code di dalam curly braces adalah bagian dari fungsi ini

---

### 3.2 Ambil Parameter dari URL (Line 232)

```javascript
  const npsn = e.parameter.npsn;
```

**Penjelasan Detail:**

**`const` = Keyword untuk deklarasi constant**
- Variable yang tidak bisa di-reassign (diubah nilainya)
- **Best practice:** Gunakan `const` untuk variable yang tidak berubah
- **Error yang dicegah:**
  ```javascript
  const npsn = "20205293";
  npsn = "12345678";  // ← ERROR: Assignment to constant variable
  ```

**`npsn` = Nama variable**
- Naming convention: lowercase, snake_case untuk multi-word
- **Kenapa npsn?**
  - Singkatan dari "Nomor Pokok Sekolah Nasional"
  - Unique identifier untuk setiap sekolah di Indonesia
  - Standard di Kementerian Pendidikan

**`=` = Assignment operator**
- Menyimpan value ke variable

**`e.parameter.npsn` = Akses nested property**

Mari kita breakdown step-by-step:

**Step 1: `e` = Event object**
```javascript
e = {
  parameter: { npsn: "20205293" },
  queryString: "npsn=20205293",
  context: { ... }
}
```

**Step 2: `e.parameter` = Akses property "parameter"**
```javascript
e.parameter = {
  npsn: "20205293"
}
```
- Type: Object
- Contains: All URL query parameters parsed to object
- **Contoh parsing:**
  - URL: `?npsn=20205293&mode=test&debug=true`
  - Hasil:
    ```javascript
    e.parameter = {
      npsn: "20205293",
      mode: "test",
      debug: "true"
    }
    ```

**Step 3: `e.parameter.npsn` = Akses property "npsn"**
```javascript
e.parameter.npsn = "20205293"
```
- Type: String (atau `undefined` jika tidak ada di URL)
- **Case sensitif:** URL `?NPSN=20205293` akan jadi `e.parameter.NPSN` (tidak sama!)

**Visualisasi Full Access Chain:**
```
URL: https://script.google.com/macros/s/XXX/exec?npsn=20205293
                                                          ↓
                                                    Google Apps Script
                                                          ↓
                                              Create Event Object e
                                                          ↓
                                              e.parameter = { npsn: "20205293" }
                                                          ↓
                                              e.parameter.npsn = "20205293"
                                                          ↓
                                              const npsn = "20205293"
```

**Edge Cases yang Ditangani:**

| URL | e.parameter.npsn | npsn variable |
|-----|------------------|---------------|
| `.../exec?npsn=20205293` | `"20205293"` | `"20205293"` ✅ |
| `.../exec?` | `undefined` | `undefined` ⚠️ |
| `.../exec?school=123` | `undefined` | `undefined` ⚠️ |
| `.../exec?npsn=` | `""` (empty string) | `""` ⚠️ |

---

### 3.3 Load HTML Template (Lines 234-235)

```javascript
  // Load Form.html menggunakan Template untuk passing variabel
  const template = HtmlService.createTemplateFromFile('Form');
```

**Line 234:** `// Load Form.html menggunakan Template untuk passing variabel`
- Comment dokumentasi
- Menjelaskan tujuan: Load Form.html sebagai template (bukan static HTML)
- Keunggulan template: Bisa pass variabel dari backend ke frontend

**Line 235:** `const template = HtmlService.createTemplateFromFile('Form');`

Mari kita breakdown:

**Step 1: `HtmlService` = Google Apps Script Built-in Service**
- **Apa itu?** Service untuk membuat dan manipulasi HTML output
- **Available methods:**
  - `createHtmlOutput()` - Static HTML (tidak bisa pass variabel)
  - `createTemplateFromFile()` - Template HTML (BISA pass variabel)
  - `createTemplate()` - Template dari string (bukan file)
- **Kenapa pakai service?**
  - Google Apps Script isolasi script di server
  - Perlu service untuk generate HTML output yang bisa di-serve

**Step 2: `.createTemplateFromFile()` = Method untuk load file HTML sebagai template**
- **Parameter:** `'Form'` = Nama file HTML (tanpa ekstensi .html)
  - File: `Form.html` di project
  - Bukan: `'Form.html'` (tanya akan error)
- **Return value:** `HtmlTemplate` object
  - Object ini punya method untuk passing variabel
  - Method: `.evaluate()`, `.code`, `.getCode()`

**Visualisasi Template Object:**
```javascript
template = {
  evaluate: function() { ... },  // Convert ke HtmlOutput
  code: function() { ... },      // Get raw HTML string
  // Internal properties:
  _templateFilename: "Form",
  _content: "<!DOCTYPE html>...",  // Content dari Form.html
  _scriptlet: function() { ... }  // Process scriptlets
}
```

**Step 3: `const template =` = Simpan template object**

**Kenapa Template, Bukan Static HTML?**

**Approach A: Static HTML (TIDAK COCOK)**
```javascript
function doGet(e) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <p>NPSN: ${e.parameter.npsn}</p>  ← ${} tidak akan bekerja!
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html);
}
```
- Problem: `${}` template literals tidak di-process
- Hasil: HTML akan muncul literally `${e.parameter.npsn}`

**Approach B: Template HTML (COCOK)**
```javascript
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Form');
  template.npsn = e.parameter.npsn;  // Pass variabel
  return template.evaluate();
}
```
- Di Form.html: `<p>NPSN: <?= npsn ?></p>` ← Scriptlet yang bekerja!
- Advantage: Template engine akan process scriptlets

---

### 3.4 Validasi NPSN - Part 1: Check Null/Undefined (Lines 237-240)

```javascript
  // Validasi NPSN - Pass ke frontend untuk handling
  if (!npsn) {
    Logger.log('WARNING: No NPSN in URL');
    template.npsn = null; // Frontend will show error
```

**Line 237:** `// Validasi NPSN - Pass ke frontend untuk handling`
- Comment dokumentasi
- Menjelaskan bahwa validasi dilakukan di backend, tapi error handling di frontend

**Line 238:** `if (!npsn) {`

Mari kita breakdown:

**`if` = Keyword conditional statement**
- Structure: `if (condition) { code_if_true }`
- Condition harus truthy untuk execute block

**`!npsn` = Negation (NOT) operator**
- Convert value ke boolean, then flip it
- **Truthiness table:**
  | Value | !Value |
  |-------|--------|
  | `"20205293"` | `false` |
  | `""` (empty) | `true` |
  | `undefined` | `true` |
  | `null` | `true` |
  | `0` | `true` |
  | `false` | `true` |

- **Logic:** Jika npsn falsy (kosong/undefined), maka execute block

**Scenarios yang masuk ke block:**
1. URL tanpa parameter: `.../exec`
   - `e.parameter.npsn` = `undefined`
   - `!undefined` = `true` ✅ Masuk block
2. URL parameter kosong: `.../exec?npsn=`
   - `e.parameter.npsn` = `""` (empty string)
   - `!""` = `true` ✅ Masuk block

**Scenarios yang TIDAK masuk ke block:**
1. URL dengan parameter valid: `.../exec?npsn=20205293`
   - `e.parameter.npsn` = `"20205293"`
   - `!"20205293"` = `false` ❌ Skip block

**Line 239:** `Logger.log('WARNING: No NPSN in URL');`
- **`Logger.log()` = Google Apps Script logging function**
- **Purpose:** Write message to execution log
- **Where to view:**
  - Apps Script Dashboard → Executions → Pilih execution → View Logs
- **Format:** `WARNING: No NPSN in URL`
  - Prefix `WARNING:` untuk kategorisasi log level
  - Mudah dicari dengan filter "WARNING"
  
**Kenapa log ini penting?**
- Debugging: Tahu kapan user tidak pass NPSN
- Monitoring: Track invalid URL access
- Audit: Historical record of errors

**Line 240:** `template.npsn = null; // Frontend will show error`

Mari breakdown:

**`template.npsn` = Assignment property ke template object**
- `template` = HtmlTemplate object dari line 235
- `.npsn` = Akses property "npsn" (create new property)
- `= null` = Assign value `null`
- **Hasil:** Template object sekarang punya property `npsn` dengan value `null`

**Visualisasi:**
```javascript
// Sebelum line 240
template = {
  evaluate: function() { ... },
  code: function() { ... },
  _templateFilename: "Form"
  // Tidak ada property .npsn
}

// Sesudah line 240
template = {
  evaluate: function() { ... },
  code: function() { ... },
  _templateFilename: "Form",
  npsn: null  ← Property baru ditambahkan!
}
```

**Kenapa pass null ke frontend?**
- Frontend akan check: `if (npsn === null) showNotFoundError()`
- Separasi of concern: Backend validate, frontend show UI
- Flexible error message handling (bisa diubah di frontend tanpa redeploy backend)

**Comment:** `// Frontend will show error`
- Menjelaskan bahwa error handling akan dilakukan di Form.html
- Frontend akan membaca `template.npsn` via scriptlet

---

### 3.5 Validasi NPSN - Part 2: Check Terdaftar (Lines 241-243)

```javascript
  } else if (!SCHOOL_REGISTRY[npsn]) {
    Logger.log('WARNING: NPSN not registered: ' + npsn);
    template.npsn = null; // Frontend will show error
```

**Line 241:** `} else if (!SCHOOL_REGISTRY[npsn]) {`

Mari breakdown:

**`}` = Tutup if block dari line 238
- Menutup scope untuk condition `if (!npsn)`

**`else if` = Keyword untuk chaining conditional**
- Structure: `if (condition1) { ... } else if (condition2) { ... }`
- Logic:
  - If condition1 true → execute block, skip else if
  - If condition1 false → check condition2
  - If condition2 true → execute block
  - If both false → skip both blocks

**`!SCHOOL_REGISTRY[npsn]` = Complex expression breakdown:**

**Step 1: `SCHOOL_REGISTRY` = Global constant object (Lines 14-25)**
```javascript
const SCHOOL_REGISTRY = {
  20205293: '1-elR-0kxjBwsM4TatxDY-XIJBuy69hUY6zM3hMIlFwk',
  20206262: '1hVDa2Cg9dD87bqe5D195ydqDuPC02HXCLVMOfSjPtRI',
  // ... more entries
};
```
- Type: Object
- Keys: NPSN numbers
- Values: Spreadsheet IDs

**Step 2: `SCHOOL_REGISTRY[npsn]` = Bracket notation property access**
- `npsn` = Variable value (contoh: `"20205293"`)
- `[npsn]` = Access property by dynamic key
- Return: Spreadsheet ID string atau `undefined` jika key tidak ada

**Visualisasi lookup:**
```javascript
// Scenario 1: NPSN valid
npsn = "20205293";
SCHOOL_REGISTRY["20205293"] = '1-elR-0kxjBwsM4TatxDY...';  ✅ Return string

// Scenario 2: NPSN tidak terdaftar
npsn = "99999999";
SCHOOL_REGISTRY["99999999"] = undefined;  ⚠️ Return undefined

// Scenario 3: NPSN salah format
npsn = "abc123";
SCHOOL_REGISTRY["abc123"] = undefined;  ⚠️ Return undefined
```

**Step 3: `!SCHOOL_REGISTRY[npsn]` = Negation**
- Convert result ke boolean, then flip
- **Truthiness:**
  | Result | !Result |
  |--------|---------|
  | `'1-elR...'` (string) | `false` |
  | `undefined` | `true` |
  | `null` | `true` |

**Logic keseluruhan:**
```
IF (npsn null/undefined) → Block 1
ELSE IF (npsn NOT in SCHOOL_REGISTRY) → Block 2
ELSE → NPSN valid → Block 3 (default action)
```

**Line 242:** `Logger.log('WARNING: NPSN not registered: ' + npsn);`

Breakdown:

**`'WARNING: NPSN not registered: ' + npsn` = String concatenation**
- `'WARNING: NPSN not registered: '` = String literal
- `+` = String concatenation operator
- `npsn` = Variable value
- **Example:** 
  ```javascript
  npsn = "99999999";
  Log output: "WARNING: NPSN not registered: 99999999"
  ```

**Kenapa penting log ini?**
- Debugging: Tahu NPSN mana yang gagal
- Security: Detect invalid NPSN access attempts
- Monitoring: Track sekolah yang mencoba akses tapi belum terdaftar

**Line 243:** `template.npsn = null; // Frontend will show error`

Sama seperti line 240:
- Set template property `npsn` ke `null`
- Frontend akan show error: "Sekolah tidak ditemukan"

---

### 3.6 NPSN Valid - Pass ke Template (Lines 244-246)

```javascript
  } else {
    Logger.log('✅ NPSN Valid: ' + npsn);
    template.npsn = npsn; // Valid NPSN
```

**Line 244:** `} else {`

Mari breakdown:

**`}` = Tutup else if block dari line 241
- Menutup scope untuk condition `else if (!SCHOOL_REGISTRY[npsn])`

**`else` = Final fallback block
- Structure: `if (c1) { ... } else if (c2) { ... } else { ... }`
- Logic:
  - If c1 true → execute, skip rest
  - If c1 false AND c2 true → execute, skip else
  - If c1 false AND c2 false → execute else block

**Conditions untuk sampai ke sini:**
1. `!npsn` = FALSE → npsn is truthy (ada value)
2. `!SCHOOL_REGISTRY[npsn]` = FALSE → npsn TERDAFTAR

**Visualisasi flow:**
```
npsn = "20205293"

if (!"20205293") → false (skip)
else if (!SCHOOL_REGISTRY["20205293"]) → false (skip)
else → TRUE (execute this block) ✅
```

**Line 245:** `Logger.log('✅ NPSN Valid: ' + npsn);`

Breakdown:

**`'✅ NPSN Valid: '` = String literal dengan emoji checkmark
- Emoji untuk visual differentiation di logs
- ✅ = Success/Valid
- ⚠️ = Warning

**`+ npsn` = Concatenate NPSN value**

**Example output:**
```
Logs:
  [timestamp] ✅ NPSN Valid: 20205293
```

**Line 246:** `template.npsn = npsn; // Valid NPSN`

Breakdown:

**`template.npsn` = Akses property npsn**
- Create property if not exists
- Overwrite if exists

**`= npsn` = Assign valid NPSN value**

**Visualisasi:**
```javascript
// Sebelum
template = { evaluate: ..., code: ..., _templateFilename: "Form" }

// Sesudah
template = { 
  evaluate: ..., 
  code: ..., 
  _templateFilename: "Form",
  npsn: "20205293"  ← Valid NPSN!
}
```

**Comment:** `// Valid NPSN`
- Menandakan bahwa ini adalah success path

---

### 3.7 Close Validation Blocks (Line 247)

```javascript
  }
```

**Penjelasan:**
- **`}` = Tutup else block dari line 244**
- Menutup seluruh chain conditional:
  ```
  if (!npsn) {           // Line 238
    ...
  } else if (!SCHOOL_REGISTRY[npsn]) {  // Line 241
    ...
  } else {               // Line 244
    ...
  }                      // ← Line 247 (this line)
  ```
- Scope validation block berakhir di sini

---

### 3.8 Return Statement - Chain Methods (Lines 248-252)

```javascript
  return template
    .evaluate()
    .setTitle('SIKADIR v.2.0')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
```

Ini adalah **method chaining pattern**. Mari kita breakdown satu per satu:

---

### 3.8.1 Return Statement (Line 248)

```javascript
  return template
```

**Penjelasan:**

**`return` = Keyword untuk keluar dari fungsi dan kembalikan value**
- Menghentikan eksekusi fungsi di sini
- Tidak ada code setelah ini yang dieksekusi (kecuali di try-catch)
- Value yang di-return akan jadi response HTTP ke browser

**`template` = Value yang di-return**
- Type: `HtmlTemplate` object
- Ini TIDAK final HTML, tapi object template
- Perlu di-evaluate sebelum jadi HTML

---

### 3.8.2 Method Chaining - .evaluate() (Line 249)

```javascript
    .evaluate()
```

**Penjelasan:**

**`.` = Dot notation untuk method chaining**
- Syntax: `object.method1().method2().method3()`
- Equivalent to:
  ```javascript
  const step1 = template.evaluate();
  const step2 = step1.setTitle(...);
  return step2;
  ```
- **Keuntungan:** More readable, less variable assignments

**`.evaluate()` = Method untuk convert template ke HtmlOutput**

Mari kita breakdown internal process:

**Step 1: Template Engine Processing**
```
Form.html content:
  <!DOCTYPE html>
  <html>
    <body>
      <h1>SIKADIR</h1>
      <div id="npsnDisplay">
        <?= npsn ?>
      </div>
    </body>
  </html>
```

**Step 2: Scriptlet Processing**
```javascript
// Template engine akan process scriptlets:
<?= npsn ?> → "20205293" (ambil dari template.npsn)
```

**Step 3: Generate Final HTML**
```javascript
// Hasil setelah evaluate():
<!DOCTYPE html>
<html>
  <body>
    <h1>SIKADIR</h1>
    <div id="npsnDisplay">
      20205293  ← Scriptlet diganti dengan actual value
    </div>
  </body>
</html>
```

**Step 4: Create HtmlOutput Object**
```javascript
// Method evaluate() return HtmlOutput object:
{
  setContent: function() { ... },
  getTitle: function() { ... },
  setFaviconUrl: function() { ... },
  addMetaTag: function() { ... },
  setXFrameOptionsMode: function() { ... },
  // Internal:
  _content: "<!DOCTYPE html>...",  // Final HTML string
  _blob: Blob { ... }
}
```

**Return type:** `HtmlOutput` object
- Ini adalah object yang bisa langsung di-return sebagai HTTP response
- Google Apps Script otomatis konversi ke proper HTTP response

**Scriptlet Syntax yang tersedia:**

| Syntax | Purpose | Example |
|--------|---------|---------|
| `<?= expression ?>` | Print expression value | `<?= npsn ?>` → "20205293" |
| `<? var name = 'test'; ?>` | Declare variable | `<? var greeting = 'Hello'; ?>` |
| `<? if (condition) { ?>` | Conditional logic | `<? if (npsn !== null) { ?>` |

---

### 3.8.3 Method Chaining - .setTitle() (Line 250)

```javascript
    .setTitle('SIKADIR v.2.0')
```

**Penjelasan:**

**`.setTitle()` = Method untuk set title HTML output**
- Parameter: String title
- Affects: `<title>` tag di HTML

**Internal process:**
```javascript
// Before setTitle():
<!DOCTYPE html>
<html>
  <head>
    <!-- No <title> tag -->
  </head>
  ...

// After setTitle('SIKADIR v.2.0'):
<!DOCTYPE html>
<html>
  <head>
    <title>SIKADIR v.2.0</title>  ← Ditambahkan otomatis
  </head>
  ...
```

**Where it appears:**
- Browser tab title
- Bookmark name
- Search engine snippet

---

### 3.8.4 Method Chaining - .addMetaTag() (Line 251)

```javascript
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
```

**Penjelasan:**

**`.addMetaTag(name, content)` = Method untuk add meta tag HTML**
- **Parameter 1:** `name` = Meta tag name
- **Parameter 2:** `content` = Meta tag content
- **Return:** HtmlOutput object (for chaining)

**Internal process:**
```javascript
// Before addMetaTag():
<!DOCTYPE html>
<html>
  <head>
    <!-- No viewport meta tag -->
  </head>
  ...

// After addMetaTag('viewport', 'width=device-width, initial-scale=1'):
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  ...
```

**Kenapa viewport meta tag penting?**

**Without viewport meta tag:**
- Mobile browser akan render seperti desktop (zoom out)
- Text kecil, difficult to read
- User harus pinch-zoom manual

**With viewport meta tag:**
- Browser render sesuai device width
- Responsive design works
- Optimal mobile experience

**Viewport parameters breakdown:**
- `width=device-width` = Match viewport width ke device width
- `initial-scale=1` = Start at 100% zoom level (no auto-zoom)
- **Other common parameters:**
  - `maximum-scale=1` = Prevent user zoom
  - `user-scalable=no` = Completely disable zoom

---

### 3.8.5 Method Chaining - .setXFrameOptionsMode() (Line 252)

```javascript
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```

**Penjelasan:**

**`.setXFrameOptionsMode(mode)` = Method untuk set X-Frame-Options HTTP header**
- **Purpose:** Control embedding via iframe
- **Parameter:** Enum value from `HtmlService.XFrameOptionsMode`
- **Available options:**

| Option | Description | HTTP Header |
|--------|-------------|-------------|
| `ALLOWALL` | Allow embedding anywhere | `X-Frame-Options: ALLOWALL` |
| `ALLOWFROM` | Only from specific domain | `X-Frame-Options: ALLOW-FROM domain.com` |
| `DEFAULT` | Same-origin only (default) | `X-Frame-Options: DENY` |

**Internal process:**
```
HTTP Response Headers:
  Content-Type: text/html
  X-Frame-Options: ALLOWALL
  Content-Security-Policy: frame-ancestors *;
```

**Kenapa set ALLOWALL?**

**Use Case 1: Embed di Website Sekolah**
```html
<iframe src="https://script.google.com/macros/s/XXX/exec?npsn=20205293" width="100%" height="600"></iframe>
```
- With ALLOWALL → Works ✅
- With DENY → Blocked ❌

**Use Case 2: Embed di Parent Company Dashboard**
```html
<iframe src="https://script.google.com/macros/s/XXX/exec?npsn=20205293"></iframe>
```
- Parent company bisa embed absensi app di dashboard mereka

**Security Consideration:**
- ALLOWALL bisa digunakan oleh malicious website untuk phishing
- Tradeoff: Usability vs Security
- Dalam case ini, usability lebih penting (embedded app)

---

### 3.9 Close Function (Line 253)

```javascript
}
```

**Penjelasan:**
- **`}` = Tutup body fungsi doGet**
- Menutup seluruh fungsi

**Complete structure:**
```javascript
function doGet(e) {         // Line 231 - Open function
  const npsn = e.parameter.npsn;  // Line 232 - Get parameter
  const template = HtmlService.createTemplateFromFile('Form');  // Line 235 - Load template
  if (!npsn) {            // Line 238 - Check null
    Logger.log('...');      // Line 239 - Log
    template.npsn = null;  // Line 240 - Set null
  } else if (!SCHOOL_REGISTRY[npsn]) {  // Line 241 - Check registry
    Logger.log('...');      // Line 242 - Log
    template.npsn = null;  // Line 243 - Set null
  } else {                 // Line 244 - Valid NPSN
    Logger.log('...');      // Line 245 - Log
    template.npsn = npsn;  // Line 246 - Set NPSN
  }                        // Line 247 - Close if-else
  return template          // Line 248 - Return
    .evaluate()            // Line 249 - Chain evaluate
    .setTitle(...)         // Line 250 - Chain setTitle
    .addMetaTag(...)      // Line 251 - Chain addMetaTag
    .setXFrameOptionsMode(...);  // Line 252 - Chain setXFrameOptionsMode
}                         // Line 253 - Close function
```

---

## 🎓 **4. RINGKASAN KONSEP YANG DIPELAJARI**

### 4.1 JavaScript Concepts

| Concept | Code Example | Penjelasan |
|---------|--------------|-------------|
| **Function Declaration** | `function doGet(e) { }` | Define named function |
| **Parameter Destructuring** | `e.parameter.npsn` | Access nested property |
| **Truthiness** | `if (!npsn)` | Boolean conversion |
| **Conditional Chaining** | `if-else if-else` | Multiple conditions |
| **Const Assignment** | `const npsn = value` | Immutable variable |
| **Object Property Access** | `SCHOOL_REGISTRY[key]` | Dynamic key lookup |
| **Method Chaining** | `obj.m1().m2().m3()` | Sequential calls on result |
| **Template Literals** | `'WARNING: ' + npsn` | String concatenation |

### 4.2 Google Apps Script Concepts

| Concept | Code Example | Penjelasan |
|---------|--------------|-------------|
| **Predefined Function** | `doGet(e)` | Entry point for GET requests |
| **Event Object** | `e.parameter` | Request information |
| **HtmlService** | `HtmlService.createTemplateFromFile()` | HTML rendering service |
| **Template System** | `template.evaluate()` | Scriptlet processing |
| **Method Chaining** | `.setTitle().addMetaTag()` | Fluent API pattern |
| **Logger** | `Logger.log()` | Debug logging |
| **X-Frame-Options** | `HtmlService.XFrameOptionsMode.ALLOWALL` | Iframe embedding control |

### 4.3 Web App Concepts

| Concept | Code Example | Penjelasan |
|---------|--------------|-------------|
| **HTTP GET Request** | Browser accessing URL | Standard web request |
| **URL Parameters** | `?npsn=20205293` | Query string parameters |
| **Query String Parsing** | `e.parameter` | Auto-parse by GAS |
| **Meta Tags** | `addMetaTag('viewport', ...)` | HTML head metadata |
| **HTML Title** | `.setTitle('Title')` | Browser tab title |
| **HTTP Headers** | `setXFrameOptionsMode()` | Security headers |
| **Template Engine** | Scriptlets `<?= ?>` | Server-side rendering |

---

## 📊 **5. VISUALISASI DATA FLOW LENGKAP**

```
┌─────────────────────────────────────────────────────────────┐
│              USER BROWSER REQUEST                         │
│  URL: https://script.google.com/macros/s/XXX/exec        │
│         ?npsn=20205293                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         GOOGLE APPS SCRIPT ROUTING                        │
│  ↓                                                      │
│  Detect: HTTP GET request                                │
│  ↓                                                      │
│  Call: doGet(e) function                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            CREATE EVENT OBJECT e                          │
│  e = {                                                  │
│    parameter: { npsn: "20205293" },                   │
│    queryString: "npsn=20205293",                       │
│    context: { ... }                                     │
│  }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          EXTRACT NPSN PARAMETER                         │
│  const npsn = e.parameter.npsn;                        │
│  → npsn = "20205293"                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          LOAD HTML TEMPLATE                              │
│  const template = HtmlService.createTemplateFromFile('Form')│
│  → template = HtmlTemplate object                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐       ┌────────────────────┐
│ CHECK: !npsn?    │       │ Lookup in          │
│                  │       │ SCHOOL_REGISTRY?    │
│   "20205293"     │       │                    │
│     (falsy?)      │       │ SCHOOL_REGISTRY[    │
│       NO          │       │  "20205293"]       │
│       ↓           │       │   ↓                │
│   SKIP           │       │ "1-elR-0kxj..."    │
│                  │       │   (truthy?)        │
│                  │       │     NO             │
│                  │       │     ↓              │
│                  │       │   SKIP            │
└──────────────────┴───────┴────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           ASSIGN VALID NPSN TO TEMPLATE                 │
│  template.npsn = "20205293";                         │
│  → template = { ..., npsn: "20205293" }              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            EVALUATE TEMPLATE                             │
│  template.evaluate()                                    │
│  ↓                                                      │
│  Process Form.html scriptlets:                          │
│    <?= npsn ?> → "20205293"                           │
│  ↓                                                      │
│  Generate HtmlOutput object                              │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ setTitle()  │ │addMetaTag() │ │setXFrame()  │
│ → Add <title>│ │ → Add <meta>│ │ → Set header│
│             │ │             │ │             │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            RETURN TO BROWSER                            │
│  return HtmlOutput object                              │
│  ↓                                                      │
│  Google Apps Script converts to HTTP Response:            │
│  ↓                                                      │
│  HTTP/1.1 200 OK                                      │
│  Content-Type: text/html; charset=utf-8                 │
│  X-Frame-Options: ALLOWALL                              │
│  ↓                                                      │
│  Body: <!DOCTYPE html>...<title>SIKADIR</title>...   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDER IN BROWSER                            │
│  Browser displays HTML page                             │
│  → User sees SIKADIR interface                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 **6. EDGE CASES DAN SCENARIO**

### 6.1 Scenario 1: NPSN Null (Missing Parameter)

**URL:** `https://script.google.com/macros/s/XXX/exec`

**Execution:**
```javascript
e.parameter = {}  // Empty object (no parameters)
npsn = e.parameter.npsn = undefined

if (!undefined) → true
  Execute block:
    Logger.log('WARNING: No NPSN in URL')
    template.npsn = null

return template.evaluate()...  // template.npsn = null
```

**Frontend Handling (Form.html):**
```javascript
const npsn = '<?= npsn ?>';  // Akan jadi "null" (string)

if (npsn === 'null' || npsn === null) {
  showError('NPSN tidak ditemukan di URL. Pastikan URL berisi parameter ?npsn=...');
}
```

---

### 6.2 Scenario 2: NPSN Not Registered

**URL:** `https://script.google.com/macros/s/XXX/exec?npsn=99999999`

**Execution:**
```javascript
npsn = "99999999"

if (!"99999999") → false (skip)
else if (!SCHOOL_REGISTRY["99999999"])
  → !undefined → true
  Execute block:
    Logger.log('WARNING: NPSN not registered: 99999999')
    template.npsn = null

return template.evaluate()...  // template.npsn = null
```

**Frontend Handling:**
```javascript
const npsn = '<?= npsn ?>';  // "null"

if (npsn === 'null') {
  showError('Sekolah dengan NPSN ini tidak terdaftar.');
}
```

---

### 6.3 Scenario 3: Valid NPSN (Happy Path)

**URL:** `https://script.google.com/macros/s/XXX/exec?npsn=20205293`

**Execution:**
```javascript
npsn = "20205293"

if (!"20205293") → false (skip)
else if (!SCHOOL_REGISTRY["20205293"])
  → !"1-elR-..." → false (skip)
else
  Execute block:
    Logger.log('✅ NPSN Valid: 20205293')
    template.npsn = "20205293"

return template.evaluate()...  // template.npsn = "20205293"
```

**Frontend Handling:**
```javascript
const npsn = '<?= npsn ?>';  // "20205293"

if (npsn !== null) {
  loadSchoolData(npsn);  // Load data sekolah
}
```

---

### 6.4 Scenario 4: Case Sensitivity in URL

**URL:** `https://script.google.com/macros/s/XXX/exec?NPSN=20205293`

**Execution:**
```javascript
e.parameter = { NPSN: "20205293" }  // Note: uppercase NPSN
npsn = e.parameter.npsn = undefined  // Case-sensitive: npsn != NPSN

if (!undefined) → true
  Execute block:
    Logger.log('WARNING: No NPSN in URL')
    template.npsn = null
```

**Problem:**
- User salah ketik parameter name
- URL harus case-sensitive: `?npsn=...`

**Solution:**
- Documentasi harus jelas: `?npsn=...`
- Frontend bisa show helpful error message

---

### 6.5 Scenario 6: URL Encoding

**URL:** `https://script.google.com/macros/s/XXX/exec?npsn=20%205293`

**Note:** Space di-encode jadi `%20`

**Execution:**
```javascript
e.parameter = { npsn: "20 205293" }  // Google auto-decode
npsn = "20 205293"

if (!"20 205293") → false
else if (!SCHOOL_REGISTRY["20 205293"])
  → !undefined → true
  Execute block:
    Logger.log('WARNING: NPSN not registered: 20 205293')
    template.npsn = null
```

**Problem:**
- Space di URL menyebabkan NPSN tidak match

---

## 🔧 **7. PERTIMBANGAN DAN TRADE-OFFS**

### 7.1 Validation Location: Backend vs Frontend

**Backend Validation (Current Approach):**
```javascript
// doGet()
if (!npsn || !SCHOOL_REGISTRY[npsn]) {
  template.npsn = null;
}
```

**Pros:**
- Early validation (frontend tidak perlu request API)
- Server-side check (cannot be bypassed)
- Secure (data validation di trusted environment)

**Cons:**
- Error message static di backend
- Perlu redeploy untuk ubah error handling

**Alternative: Frontend Validation Only**
```javascript
// Form.html
const npsn = getURLParameter('npsn');
fetch('/api/validate-npsn?npsn=' + npsn)
  .then(res => res.json())
  .then(data => { if (!data.valid) showError(...); });
```

**Pros:**
- Dynamic error messages
- Async validation (loading states)

**Cons:**
- Extra API call (slower)
- More complex frontend code

**Decision:** Backend validation more appropriate for this use case

---

### 7.2 X-Frame-Options: Security vs Usability

**Option A: ALLOWALL (Current)**
```javascript
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```
- **Pros:** Can embed anywhere (school website, dashboard, etc.)
- **Cons:** Phishing vulnerability (malicious site can embed)

**Option B: ALLOWFROM**
```javascript
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWFROM)
// Need to specify domain
```
- **Pros:** Restricted embedding
- **Cons:** School domains vary (hard to maintain list)

**Option C: DEFAULT (DENY)**
```javascript
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
```
- **Pros:** Most secure
- **Cons:** Cannot embed at all (must open in new tab)

**Decision:** ALLOWALL chosen for embedding flexibility (assumes trusted environment)

---

## 🎯 **8. KESIMPULAN**

### 8.1 Apa yang Kita Pelajari dari doGet()?

1. **Entry Point Pattern:**
   - Predefined function names (`doGet`, `doPost`)
   - Event object untuk request data
   - Return value untuk HTTP response

2. **Parameter Handling:**
   - URL query parameters → `e.parameter`
   - Case-sensitive access
   - Null checking essential

3. **Template System:**
   - Static HTML vs Template HTML
   - Scriptlet syntax `<?= ?>`
   - Pass variables from backend to frontend

4. **Validation Pattern:**
   - Server-side validation (secure)
   - Graceful degradation (null handling)
   - Logging for debugging

5. **Response Configuration:**
   - HTML output configuration
   - Meta tags for mobile
   - Security headers (X-Frame-Options)

---

--------------------------------------------------------------------------------
---

# 📚 **DOKUMENTASI RESMI: `doGet(e)` dan `doPost(e)`**

Sebagai landasan, mari kita pahami dokumentasi resmi mengenai `doGet(e)` dan `doPost(e)` dari Google. Ini adalah dua fungsi pemicu (trigger) fundamental untuk semua Aplikasi Web di Google Apps Script.

**Sumber Referensi Resmi:**
*   [Google Apps Script - Web Apps](https://developers.google.com/apps-script/guides/web)
*   [Google Apps Script - HTML Service](https://developers.google.com/apps-script/reference/html)
*   [Google Apps Script - Content Service](https://developers.google.com/apps-script/reference/content)

---

## 🎯 **1. Konsep Dasar: Permintaan & Respons**

Aplikasi Web Anda bekerja berdasarkan model Permintaan-Respons (Request-Response) melalui protokol HTTP.

*   **Permintaan (Request):** Ketika seseorang (atau program lain) mengakses URL Aplikasi Web Anda.
*   **Respons (Response):** Apa yang dikirim kembali oleh skrip Anda (halaman HTML, data JSON, dll.).

Google Apps Script secara otomatis merutekan dua jenis permintaan utama ke dua fungsi spesifik:

1.  **Permintaan `GET`** → `function doGet(e)`
2.  **Permintaan `POST`** → `function doPost(e)`

---

## `doGet(e)`: Menampilkan Konten

Fungsi `doGet(e)` dieksekusi setiap kali ada permintaan HTTP GET ke URL aplikasi Anda. Ini adalah skenario paling umum.

**Kapan `doGet(e)` Digunakan?**
*   Saat pengguna **mengunjungi URL secara langsung** di browser.
*   Saat pengguna mengklik tautan (link) yang mengarah ke aplikasi Anda.
*   Saat mengambil data dari aplikasi Anda tanpa mengirim data sensitif.

### **Struktur dan Penjelasan `doGet(e)`**

Mari kita lihat contoh kanonis:

```javascript
// File: Code.gs

function doGet(e) {
  // 1. Log parameter event untuk debugging
  Logger.log('Menerima permintaan GET dengan parameter: ' + JSON.stringify(e));

  // 2. Mendapatkan parameter 'page' dari URL
  // Contoh URL: .../exec?page=home
  var page = e.parameter.page;

  if (page === 'home') {
    // 3. Jika parameter 'page' adalah 'home', tampilkan halaman Home.html
    return HtmlService.createHtmlOutputFromFile('Home');
  } else {
    // 4. Jika tidak, tampilkan halaman default (misalnya Index.html)
    return HtmlService.createHtmlOutputFromFile('Index');
  }
}
```

**Penjelasan Baris per Baris:**

1.  **`Logger.log(...)`**: Mencatat objek event `e` yang masuk. Ini adalah praktik debugging yang sangat baik untuk melihat data apa saja yang dikirim oleh klien (browser). `e` akan berisi `parameter`, `queryString`, dll.
2.  **`var page = e.parameter.page;`**: Mengambil nilai dari parameter URL bernama `page`. Jika URL-nya adalah `...?npsn=123&page=home`, maka `e.parameter.page` akan berisi string `"home"`. `e.parameter` berisi semua parameter sebagai objek.
3.  **`return HtmlService.createHtmlOutputFromFile('Home');`**: Jika parameter `page` ada dan nilainya `'home'`, fungsi ini akan membaca file `Home.html` dari proyek Anda, mengubahnya menjadi objek `HtmlOutput`, dan mengirimkannya ke browser untuk ditampilkan.
4.  **`return HtmlService.createHtmlOutputFromFile('Index');`**: Ini adalah _fallback_ atau kasus default. Jika parameter `page` tidak ada atau nilainya bukan `'home'`, halaman `Index.html` yang akan ditampilkan.

---

## `doPost(e)`: Menerima dan Memproses Data

Fungsi `doPost(e)` dieksekusi setiap kali ada permintaan HTTP POST ke URL aplikasi Anda.

**Kapan `doPost(e)` Digunakan?**
*   Saat pengguna **mengirimkan (submit) sebuah form HTML** dari dalam aplikasi web Anda.
*   Saat aplikasi eksternal (misalnya aplikasi mobile, server lain) mengirim data ke aplikasi web Anda.
*   Untuk operasi yang mengubah data di sisi server (misalnya menambah, mengubah, atau menghapus data di Google Sheet).

### **Struktur dan Penjelasan `doPost(e)`**

Mari kita lihat contoh di mana kita menerima data dari form dan menyimpannya ke Google Sheet.

**File: `Form.html`**
```html
<!DOCTYPE html>
<html>
  <body>
    <form>
      <input type="text" name="nama" placeholder="Masukkan Nama Anda">
      <input type="email" name="email" placeholder="Masukkan Email Anda">
      <button type="submit">Kirim</button>
    </form>
    <div id="status"></div>

    <script>
      document.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah form reload halaman
        
        // Mengambil data dari form
        var formData = new FormData(this);
        var formObject = {};
        formData.forEach((value, key) => formObject[key] = value);

        // Menampilkan status loading
        document.getElementById('status').innerText = 'Mengirim...';

        // Mengirim data ke backend (doPost) menggunakan google.script.run
        google.script.run
          .withSuccessHandler(function(response) {
            // Ini akan berjalan jika doPost berhasil
            document.getElementById('status').innerText = response;
            document.querySelector('form').reset(); // Reset form
          })
          .withFailureHandler(function(error) {
            // Ini akan berjalan jika doPost gagal
            document.getElementById('status').innerText = 'Error: ' + error.message;
          })
          .processFormData(formObject);
      });
    </script>
  </body>
</html>
```

**File: `Code.gs`**
```javascript
// File: Code.gs

// Pastikan ada doGet untuk menampilkan form-nya terlebih dahulu
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Form');
}


// Fungsi ini akan dipanggil oleh google.script.run dari frontend
function processFormData(formObject) {
  try {
    // 1. Buka Spreadsheet dan Sheet target
    var sheet = SpreadsheetApp.openById('ID_SPREADSHEET_ANDA').getSheetByName('Data Pendaftar');

    // 2. Ambil data dari object form
    var nama = formObject.nama;
    var email = formObject.email;
    var timestamp = new Date();

    // 3. Tambahkan baris baru ke dalam sheet
    sheet.appendRow([timestamp, nama, email]);

    // 4. Log keberhasilan
    Logger.log('Data baru ditambahkan: ' + nama + ' (' + email + ')');

    // 5. Kirim kembali pesan sukses ke frontend
    return "Terima kasih, " + nama + "! Data Anda telah berhasil dikirim.";

  } catch (error) {
    // 6. Jika terjadi error, catat dan lempar kembali ke frontend
    Logger.log('Error di processFormData: ' + error.toString());
    throw new Error('Gagal menyimpan data ke spreadsheet. Silakan coba lagi.');
  }
}
```

**Penjelasan `processFormData` (yang dipanggil `doPost`)**

Fungsi `processFormData` di atas secara efektif bertindak sebagai `doPost` kita, tetapi dipanggil secara asinkron melalui `google.script.run`, yang merupakan metode modern dan lebih disarankan.

1.  **`var sheet = ...`**: Membuka koneksi ke Google Sheet spesifik tempat data akan disimpan. Anda harus mengganti `ID_SPREADSHEET_ANDA` dengan ID asli.
2.  **`var nama = formObject.nama;`**: Mengekstrak nilai `nama` dari objek yang dikirim dari frontend. Objek ini merepresentasikan data dari form.
3.  **`sheet.appendRow(...)`**: Ini adalah perintah inti untuk menambahkan baris baru (`Array`) di akhir sheet. Urutan elemen dalam array harus sesuai dengan urutan kolom di Sheet Anda.
4.  **`Logger.log(...)`**: Mencatat log keberhasilan di server, berguna untuk audit dan pemantauan.
5.  **`return "..."`**: Mengirimkan string kembali ke frontend. String ini akan diterima oleh `withSuccessHandler` di JavaScript dan ditampilkan kepada pengguna.
6.  **`catch (error)` dan `throw new Error(...)`**: Ini adalah blok penanganan kesalahan. Jika `try` block gagal (misalnya, ID spreadsheet salah, tidak ada izin), error akan ditangkap, dicatat di log, dan sebuah `Error` baru akan "dilempar" kembali ke frontend. `withFailureHandler` di JavaScript akan menangkap error ini.

### **Metode `doPost(e)` Tradisional**

Jika Anda tidak menggunakan `google.script.run`, `doPost(e)` akan menerima data POST secara langsung.

```javascript
// File: Code.gs

function doPost(e) {
  // 1. Data form ada di e.parameter
  var nama = e.parameter.nama;
  var email = e.parameter.email;

  // 2. Logika penyimpanan data (sama seperti di atas)
  var sheet = SpreadsheetApp.openById('ID_SPREADSHEET_ANDA').getSheetByName('Data Pendaftar');
  sheet.appendRow([new Date(), nama, email]);

  // 3. Mengembalikan respons.
  // Biasanya berupa JSON atau teks sederhana untuk API, atau halaman HTML "Terima Kasih".
  return ContentService
         .createTextOutput(JSON.stringify({status: 'sukses', nama: nama}))
         .setMimeType(ContentService.MimeType.JSON);
}
```

**Penjelasan Baris per Baris:**

1.  **`var nama = e.parameter.nama;`**: Untuk form yang dikirim dengan cara standar (bukan `fetch` dengan JSON), data form tersedia di `e.parameter`, sama seperti di `doGet`.
2.  **Logika Penyimpanan**: Sama persis dengan contoh `google.script.run`.
3.  **`return ContentService...`**: Saat `doPost` dipanggil sebagai endpoint API, seringkali respons yang paling berguna adalah data (seperti JSON), bukan halaman HTML.
    *   `ContentService.createTextOutput()`: Membuat output berbasis teks.
    *   `JSON.stringify(...)`: Mengubah objek JavaScript menjadi string JSON.
    *   `.setMimeType(ContentService.MimeType.JSON)`: Memberi tahu browser atau klien bahwa data yang dikirim adalah format JSON.

---

## **Method yang Sering Digunakan di Dunia Nyata**

### 1. `HtmlService` (Untuk `doGet` dan `doPost`)
*   **`.createTemplateFromFile(filename)`**: Paling sering digunakan. Memungkinkan Anda memisahkan HTML dari logika dan memasukkan data dari skrip ke dalam HTML menggunakan *scriptlets* (`<?= ... ?>`).
*   **`.evaluate()`**: Mengevaluasi template (memproses semua *scriptlets*) dan mengembalikannya sebagai objek `HtmlOutput`.
*   **`.setTitle(title)`**: Mengatur judul tab browser.
*   **`.addMetaTag(name, content)`**: Sangat penting untuk _responsive design_ (`name='viewport'`).

### 2. `ContentService` (Untuk `doPost` atau `doGet` API)
*   **`.createTextOutput(text)`**: Membuat respons teks biasa.
*   **`.setMimeType(mimeType)`**: Mengatur tipe konten. Yang paling umum adalah:
    *   `ContentService.MimeType.JSON`: Untuk API.
    *   `ContentService.MimeType.TEXT`: Untuk teks biasa.
    *   `ContentService.MimeType.JAVASCRIPT`: Untuk respons JSONP.

### 3. `google.script.run` (Di Sisi Klien/Frontend)
*   Ini bukan method di `Code.gs`, tetapi di HTML Anda. Ini adalah **cara modern dan paling direkomendasikan** untuk berkomunikasi antara frontend dan backend.
*   **`.withSuccessHandler(function)`**: Menjalankan fungsi callback jika panggilan ke backend berhasil.
*   **`.withFailureHandler(function)`**: Menjalankan fungsi callback jika panggilan ke backend gagal.
*   **`.namaFungsiDiBackend(argumen1, argumen2)`**: Memanggil fungsi yang ada di `Code.gs` secara asinkron.
