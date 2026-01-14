/**
 * ================================================
 * CORE SYSTEM - APLIKASI ABSENSI (Code.js)
 * ================================================
 * Web App Pusat yang mengakses Database terpisah per sekolah
 * Deploy: Execute as "Me", Who has access "Anyone"
 */

// ==================== NPSN REGISTRY ====================
/**
 * Master Registry: NPSN → Spreadsheet ID
 * Tambahkan entry baru untuk setiap sekolah
 */
const SCHOOL_REGISTRY = {
  20205293: '1-elR-0kxjBwsM4TatxDY-XIJBuy69hUY6zM3hMIlFwk', // SDN Pasirhalang
  20206262: '1hVDa2Cg9dD87bqe5D195ydqDuPC02HXCLVMOfSjPtRI', // SDN 3 Rajamandalawetan
  20206263: '1_yiNxacAucrjIFMOrXrC-Dr_ubVTz7hl_McTYvdd6rc', // SDN 2 Rajamandalawetan
  20206264: '1jyjeL3Z95ifQTa9d3UTTuzcSOvJ7pU3qFtQOobO0z-k', // SDN 1 Rajamandalawetan
  20206261: '1RU3ypwrgn8bn6nvcgjxeLLQ6k2QsQgr9x7jAyaCSuTQ', // SDN 4 Rajamandalawetan
  20208126: '1XOivGe2iJyU-v7BfOMqR_8ofMvof-Ii4p533jsFj9OI', // SDN Cigentur
  20207714: '1nyMkAHNjMaI9C8J3hiIhs-NL-0KXO45kOgrpe99woOY', // SDN Girimukti
  20205926: '1XQw5AN7UsjN1CmJFz7q_eokw5FoTrMEmeoihctTZDdA', // SDN Tresnaraja
  20205105: '1OxMtBWFTXRmDVFsiH9ZD-6HxXHlUKXgPjBN1Z9v4vNs', // SDN Neglasari
  20207765: '18fXd4eeBWpCrmQTprTtmIg1PWqd9IVrYEzI2cDe6_wo', // SDN Neglasari
};

/**
 * ==================== MONITORING DASHBOARD ====================
 * Get Daily Monitoring Data for Principal/Operator
 */
function getDailyMonitoringData(npsn) {
  try {
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    if (!spreadsheetId) {
      return { success: false, message: 'Sekolah tidak ditemukan' };
    }
    const ss = SpreadsheetApp.openById(spreadsheetId);

    // 1. Get All Teachers
    const allTeachers = loadTeachers(ss);

    // 2. Get Today's Attendance
    const sheet = ss.getSheetByName('data-absensi');
    const data = sheet.getDataRange().getValues(); // Use getValues() for robust Date objects
    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // Map to store attendance by name for today
    const attendanceMap = new Map();

    // Skip header
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;

      let rowDate = '';
      try {
        // row[0] is already a Date object because we use getValues()
        rowDate = Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } catch (e) {
        continue;
      }

      if (rowDate === todayStr) {
        const nama = row[1] ? row[1].toString().trim() : '';
        const tipe = row[2]; // Check In, Check Out, Izin
        const status = row[3]; // Hadir, Terlambat, Izin
        const foto = row[5];
        const ket = row[6];

        if (!attendanceMap.has(nama) || tipe === 'Check In' || tipe === 'Izin') {
          attendanceMap.set(nama, {
            tipe: tipe,
            status: status,
            waktu: Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'HH:mm'),
            foto: foto,
            keterangan: ket
          });
        }
      }
    }

    // 3. Compile Result
    const monitoringList = [];
    const stats = {
      total: allTeachers.length,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpha: 0
    };

    allTeachers.forEach(t => {
      const record = attendanceMap.get(t.nama);
      let statusFinal = 'Alpha';
      let detail = '-';
      let fotoUrl = null;
      let waktu = '-';
      let jabatan = t.jabatan;

      if (record) {
        if (record.tipe === 'Izin') {
          if (record.keterangan.toLowerCase().includes('sakit')) {
            statusFinal = 'Sakit';
          } else {
            statusFinal = 'Izin';
          }
          detail = record.keterangan;
          fotoUrl = record.foto;
        } else {
          statusFinal = 'Hadir';
          detail = record.status === 'Terlambat' ? 'Terlambat' : 'Tepat Waktu';
          waktu = record.waktu; // Simplified
          fotoUrl = record.foto;
        }
      }

      // Update Stats
      if (statusFinal === 'Hadir') stats.hadir++;
      else if (statusFinal === 'Sakit') stats.sakit++;
      else if (statusFinal === 'Izin') stats.izin++;
      else stats.alpha++;

      monitoringList.push({
        nama: t.nama,
        jabatan: jabatan || '-',
        status: statusFinal,
        detail: detail,
        waktu: waktu,
        foto: fotoUrl
      });
    });

    // Sorting: Alpha first, then Izin/Sakit, then Hadir
    monitoringList.sort((a, b) => {
      const score = (s) => {
        if (s === 'Alpha') return 0;
        if (s === 'Sakit') return 1;
        if (s === 'Izin') return 2;
        return 3;
      };
      return score(a.status) - score(b.status);
    });

    return {
      success: true,
      stats: stats,
      list: monitoringList,
      date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMMM yyyy')
    };

  } catch (error) {
    Logger.log('Monitoring Data Error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Coordinate Registry: NPSN → GPS Coordinates (HARDCODED)
 * Format: { npsn: { lat: number, lng: number, radius: number } }
 * Koordinat ini PRIORITY UTAMA, tidak perlu parsing dari spreadsheet
 */
const SCHOOL_COORDINATES = {
  20205293: {
    lat: -6.752088,
    lng: 107.458523,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN Pasirhalang',
  },
  20206262: {
    lat: -6.747917,
    lng: 107.443805,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN 3 Rajamandalawetan',
  },
  20206263: {
    lat: -6.747762,
    lng: 107.444029,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN 2 Rajamandalawetan',
  },
  20206264: {
    lat: -6.750428,
    lng: 107.445512,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN 1 Rajamandalawetan',
  },
  20206261: {
    lat: -6.746398,
    lng: 107.448392,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN 4 Rajamandalawetan',
  },
  20208126: {
    lat: -6.764968,
    lng: 107.444838,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN Cigentur',
  },
  20207714: {
    lat: -6.75178,
    lng: 107.45391,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN Girimukti',
  },
  20205105: {
    lat: -6.73943,
    lng: 107.45395,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN Neglasari',
  },
  20205926: {
    lat: -6.766970,
    lng: 107.453510,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN Tresnaraja',
  },
  20207765: {
    lat: -6.719116,
    lng: 107.449630,
    radius: 50, // Hardcoded for speed (meters)
    name: 'SDN 2 Cisomang',
  },
  // Tambahkan sekolah lainnya di sini sesuai format di atas
};

// ==================== ENTRY POINT ====================
/**
 * Main entry point saat user akses Web App
 * URL format: https://script.google.com/macros/s/xxx/exec?npsn=20219021
 */
function doGet(e) {
  const npsn = e.parameter.npsn;

  // Load Form.html menggunakan Template untuk passing variabel
  const template = HtmlService.createTemplateFromFile('Form');

  // Validasi NPSN - Pass ke frontend untuk handling
  if (!npsn) {
    Logger.log('WARNING: No NPSN in URL');
    template.npsn = null; // Frontend will show error
  } else if (!SCHOOL_REGISTRY[npsn]) {
    Logger.log('WARNING: NPSN not registered: ' + npsn);
    template.npsn = null; // Frontend will show error
  } else {
    template.npsn = npsn; // Valid NPSN
  }

  return template
    .evaluate()
    .setTitle('SIKADIR v.1')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== DATA LOADING ====================
/**
 * Load school data dari spreadsheet
 * Dipanggil dari Form.html saat initial load
 * @param {string} npsn - NPSN dari URL parameter
 */
/**
 * Load school data dari spreadsheet
 * Dipanggil dari Form.html saat initial load
 * @param {string} npsn - NPSN dari URL parameter
 */
function getSchoolPublicData(npsn) {
  try {
    if (!npsn || !SCHOOL_REGISTRY[npsn]) {
      return { success: false, message: 'NPSN tidak terdaftar.' };
    }
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);

    const config = loadConfig(ss, npsn);
    const logoBase64 = getSchoolLogo(spreadsheetId);

    return {
      success: true,
      data: {
        schoolName: config.namaSekolah || ss.getName(),
        logo: logoBase64
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get School Logo from Drive
 * Files named logo.png in the same folder as spreadsheet
 */
function getSchoolLogo(spreadsheetId) {
  try {
    const file = DriveApp.getFileById(spreadsheetId);
    const parents = file.getParents();
    if (!parents.hasNext()) return null;

    const folder = parents.next();
    const logoFiles = folder.getFilesByName('logo.png');

    if (logoFiles.hasNext()) {
      const logoFile = logoFiles.next();
      const blob = logoFile.getBlob();
      const base64 = Utilities.base64Encode(blob.getBytes());
      return `data:${blob.getContentType()};base64,${base64}`;
    }
    return null;
  } catch (e) {
    Logger.log('Error fetching logo: ' + e.message);
    return null;
  }
}

function getSchoolData(npsn) {

  try {
    Logger.log('=== getSchoolData CALLED ===');
    Logger.log('NPSN received: ' + npsn);
    Logger.log('Type of npsn: ' + typeof npsn);

    // Validasi NPSN
    if (!npsn) {
      Logger.log('ERROR: NPSN is null/undefined');
      return {
        success: false,
        message:
          'NPSN tidak ditemukan. Pastikan URL berisi parameter ?npsn=...',
      };
    }

    Logger.log('Checking SCHOOL_REGISTRY...');
    Logger.log('Registry keys: ' + Object.keys(SCHOOL_REGISTRY).join(', '));

    if (!SCHOOL_REGISTRY[npsn]) {
      return { success: false, message: 'NPSN tidak terdaftar.' };
    }

    // 1. CEK CACHE (DISABLED)
    // const cache = CacheService.getScriptCache();
    // const cacheKey = 'data_' + npsn;
    // const cachedData = cache.get(cacheKey);

    // if (cachedData) {
    //     Logger.log('Serving from CACHE');
    //     return {
    //         success: true,
    //         data: JSON.parse(cachedData)
    //     };
    // }

    // 2. JIKA TIDAK ADA DI CACHE, BACA SPREADSHEET
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);

    const config = loadConfig(ss, npsn);
    config.logo = getSchoolLogo(spreadsheetId);


    // Optimasi: Baca guru hanya kolom yg perlu (Nama, Status)
    // loadTeachers sudah cukup efisien
    const teachers = loadTeachers(ss);

    config.schoolName = config.namaSekolah || ss.getName();
    config.npsn = npsn;

    const resultData = { config: config, teachers: teachers };

    // 3. SIMPAN KE CACHE (DISABLED)
    // try {
    //     cache.put(cacheKey, JSON.stringify(resultData), 600);
    // } catch (e) {
    //     Logger.log('Cache failed (data too big): ' + e.message);
    // }

    return {
      success: true,
      data: resultData,
    };
  } catch (error) {
    Logger.log('=== CRITICAL ERROR in getSchoolData ===');
    Logger.log('Error message: ' + error.message);
    Logger.log('Error toString: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return {
      success: false,
      message:
        'Error: ' +
        error.message +
        ' | Cek Apps Script Executions log untuk detail lengkap',
    };
  }
}

/**
 * DIAGNOSTIC: Test function to verify basic functionality
 */
function testConnection(npsn) {
  Logger.log('TEST: Function called with npsn=' + npsn);
  return {
    success: true,
    message: 'Test berhasil! NPSN diterima: ' + npsn,
    timestamp: new Date().toString(),
    registry: Object.keys(SCHOOL_REGISTRY),
  };
}

/**
 * Load config sheet
 * PRIORITAS: Koordinat dari SCHOOL_COORDINATES (hardcoded), baru dari spreadsheet
 */
function loadConfig(ss, npsn) {
  const sheet = ss.getSheetByName('config');
  if (!sheet) {
    throw new Error(
      'Sheet "config" tidak ditemukan. Jalankan Setup Database dulu.',
    );
  }

  // PENTING: Gunakan getDisplayValues() untuk menjamin hasil berupa STRING
  const data = sheet.getRange('B1:B9').getDisplayValues();

  // 1. CEK HARDCODED COORDINATES DULU (Priority utama)
  Logger.log('=== LOADING COORDINATES ===');
  let lat, lng, radius;

  if (SCHOOL_COORDINATES[npsn]) {
    Logger.log('✅ Using HARDCODED coordinates for NPSN: ' + npsn);
    const coords = SCHOOL_COORDINATES[npsn];
    lat = coords.lat;
    lng = coords.lng;
    radius = coords.radius || 100;
    Logger.log('  Lat: ' + lat);
    Logger.log('  Lng: ' + lng);
    Logger.log('  Radius: ' + radius);
  } else {
    Logger.log(
      '⚠️ No hardcoded coordinates found, attempting to parse from spreadsheet...',
    );
    // Fallback: Parse dari spreadsheet (B2=Lat, B3=Lng, B4=Radius)
    const parseNum = (v) => {
      if (!v) return 0;
      let str = v.toString().trim();
      const dotCount = (str.match(/\./g) || []).length;
      if (dotCount > 1) {
        str = str.replace(/\./g, '');
        let isNegative = str.startsWith('-');
        let digits = str.replace('-', '');
        if (digits.length >= 7) {
          let decimalPos =
            digits.length === 7 ? 1 : digits.length === 8 ? 2 : 3;
          str = digits.slice(0, decimalPos) + '.' + digits.slice(decimalPos);
          if (isNegative) str = '-' + str;
        }
      }
      return parseFloat(str) || 0;
    };

    lat = parseNum(data[1][0]); // B2
    lng = parseNum(data[2][0]); // B3
    radius = parseNum(data[3][0]) || 100; // B4
    Logger.log('  Parsed Lat: ' + lat);
    Logger.log('  Parsed Lng: ' + lng);
  }

  return {
    lat: lat,
    lng: lng,
    radius: radius,
    jamMasuk: data[4][0] || '07:00',      // B5
    jamBatasIzin: data[5][0] || '09:00',  // B6
    jamPulang: data[6][0] || '14:00',     // B7
    adminPin: '000000',                   // Pin fallback (not explicitly in image)
    namaSekolah: (data[7] && data[7][0] && data[7][0] !== "") ? data[7][0] : ss.getName(), // B8
    jamPulangJumat: (data[8] && data[8][0]) ? data[8][0] : '11:00', // B9 (Default 11:00 jika kosong)
  };
}

/**
 * Load teachers from database sheet
 */
function loadTeachers(ss) {
  const sheet = ss.getSheetByName('database');
  if (!sheet) {
    throw new Error('Sheet "database" tidak ditemukan.');
  }

  // Pake getDisplayValues supaya aman dari Date Object yang bikin error
  const data = sheet.getDataRange().getDisplayValues();
  const teachers = [];

  // Skip header (row 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      // Jika ada nama
      teachers.push({
        nama: row[0].toString().trim(),           // Kolom A: Nama Lengkap (Trimmed)
        nip: row[1],            // Kolom B: NIP
        jabatan: row[2],        // Kolom C: Jabatan
        unitKerja: row[3],      // Kolom D: Unit Kerja
        email: row[4],          // Kolom E: Email
        password: row[5],       // Kolom F: Password
        pin: row[6],            // Kolom G: PIN
        lastCheckIn: row[7],    // Kolom H: LastCheckInDate
        deviceId: row[8]        // Kolom I: DeviceID (NEW)
      });
    }
  }

  return teachers;
}

/**
 * Update LastCheckInDate for a teacher
 */
function updateTeacherLastCheckIn(ss, nama) {
  const sheet = ss.getSheetByName('database');
  const data = sheet.getDataRange().getValues();
  const targetName = nama ? nama.toString().trim() : '';

  // Find row by nama (Column A / Index 0)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === targetName) {
      // Update Column H (Index 8 in 1-based notation)
      const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sheet.getRange(i + 1, 8).setValue(todayStr);
      break;
    }
  }
}


/**
 * Validate Login (NIP/Email & Password)
 */
function validateLogin(identifier, password, npsn, currentDeviceId) {
  try {
    Logger.log('=== validateLogin CALLED ===');
    Logger.log('Identifier received: "' + identifier + '"');
    Logger.log('DeviceID received: "' + currentDeviceId + '"');
    Logger.log('NPSN: ' + npsn);

    if (!identifier) {
      return { success: false, message: 'NIP atau Email harus diisi.' };
    }

    const cache = CacheService.getScriptCache();
    // Convert to lowercase and trim for case-insensitive matching
    const targetIdentifier = identifier.toString().toLowerCase().trim();
    Logger.log('Target identifier (cleaned): "' + targetIdentifier + '"');

    const lockoutKey = `lockout_${targetIdentifier}`;
    const attemptKey = `attempts_${targetIdentifier}`;

    // Check lockout
    const lockoutUntil = cache.get(lockoutKey);
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000 / 60);
      if (remaining > 0) {
        return { success: false, message: `Akun terkunci. Coba lagi dalam ${remaining} menit.` };
      } else {
        cache.remove(lockoutKey);
        cache.remove(attemptKey);
      }
    }
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    if (!spreadsheetId) {
      return { success: false, message: 'Sekolah tidak ditemukan.' };
    }
    const ss = SpreadsheetApp.openById(spreadsheetId);

    // Load teachers
    const teachers = loadTeachers(ss);
    Logger.log('Total teachers loaded: ' + teachers.length);

    // Find teacher: Try NIP first, then Email
    let teacher = teachers.find(t => {
      if (!t.nip) return false;
      const dbNip = t.nip.toString().toLowerCase().trim();
      return dbNip === targetIdentifier;
    });

    if (!teacher) {
      Logger.log('NIP matching failed, trying Email...');
      teacher = teachers.find(t => {
        if (!t.email) return false;
        const dbEmail = t.email.toLowerCase().trim();
        return dbEmail === targetIdentifier;
      });
    }

    if (!teacher) {
      Logger.log('❌ Teacher not found for identifier: ' + targetIdentifier);
      return { success: false, message: 'NIP atau Email tidak ditemukan.' };
    }

    Logger.log('✅ Teacher found: ' + teacher.nama);

    // Password Check (Robust string comparison)
    if (String(teacher.password) === String(password)) {
      Logger.log('✅ Password MATCH!');

      // --- DEVICE LOCK LOGIC (STRICT 2-WAY) ---

      // 1. Cek apakah HP ini sudah dipakai akun lain?
      const otherUserUsingThisDevice = teachers.find(t =>
        t.deviceId === currentDeviceId && t.nama !== teacher.nama
      );

      if (otherUserUsingThisDevice) {
        Logger.log('❌ DEVICE ALREADY USED by: ' + otherUserUsingThisDevice.nama);
        return {
          success: false,
          message: 'Gagal Login. Perangkat HP ini sudah terdaftar untuk Guru lain (' + otherUserUsingThisDevice.nama + ').\n\nSatu HP hanya boleh digunakan oleh satu akun untuk menjamin keaslian absensi.'
        };
      }

      // 2. Cek apakah Akun ini sudah terkunci di HP lain?
      if (!teacher.deviceId) {
        // Pairing otomatis pada login pertama jika HP belum dipakai siapapun
        Logger.log('📱 No DeviceID registered for this teacher. Pairing with: ' + currentDeviceId);
        const sheet = ss.getSheetByName('database');
        const dataRows = sheet.getDataRange().getValues();
        for (let i = 1; i < dataRows.length; i++) {
          if (dataRows[i][0] === teacher.nama) {
            sheet.getRange(i + 1, 9).setValue(currentDeviceId); // Column I (Index 9)
            Logger.log('✅ Device paired successfully');
            break;
          }
        }
      } else if (teacher.deviceId !== currentDeviceId) {
        // SMART DEVICE LOCK LOGIC (IOS FRIENDLY)
        // Logika Lama: Reject jika beda device ID. Masalahnya: iPhone sering ganti ID.
        // Logika Baru: Jika device ID *baru* ini BELUM dipake oleh guru lain (sudah dicek di poin 1 di atas),
        // maka kita UPDATE saja lock-nya ke device baru ini. 
        // Ini aman dari "Joki Antar Guru", karena jika device dipake guru lain, sudah kena reject di step 1.

        Logger.log('🔄 SMART LOCK: Device Update Detected.');
        Logger.log('   Old Device: ' + teacher.deviceId);
        Logger.log('   New Device: ' + currentDeviceId);

        const sheet = ss.getSheetByName('database');
        const dataRows = sheet.getDataRange().getValues();
        for (let i = 1; i < dataRows.length; i++) {
          if (dataRows[i][0] === teacher.nama) {
            sheet.getRange(i + 1, 9).setValue(currentDeviceId); // Column I (Index 9)
            Logger.log('✅ Device ID updated for ' + teacher.nama);
            break;
          }
        }
      }

      cache.remove(attemptKey); // Clear attempts
      return {
        success: true,
        data: {
          nama: teacher.nama,
          nip: teacher.nip,
          jabatan: teacher.jabatan,
          unitKerja: teacher.unitKerja,
          email: teacher.email,
          isAdmin: teacher.nama.toLowerCase().includes('admin') // Simple Admin Check
        }
      };
    } else {
      // Increment attempts
      let attempts = parseInt(cache.get(attemptKey) || '0') + 1;
      cache.put(attemptKey, attempts.toString(), 300); // 5 min memory

      if (attempts >= 3) {
        const lockoutTime = Date.now() + 5 * 60 * 1000;
        cache.put(lockoutKey, lockoutTime.toString(), 300);
        cache.remove(attemptKey);
        return { success: false, message: 'Password salah 3x. Akun dikunci 5 menit.' };
      }

      return { success: false, message: `Password salah. Sisa percobaan: ${3 - attempts}x` };
    }

  } catch (error) {
    Logger.log('Login Error: ' + error.message);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}

// ==================== PHOTO UPLOAD ====================
/**
 * Upload foto ke Google Drive dengan folder organization
 */
function uploadPhotoToDrive(base64Data, fileName, npsn) {
  try {
    Logger.log('===== UPLOAD PHOTO START =====');
    Logger.log('Filename: ' + fileName);

    // Decode base64
    const base64Content = base64Data.split(',')[1]; // Remove "data:image/jpeg;base64,"
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Content),
      'image/jpeg',
      fileName,
    );
    Logger.log('Blob created, Size: ' + blob.getBytes().length + ' bytes');

    // Get or create folder structure
    const folder = getOrCreatePhotoFolder(npsn);
    Logger.log(
      'Target folder: ' + folder.getName() + ' (ID: ' + folder.getId() + ')',
    );

    // Upload file
    const file = folder.createFile(blob);
    Logger.log('File uploaded successfully: ' + file.getName());

    // Modern permission handling: Set file to be viewable by anyone with link
    // Note: Deprecated setSharing() removed, using modern approach
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Alternative if setSharing still causes issues (uncomment below, comment above):
    // Drive.Permissions.insert({
    //     'role': 'reader',
    //     'type': 'anyone',
    //     'withLink': true
    // }, file.getId());

    // Get shareable URL
    const fileUrl = file.getUrl();
    Logger.log('File URL: ' + fileUrl);
    Logger.log('===== UPLOAD PHOTO SUCCESS =====');

    return fileUrl;
  } catch (error) {
    Logger.log('===== UPLOAD PHOTO FAILED =====');
    Logger.log('Error Type: ' + error.name);
    Logger.log('Error Message: ' + error.message);
    Logger.log('Error Stack: ' + error.stack);
    Logger.log('================================');

    // Return detailed error info (instead of null)
    return null;
  }
}

/**
 * Get atau create folder structure: Absensi-Foto/2025-12/NPSN-xxxxx
 */
function getOrCreatePhotoFolder(npsn) {
  const rootFolderName = 'Absensi-Foto';
  const today = new Date();
  const yearMonth = Utilities.formatDate(
    today,
    Session.getScriptTimeZone(),
    'yyyy-MM',
  );

  Logger.log(
    'Creating folder structure: ' +
    rootFolderName +
    ' -> ' +
    yearMonth +
    ' -> NPSN-' +
    npsn,
  );

  // 1. Root folder
  let rootFolder = getFolderByName(rootFolderName);
  if (!rootFolder) {
    Logger.log('Creating root folder: ' + rootFolderName);
    rootFolder = DriveApp.createFolder(rootFolderName);
  } else {
    Logger.log('Root folder exists: ' + rootFolderName);
  }

  // 2. Year-Month folder
  let monthFolder = getFolderByName(yearMonth, rootFolder);
  if (!monthFolder) {
    Logger.log('Creating month folder: ' + yearMonth);
    monthFolder = rootFolder.createFolder(yearMonth);
  } else {
    Logger.log('Month folder exists: ' + yearMonth);
  }

  // 3. NPSN folder
  const npsnFolderName = 'NPSN-' + npsn;
  let npsnFolder = getFolderByName(npsnFolderName, monthFolder);
  if (!npsnFolder) {
    Logger.log('Creating NPSN folder: ' + npsnFolderName);
    npsnFolder = monthFolder.createFolder(npsnFolderName);
  } else {
    Logger.log('NPSN folder exists: ' + npsnFolderName);
  }

  Logger.log(
    'Final folder path: ' +
    rootFolderName +
    '/' +
    yearMonth +
    '/' +
    npsnFolderName,
  );
  return npsnFolder;
}

/**
 * Helper: Find folder by name
 */
function getFolderByName(name, parentFolder) {
  const folders = parentFolder
    ? parentFolder.getFoldersByName(name)
    : DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : null;
}

/**
 * Generate unique filename
 * Format: NamaGuru_YYYYMMDD_HHMM_Type.jpg
 */
function generatePhotoFilename(namaGuru, type) {
  const now = new Date();
  const timestamp = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    'yyyyMMdd_HHmm',
  );
  const sanitizedName = namaGuru.replace(/[^a-zA-Z0-9]/g, '');

  return `${sanitizedName}_${timestamp}_${type}.jpg`;
}

// ==================== GPS VALIDATION ====================
/**
 * Haversine formula: Calculate distance between two coordinates
 * Returns distance in meters
 */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate GPS location
 */
function validateGPS(userLat, userLng, schoolLat, schoolLng, radius) {
  const distance = getDistance(userLat, userLng, schoolLat, schoolLng);
  return {
    valid: distance <= radius,
    distance: Math.round(distance),
  };
}

// ==================== PIN VALIDATION ====================
/**
 * Validate PIN with attempt tracking (using CacheService)
 */
function validatePIN(userName, inputPin, npsn) {
  try {
    const cache = CacheService.getScriptCache();
    const lockoutKey = `lockout_${userName}`;
    const attemptKey = `attempts_${userName}`;

    // Check lockout
    const lockoutUntil = cache.get(lockoutKey);
    if (lockoutUntil) {
      const remaining = Math.ceil(
        (parseInt(lockoutUntil) - Date.now()) / 1000 / 60,
      );
      if (remaining > 0) {
        return {
          valid: false,
          message: `Akun terkunci. Coba lagi dalam ${remaining} menit.`,
        };
      } else {
        // Lockout expired, clear
        cache.remove(lockoutKey);
        cache.remove(attemptKey);
      }
    }

    // Get correct PIN from database
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const teachers = loadTeachers(ss);

    const teacher = teachers.find((t) => t.nama === userName);
    if (!teacher) {
      return { valid: false, message: 'Guru tidak ditemukan' };
    }

    // Validate PIN
    if (inputPin === teacher.pin) {
      // Success - clear attempts
      cache.remove(attemptKey);
      return { valid: true };
    } else {
      // Wrong PIN - increment attempts
      let attempts = parseInt(cache.get(attemptKey) || '0') + 1;
      cache.put(attemptKey, attempts.toString(), 300); // 5 min expiry

      if (attempts >= 3) {
        // Lockout for 5 minutes
        const lockoutTime = Date.now() + 5 * 60 * 1000;
        cache.put(lockoutKey, lockoutTime.toString(), 300);
        cache.remove(attemptKey);
        return {
          valid: false,
          message: 'PIN salah 3x. Akun dikunci 5 menit.',
        };
      }

      return {
        valid: false,
        message: `PIN salah. Sisa percobaan: ${3 - attempts}x`,
      };
    }
  } catch (error) {
    Logger.log('PIN Validation Error: ' + error.message);
    return { valid: false, message: 'Error validasi PIN' };
  }
}

// ==================== TIME VALIDATION ====================
/**
 * Check if current time is late
 */
function isLate(jamMasuk) {
  if (!jamMasuk) return false;
  const now = new Date();
  const currentTime = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    'HH:mm',
  );

  // Helper to convert HH:mm to minutes for robust comparison
  const toMin = (t) => {
    const p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  };

  return toMin(currentTime) > toMin(jamMasuk);
}

/**
 * Parse time string to Date object (today)
 */
function parseTime(timeStr) {
  const parts = timeStr.split(':');
  const now = new Date();
  now.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
  return now;
}

// ==================== CHECK IN ====================
/**
 * Process Check In
 */
function processCheckIn(data) {
  try {
    const { nama, pin, lat, lng, foto, alasan, npsn } = data;

    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const config = loadConfig(ss, npsn);

    // 1. PIN Validation Removed
    // const pinResult = validatePIN(nama, pin, npsn);
    // if (!pinResult.valid) {
    //   return { success: false, message: pinResult.message };
    // }

    // 2. Validate GPS (Conditional)
    const teachers = loadTeachers(ss);
    const targetName = nama ? nama.toString().trim() : '';
    const teacher = teachers.find(t => t.nama.trim() === targetName);
    const jabatan = teacher ? (teacher.jabatan || '').toLowerCase() : '';
    const isVIP = /kepala sekolah|operator/i.test(jabatan);

    if (!isVIP) {
      const gpsResult = validateGPS(
        lat,
        lng,
        config.lat,
        config.lng,
        config.radius,
      );
      if (!gpsResult.valid) {
        return {
          success: false,
          message: `Anda berada di luar area sekolah (${gpsResult.distance}m dari sekolah). Absensi ditolak.`,
        };
      }
    }

    // 3. Check duplicate (sudah Check In hari ini?)
    const duplicate = checkDuplicateCheckIn(ss, nama);
    if (duplicate) {
      return {
        success: false,
        message: 'Anda sudah melakukan Check In hari ini.',
      };
    }

    // 4. Check if late
    const late = isLate(config.jamMasuk);
    let status = late ? 'Terlambat' : 'Hadir';
    let keterangan = late ? alasan : '-';

    // 5. Upload foto ke Drive (jika ada)
    let photoUrl = '-';
    if (foto) {
      const filename = generatePhotoFilename(nama, 'CheckIn');
      photoUrl = uploadPhotoToDrive(foto, filename, npsn);
      if (!photoUrl) {
        return {
          success: false,
          message: 'Upload foto gagal. Coba lagi.',
        };
      }
    }

    // 6. Save to data-absensi
    const sheet = ss.getSheetByName('data-absensi');
    const timestamp = new Date();
    const koordinat = `${lat},${lng}`;

    sheet.appendRow([
      timestamp,
      nama,
      'Check In',
      status,
      koordinat,
      photoUrl,
      keterangan,
      '-', // Override by admin
      '-', // Admin name
    ]);

    // 7. Update LastCheckInDate for 1x/day Validation
    updateTeacherLastCheckIn(ss, nama);

    return {
      success: true,
      status: status, // NEW: Kirim status (Hadir/Terlambat) ke frontend untuk trigger confetti
      message: `✅ Check In Berhasil!\n\nStatus: ${status}\nWaktu: ${Utilities.formatDate(
        timestamp,
        Session.getScriptTimeZone(),
        'HH:mm:ss',
      )}`,
    };
  } catch (error) {
    Logger.log('Check In Error: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message,
    };
  }
}

// ==================== CHECK OUT ====================
/**
 * Process Check Out
 */
function processCheckOut(data) {
  try {
    const { nama, pin, lat, lng, npsn } = data;

    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const config = loadConfig(ss, npsn);

    // 1. PIN Validation Removed
    // const pinResult = validatePIN(nama, pin, npsn);
    // if (!pinResult.valid) {
    //   return { success: false, message: pinResult.message };
    // }

    // 2. Check sudah Check In hari ini?
    const hasCheckedIn = checkDuplicateCheckIn(ss, nama);
    if (!hasCheckedIn) {
      return {
        success: false,
        message: 'Anda belum melakukan Check In hari ini.',
      };
    }

    // 3. Check sudah Check Out hari ini?
    const hasCheckedOut = checkDuplicateCheckOut(ss, nama);
    if (hasCheckedOut) {
      return {
        success: false,
        message: 'Anda sudah melakukan Check Out hari ini.',
      };
    }

    // 4. Check apakah sudah saatnya Pulang? (Minimum Check Out Time)
    const now = new Date();
    const currentTimeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    const toMin = (t) => {
      if (!t) return 0;
      const p = t.split(':');
      return parseInt(p[0]) * 60 + parseInt(p[1]);
    };

    // LOGIKA KHUSUS HARI JUMAT
    const dayOfWeek = now.getDay(); // 0=Minggu, 5=Jumat, 6=Sabtu
    let targetJamPulang = config.jamPulang;

    if (dayOfWeek === 5 && config.jamPulangJumat) {
      targetJamPulang = config.jamPulangJumat;
    }

    if (toMin(currentTimeStr) < toMin(targetJamPulang)) {
      return {
        success: false,
        message: `Belum saatnya Check Out. Jam pulang hari ini pukul ${targetJamPulang}.`,
      };
    }

    // 5. Save to data-absensi (GPS validation optional untuk Check Out)
    const sheet = ss.getSheetByName('data-absensi');
    const timestamp = new Date();
    const koordinat = `${lat},${lng}`;

    sheet.appendRow([
      timestamp,
      nama,
      'Check Out',
      'Hadir',
      koordinat,
      '-', // No photo for Check Out
      '-',
      '-',
      '-',
    ]);

    return {
      success: true,
      message: `✅ Check Out Berhasil!\n\nWaktu: ${Utilities.formatDate(
        timestamp,
        Session.getScriptTimeZone(),
        'HH:mm:ss',
      )}`,
    };
  } catch (error) {
    Logger.log('Check Out Error: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message,
    };
  }
}

// ==================== IZIN ====================
/**
 * Process Izin
 */
function processIzin(data) {
  try {
    const { nama, pin, jenisIzin, alasan, foto, npsn } = data;

    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const config = loadConfig(ss, npsn);

    // 1. PIN Validation Removed
    // const pinResult = validatePIN(nama, pin, npsn);
    // if (!pinResult.valid) {
    //   return { success: false, message: pinResult.message };
    // }

    // 2. Check waktu batas izin
    const now = new Date();
    const currentTime = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      'HH:mm',
    );

    // Helper to convert HH:mm to minutes for robust comparison
    const toMin = (t) => {
      const p = t.split(':');
      return parseInt(p[0]) * 60 + parseInt(p[1]);
    };

    // REVISI: Izin "Dinas" bebas waktu (tidak dibatasi jam)
    if (toMin(currentTime) > toMin(config.jamBatasIzin) && jenisIzin !== 'Dinas') {
      return {
        success: false,
        message: `Batas waktu pengajuan izin (${config.jamBatasIzin}) sudah habis.`,
      };
    }

    // 3. Upload foto bukti (jika ada)
    let photoUrl = '-';
    if (foto) {
      const filename = generatePhotoFilename(nama, 'Izin');
      photoUrl = uploadPhotoToDrive(foto, filename, npsn);
      if (!photoUrl) {
        return {
          success: false,
          message: 'Upload foto bukti gagal. Coba lagi.',
        };
      }
    }

    // 4. Save to data-absensi
    const sheet = ss.getSheetByName('data-absensi');
    const timestamp = new Date();
    const keterangan = `${jenisIzin} - ${alasan}`;

    sheet.appendRow([
      timestamp,
      nama,
      'Izin',
      'Izin',
      '-', // No GPS for Izin
      photoUrl,
      keterangan,
      '-',
      '-',
    ]);

    return {
      success: true,
      message: `✅ Pengajuan Izin Berhasil!\n\nJenis: ${jenisIzin}\nWaktu: ${Utilities.formatDate(
        timestamp,
        Session.getScriptTimeZone(),
        'HH:mm:ss',
      )}`,
    };
  } catch (error) {
    Logger.log('Izin Error: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message,
    };
  }
}

// ==================== DUPLICATE CHECK ====================
/**
 * Check if user already checked in today
 */
function checkDuplicateCheckIn(ss, userName) {
  const teachers = loadTeachers(ss);
  const targetName = userName ? userName.toString().trim() : '';
  const teacher = teachers.find(t => t.nama.trim() === targetName);

  if (teacher && teacher.lastCheckIn) {
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (teacher.lastCheckIn === today) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user already checked out today
 */
function checkDuplicateCheckOut(ss, userName) {
  const sheet = ss.getSheetByName('data-absensi');
  const data = sheet.getDataRange().getValues();
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const targetName = userName ? userName.toString().trim() : '';

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const rowDate = Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const rowName = row[1] ? row[1].toString().trim() : '';
    const rowType = row[2];

    if (rowDate === todayStr && rowName === targetName && rowType === 'Check Out') {
      return true;
    }
  }
  return false;
}

// ==================== STATISTICS ====================
/**
 * Get teacher statistics for current month
 */
function getTeacherStats(userName, npsn) {
  try {
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);

    const absensiSheet = ss.getSheetByName('data-absensi');
    const jadwalSheet = ss.getSheetByName('jadwal-kerja');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');

    // Count Hadir (Check In dengan status Hadir)
    let hadir = 0;
    let izin = 0;

    // Cek Status Hari Kerja/Libur
    const workDayInfo = checkIfWorkDay(ss);

    // Data Status Hari Ini
    let todayStatus = {
      hasCheckedIn: false,
      hasCheckedOut: false, // NEW: Deteksi Check Out
      status: '-',     // Hadir/Terlambat
      waktu: '-',
      waktuPulang: '-', // NEW: Waktu Pulang
      isLibur: !workDayInfo.isWorkDay, // NEW: Status Libur
      liburKeterangan: workDayInfo.keterangan // NEW: Keterangan Libur
    };

    const absensiData = absensiSheet.getDataRange().getValues();
    for (let i = 1; i < absensiData.length; i++) {
      const row = absensiData[i];
      const timestamp = new Date(row[0]);
      const nama = row[1] ? row[1].toString().trim() : '';
      const tipe = row[2];
      const status = row[3];
      const targetName = userName ? userName.toString().trim() : '';

      // Cek Status Hari Ini
      const rowDateStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (rowDateStr === todayStr && nama === targetName) {
        if (tipe === 'Check In') {
          todayStatus.hasCheckedIn = true;
          todayStatus.status = status; // Hadir / Terlambat
          todayStatus.waktu = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm');
        } else if (tipe === 'Check Out') {
          todayStatus.hasCheckedOut = true;
          todayStatus.waktuPulang = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm');
        }
      }

      // Hitung Statistik Bulanan
      if (
        timestamp.getMonth() === currentMonth &&
        timestamp.getFullYear() === currentYear &&
        nama === targetName
      ) {
        if (tipe === 'Check In' && status === 'Hadir') {
          hadir++;
        } else if (status === 'Izin') {
          izin++;
        }
      }
    }

    // Count hari kerja from jadwal-kerja
    let hariKerja = 0;
    const jadwalData = jadwalSheet.getDataRange().getValues();
    for (let i = 1; i < jadwalData.length; i++) {
      const row = jadwalData[i];
      const tanggal = new Date(row[0]);
      const statusHari = row[1];

      if (
        tanggal.getMonth() === currentMonth &&
        tanggal.getFullYear() === currentYear &&
        statusHari === 'Kerja'
      ) {
        hariKerja++;
      }
    }

    // Calculate Alpha
    // NOTE: Alpha di-set 0 dulu karena jadwal kerja belum aktif
    // Alpha akan dihitung otomatis setelah sheet 'jadwal-kerja' terisi penuh 1 bulan
    const alpha = 0; // Math.max(0, hariKerja - hadir - izin);

    return {
      success: true,
      stats: {
        hadir: hadir,
        izin: izin,
        alpha: alpha,
        today: todayStatus // Return status hari ini
      },
    };
  } catch (error) {
    Logger.log('Stats Error: ' + error.message);
    return {
      success: false,
      message: error.message,
    };
  }
}

// ==================== MAIN PROCESSING ====================
/**
 * Unified attendance processing (called from Form.html)
 */
function processAttendance(data) {
  const { tipe, npsn } = data;

  try {
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    const ss = SpreadsheetApp.openById(spreadsheetId);

    // 1. Check if today is a working day
    const workDayStatus = checkIfWorkDay(ss);
    if (!workDayStatus.isWorkDay) {
      return {
        success: false,
        message: `Hari ini sedang ${workDayStatus.status}. Absensi tidak dapat dilakukan karena hari libur (${workDayStatus.keterangan}).`
      };
    }

    if (tipe === 'Check In') {
      return processCheckIn(data);
    } else if (tipe === 'Check Out') {
      return processCheckOut(data);
    } else if (tipe === 'Izin') {
      return processIzin(data);
    } else {
      return {
        success: false,
        message: 'Tipe absensi tidak valid',
      };
    }
  } catch (error) {
    return { success: false, message: 'Gagal memproses absensi: ' + error.message };
  }
}

/**
 * Check if today is a working day from 'jadwal-kerja' sheet
 */
function checkIfWorkDay(ss) {
  const sheet = ss.getSheetByName('jadwal-kerja');
  if (!sheet) return { isWorkDay: true, status: 'Kerja', keterangan: '-' }; // Fallback if sheet missing

  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][0];
    let dateStr = "";

    if (rowDate instanceof Date) {
      dateStr = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      dateStr = String(rowDate);
    }

    if (dateStr === today) {
      const status = data[i][1];
      const keterangan = data[i][2];
      return {
        isWorkDay: status === 'Kerja',
        status: status,
        keterangan: keterangan
      };
    }
  }

  // Fallback: If date not found in sheet, check if weekend
  const day = new Date().getDay();
  if (day === 0 || day === 6) { // 0=Sunday, 6=Saturday
    return { isWorkDay: false, status: 'Libur', keterangan: 'Akhir Pekan (Default)' };
  }

  return { isWorkDay: true, status: 'Kerja', keterangan: '-' };
}

/**
 * Change User Password
 * Priority Match: NIP > Email > Name
 */
function changePassword(npsn, userName, oldPassword, newPassword, nip, email) {
  try {
    const spreadsheetId = SCHOOL_REGISTRY[npsn];
    if (!spreadsheetId) return { success: false, message: 'Sekolah tidak ditemukan.' };

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName('database');
    const data = sheet.getDataRange().getValues();

    // Find row with priority: NIP -> Email -> Name
    for (let i = 1; i < data.length; i++) {
      const dbNama = String(data[i][0]);
      const dbNip = String(data[i][1]);
      const dbEmail = String(data[i][4] || "").toLowerCase().trim();

      const targetNip = nip ? String(nip).trim() : null;
      const targetEmail = email ? String(email).toLowerCase().trim() : null;

      let isMatch = false;
      if (targetNip && dbNip === targetNip) {
        isMatch = true;
      } else if (targetEmail && dbEmail === targetEmail) {
        isMatch = true;
      } else if (!targetNip && !targetEmail && dbNama === userName) {
        // Fallback to name only if both NIP and Email are unavailable
        isMatch = true;
      }

      if (isMatch) {
        // Verify current password (Column F / Index 5)
        // Convert to string to avoid type mismatch (e.g. numeric passwords)
        if (String(data[i][5]) !== String(oldPassword)) {
          return { success: false, message: 'Password lama salah.' };
        }

        // Update to new password
        sheet.getRange(i + 1, 6).setValue(newPassword);
        return { success: true, message: 'Password berhasil diperbarui.' };
      }
    }

    return { success: false, message: 'Guru tidak ditemukan di database.' };
  } catch (error) {
    Logger.log('Change Password Error: ' + error.message);
    return { success: false, message: 'Gagal memperbarui password: ' + error.message };
  }
}

/**
 * ==========================================
 * FUNGSI DEBUG MANUAL (Jalankan ini di Editor)
 * ==========================================
 * Klik dropdown fungsi di atas -> Pilih "debugManualTest" -> Klik Run
 * Ini akan memaksa permintaan izin akses Spreadsheet & Drive
 */
function debugManualTest() {
  Logger.log('=== MEMULAI TEST MANUAL ===');
  const npsnTest = '20205293'; // NPSN SDN Pasirhalang

  Logger.log('Mengetes koneksi untuk NPSN: ' + npsnTest);
  const result = getSchoolData(npsnTest);

  Logger.log('------------------------------------------------');
  Logger.log('HASIL TEST:');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('------------------------------------------------');

  if (result.success) {
    Logger.log('✅ KONEKSI SUKSES! Database terbaca, izin OK.');
    Logger.log('Sekarang aman untuk Deploy sebagai Web App.');
  } else {
    Logger.log('❌ KONEKSI GAGAL. Cek pesan error di atas.');
  }
}