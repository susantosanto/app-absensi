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
    '20205293': '1XQw5AN7UsjN1CmJFz7q_eokw5FoTrMEmeoihctTZDdA'  // SDN Pasirhalang
    // Tambahkan sekolah lainnya di sini jika ada
};

/**
 * Coordinate Registry: NPSN → GPS Coordinates (HARDCODED)
 * Format: { npsn: { lat: number, lng: number, radius: number } }
 * Koordinat ini PRIORITY UTAMA, tidak perlu parsing dari spreadsheet
 */
const SCHOOL_COORDINATES = {
    '20205293': {
        lat: -6.753364479541663,
        lng: 107.44909662025468,
        radius: 100,
        name: 'SD N Pasirhalang'
    }
    // Tambahkan sekolah lainnya di sini
    // '12345678': { lat: -6.xxx, lng: 107.xxx, radius: 100, name: 'Nama Sekolah' }
};

// ==================== ENTRY POINT ====================
/**
 * Main entry point saat user akses Web App
 * URL format: https://script.google.com/macros/s/xxx/exec?npsn=20219021
 */
function doGet(e) {
    const npsn = e.parameter.npsn;

    // Validasi NPSN
    if (!npsn) {
        return HtmlService.createHtmlOutput(
            '<h1>NPSN tidak ditemukan di URL</h1>' +
            '<p>Format URL yang benar: ...exec?npsn=20219021</p>'
        );
    }

    if (!SCHOOL_REGISTRY[npsn]) {
        return HtmlService.createHtmlOutput(
            '<h1>NPSN tidak terdaftar</h1>' +
            '<p>NPSN: ' + npsn + '</p>' +
            '<p>Hubungi administrator untuk registrasi sekolah.</p>'
        );
    }

    // Load Form.html menggunakan Template untuk passing variabel
    const template = HtmlService.createTemplateFromFile('Form');
    template.npsn = npsn; // Pass NPSN ke HTML

    return template.evaluate()
        .setTitle('Sistem Absensi')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== DATA LOADING ====================
/**
 * Load school data dari spreadsheet
 * Dipanggil dari Form.html saat initial load
 * @param {string} npsn - NPSN dari URL parameter
 */
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
                message: 'NPSN tidak ditemukan. Pastikan URL berisi parameter ?npsn=...'
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
            data: resultData
        };


    } catch (error) {
        Logger.log('=== CRITICAL ERROR in getSchoolData ===');
        Logger.log('Error message: ' + error.message);
        Logger.log('Error toString: ' + error.toString());
        Logger.log('Error stack: ' + error.stack);
        return {
            success: false,
            message: 'Error: ' + error.message + ' | Cek Apps Script Executions log untuk detail lengkap'
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
        registry: Object.keys(SCHOOL_REGISTRY)
    };
}



/**
 * Load config sheet
 * PRIORITAS: Koordinat dari SCHOOL_COORDINATES (hardcoded), baru dari spreadsheet
 */
function loadConfig(ss, npsn) {
    const sheet = ss.getSheetByName('config');
    if (!sheet) {
        throw new Error('Sheet "config" tidak ditemukan. Jalankan Setup Database dulu.');
    }

    // PENTING: Gunakan getDisplayValues() untuk menjamin hasil berupa STRING
    const data = sheet.getRange('B1:B8').getDisplayValues();

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
        Logger.log('⚠️ No hardcoded coordinates found, attempting to parse from spreadsheet...');
        // Fallback: Parse dari spreadsheet (B1, B2, B3)
        const parseNum = (v) => {
            if (!v) return 0;
            let str = v.toString().trim();
            const dotCount = (str.match(/\./g) || []).length;
            if (dotCount > 1) {
                str = str.replace(/\./g, '');
                let isNegative = str.startsWith('-');
                let digits = str.replace('-', '');
                if (digits.length >= 7) {
                    let decimalPos = digits.length === 7 ? 1 : (digits.length === 8 ? 2 : 3);
                    str = digits.slice(0, decimalPos) + '.' + digits.slice(decimalPos);
                    if (isNegative) str = '-' + str;
                }
            }
            return parseFloat(str) || 0;
        };

        lat = parseNum(data[0][0]);
        lng = parseNum(data[1][0]);
        radius = parseNum(data[2][0]) || 100;
        Logger.log('  Parsed Lat: ' + lat);
        Logger.log('  Parsed Lng: ' + lng);
    }

    return {
        lat: lat,
        lng: lng,
        radius: radius,
        jamMasuk: data[3][0] || '07:00',
        jamBatasIzin: data[4][0] || '09:00',
        jamPulang: data[5][0] || '14:00',
        adminPin: String(data[6][0] || '999999'),
        namaSekolah: data[7][0] // Ambil Nama Sekolah dari B8 jika ada
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
        if (row[0]) { // Jika ada nama
            teachers.push({
                nama: row[0],
                nip: row[1],
                jabatan: row[2],
                unitKerja: row[3],
                pin: String(row[4]) // PIN pastikan string
            });
        }
    }

    return teachers;
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
            fileName
        );
        Logger.log('Blob created, Size: ' + blob.getBytes().length + ' bytes');

        // Get or create folder structure
        const folder = getOrCreatePhotoFolder(npsn);
        Logger.log('Target folder: ' + folder.getName() + ' (ID: ' + folder.getId() + ')');

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
    const yearMonth = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM');

    Logger.log('Creating folder structure: ' + rootFolderName + ' -> ' + yearMonth + ' -> NPSN-' + npsn);

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

    Logger.log('Final folder path: ' + rootFolderName + '/' + yearMonth + '/' + npsnFolderName);
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
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
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
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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
        distance: Math.round(distance)
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
            const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000 / 60);
            if (remaining > 0) {
                return {
                    valid: false,
                    message: `Akun terkunci. Coba lagi dalam ${remaining} menit.`
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

        const teacher = teachers.find(t => t.nama === userName);
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
                const lockoutTime = Date.now() + (5 * 60 * 1000);
                cache.put(lockoutKey, lockoutTime.toString(), 300);
                cache.remove(attemptKey);
                return {
                    valid: false,
                    message: 'PIN salah 3x. Akun dikunci 5 menit.'
                };
            }

            return {
                valid: false,
                message: `PIN salah. Sisa percobaan: ${3 - attempts}x`
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
    const now = new Date();
    const currentTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    return currentTime > jamMasuk;
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

        // 1. Validate PIN
        const pinResult = validatePIN(nama, pin, npsn);
        if (!pinResult.valid) {
            return { success: false, message: pinResult.message };
        }

        // 2. Validate GPS (STRICT)
        const gpsResult = validateGPS(lat, lng, config.lat, config.lng, config.radius);
        if (!gpsResult.valid) {
            return {
                success: false,
                message: `Anda berada di luar area sekolah (${gpsResult.distance}m dari sekolah). Absensi ditolak.`
            };
        }

        // 3. Check duplicate (sudah Check In hari ini?)
        const duplicate = checkDuplicateCheckIn(ss, nama);
        if (duplicate) {
            return {
                success: false,
                message: 'Anda sudah melakukan Check In hari ini.'
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
                    message: 'Upload foto gagal. Coba lagi.'
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
            '-'  // Admin name
        ]);

        return {
            success: true,
            message: `✅ Check In Berhasil!\n\nStatus: ${status}\nWaktu: ${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss')}`
        };

    } catch (error) {
        Logger.log('Check In Error: ' + error.message);
        return {
            success: false,
            message: 'Error: ' + error.message
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

        // 1. Validate PIN
        const pinResult = validatePIN(nama, pin, npsn);
        if (!pinResult.valid) {
            return { success: false, message: pinResult.message };
        }

        // 2. Check sudah Check In hari ini?
        const hasCheckedIn = checkDuplicateCheckIn(ss, nama);
        if (!hasCheckedIn) {
            return {
                success: false,
                message: 'Anda belum melakukan Check In hari ini.'
            };
        }

        // 3. Check sudah Check Out hari ini?
        const hasCheckedOut = checkDuplicateCheckOut(ss, nama);
        if (hasCheckedOut) {
            return {
                success: false,
                message: 'Anda sudah melakukan Check Out hari ini.'
            };
        }

        // 4. Save to data-absensi (GPS validation optional untuk Check Out)
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
            '-'
        ]);

        return {
            success: true,
            message: `✅ Check Out Berhasil!\n\nWaktu: ${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss')}`
        };

    } catch (error) {
        Logger.log('Check Out Error: ' + error.message);
        return {
            success: false,
            message: 'Error: ' + error.message
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

        // 1. Validate PIN
        const pinResult = validatePIN(nama, pin, npsn);
        if (!pinResult.valid) {
            return { success: false, message: pinResult.message };
        }

        // 2. Check waktu batas izin
        const now = new Date();
        const currentTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
        if (currentTime > config.jamBatasIzin) {
            return {
                success: false,
                message: `Batas waktu pengajuan izin (${config.jamBatasIzin}) sudah habis.`
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
                    message: 'Upload foto bukti gagal. Coba lagi.'
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
            '-'
        ]);

        return {
            success: true,
            message: `✅ Pengajuan Izin Berhasil!\n\nJenis: ${jenisIzin}\nWaktu: ${Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm:ss')}`
        };

    } catch (error) {
        Logger.log('Izin Error: ' + error.message);
        return {
            success: false,
            message: 'Error: ' + error.message
        };
    }
}

// ==================== DUPLICATE CHECK ====================
/**
 * Check if user already checked in today
 */
function checkDuplicateCheckIn(ss, userName) {
    const sheet = ss.getSheetByName('data-absensi');
    const data = sheet.getDataRange().getValues();
    const today = new Date().toDateString();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowDate = new Date(row[0]).toDateString();
        const rowName = row[1];
        const rowType = row[2];

        if (rowDate === today && rowName === userName && rowType === 'Check In') {
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
    const today = new Date().toDateString();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowDate = new Date(row[0]).toDateString();
        const rowName = row[1];
        const rowType = row[2];

        if (rowDate === today && rowName === userName && rowType === 'Check Out') {
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

        // Count Hadir (Check In dengan status Hadir)
        let hadir = 0;
        let izin = 0;

        const absensiData = absensiSheet.getDataRange().getValues();
        for (let i = 1; i < absensiData.length; i++) {
            const row = absensiData[i];
            const timestamp = new Date(row[0]);
            const nama = row[1];
            const tipe = row[2];
            const status = row[3];

            if (timestamp.getMonth() === currentMonth &&
                timestamp.getFullYear() === currentYear &&
                nama === userName) {

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

            if (tanggal.getMonth() === currentMonth &&
                tanggal.getFullYear() === currentYear &&
                statusHari === 'Kerja') {
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
                alpha: alpha
            }
        };

    } catch (error) {
        Logger.log('Stats Error: ' + error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

// ==================== MAIN PROCESSING ====================
/**
 * Unified attendance processing (called from Form.html)
 */
function processAttendance(data) {
    const { tipe } = data;

    if (tipe === 'Check In') {
        return processCheckIn(data);
    } else if (tipe === 'Check Out') {
        return processCheckOut(data);
    } else if (tipe === 'Izin') {
        return processIzin(data);
    } else {
        return {
            success: false,
            message: 'Tipe absensi tidak valid'
        };
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
