
/**
 * SCRIPT ADMIN DATABASE SEKOLAH (Admin_DB.GS)
 * Script ini harus DI-COPY dan DI-PASTE ke dalam File Spreadsheet Database masing-masing sekolah.
 * (Extensions > Apps Script > Paste kode ini)
 */

function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Admin Absensi')
        .addItem('Setup Database Awal (RUN FIRST)', 'setupDatabase')
        .addSeparator()
        .addItem('Generate Laporan Bulanan', 'showReportDialog')
        .addItem('Update Jadwal Kerja Bulan Depan', 'showScheduleUpdateDialog')
        .addItem('Reset Kunci Perangkat (Ganti HP)', 'resetDeviceID')
        .addSeparator()
        .addItem('Hapus Foto Lama (>30 Hari)', 'autoDeleteOldPhotos')
        .addToUi();
}

/**
 * Menampilkan Pop-up input Bulan & Tahun
 */
function showReportDialog() {
    var ui = SpreadsheetApp.getUi();
    var result = ui.prompt(
        'Filter Laporan',
        'Masukkan Bulan (1-12) dan Tahun (Contoh: 12-2024):',
        ui.ButtonSet.OK_CANCEL);

    if (result.getSelectedButton() == ui.Button.OK) {
        var text = result.getResponseText();
        var parts = text.split('-');
        if (parts.length === 2) {
            generateReport(parseInt(parts[0]), parseInt(parts[1]));
        } else {
            ui.alert('Format salah! Gunakan format BULAN-TAHUN (Contoh: 10-2024)');
        }
    }
}

/**
 * Dialog untuk update jadwal kerja
 */
function showScheduleUpdateDialog() {
    var ui = SpreadsheetApp.getUi();
    var result = ui.prompt(
        'Update Jadwal Kerja',
        'Masukkan Bulan (1-12) dan Tahun (Contoh: 1-2026 untuk Januari 2026):',
        ui.ButtonSet.OK_CANCEL);

    if (result.getSelectedButton() == ui.Button.OK) {
        var text = result.getResponseText();
        var parts = text.split('-');
        if (parts.length === 2) {
            var month = parseInt(parts[0]);
            var year = parseInt(parts[1]);
            if (month >= 1 && month <= 12) {
                updateWorkScheduleForMonth(month - 1, year); // month-1 karena 0-based
            } else {
                ui.alert('Bulan harus antara 1-12!');
            }
        } else {
            ui.alert('Format salah! Gunakan format BULAN-TAHUN (Contoh: 1-2026)');
        }
    }
}

/**
 * Logika Utama Filter & Generate Sheet Laporan
 */
function generateReport(month, year) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sourceSheet = ss.getSheetByName("data-absensi");
    if (!sourceSheet) {
        SpreadsheetApp.getUi().alert("Sheet 'data-absensi' tidak ditemukan!");
        return;
    }

    var data = sourceSheet.getDataRange().getValues();
    var reportName = "Rekap_" + month + "_" + year;

    // Hapus sheet lama jika ada
    var oldSheet = ss.getSheetByName(reportName);
    if (oldSheet) ss.deleteSheet(oldSheet);

    var newSheet = ss.insertSheet(reportName);

    // Header Laporan
    newSheet.appendRow(["REKAP ABSENSI BULAN " + month + "/" + year]);
    newSheet.appendRow(["Timestamp", "Nama Guru", "Tipe", "Status", "Alasan", "Bukti Foto"]);
    newSheet.getRange("A2:F2").setFontWeight("bold").setBackground("#e2e8f0");

    var count = 0;
    // Loop Data (Mulai baris 2)
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var timestamp = new Date(row[0]); // Kolom A

        // Cek Bulan & Tahun (JS Month mulai dari 0, jadi month-1)
        if (timestamp.getMonth() === (month - 1) && timestamp.getFullYear() === year) {
            // Salin baris ke sheet baru
            // Mapping: A->A, B->B, C->C, D->D, G->E(Alasan), F->F(Link)
            newSheet.appendRow([
                row[0], // Time
                row[1], // Nama
                row[2], // Tipe
                row[3], // Status
                row[6], // Alasan (Kolom G)
                row[5]  // Link Foto (Kolom F)
            ]);
            count++;
        }
    }

    SpreadsheetApp.getUi().alert("Laporan Selesai! Ditemukan " + count + " data.");
}

/**
 * Script Maintenance: Hapus foto lama di Drive (>3 bulan)
 * Hemat storage dengan hanya keep 3 bulan terakhir
 */
function autoDeleteOldPhotos() {
    var rootFolderName = 'Absensi-Foto';
    var rootFolder = getFolderByNameGlobal(rootFolderName);

    if (!rootFolder) {
        SpreadsheetApp.getUi().alert('⚠️ Folder "Absensi-Foto" tidak ditemukan di Drive.\n\nFoto belum diupload atau folder sudah dihapus.');
        return;
    }

    var cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3); // 3 bulan yang lalu

    var cutoffYearMonth = Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy-MM');

    var deletedCount = 0;
    var monthFolders = rootFolder.getFolders();

    while (monthFolders.hasNext()) {
        var folder = monthFolders.next();
        var folderName = folder.getName(); // Format: "2025-12"

        // Bandingkan string (karena format yyyy-MM bisa di-compare langsung)
        if (folderName < cutoffYearMonth) {
            // Trash entire folder (soft delete - masih bisa restore dari Trash)
            folder.setTrashed(true);
            deletedCount++;
            Logger.log('Deleted folder: ' + folderName);
        }
    }

    if (deletedCount > 0) {
        SpreadsheetApp.getUi().alert(
            '✅ Auto-delete selesai!\n\n' +
            'Folder yang dihapus: ' + deletedCount + '\n' +
            'Cutoff date: ' + cutoffYearMonth + '\n\n' +
            'Catatan: Folder dipindah ke Trash (bisa restore jika perlu).'
        );
    } else {
        SpreadsheetApp.getUi().alert(
            '✅ Tidak ada folder yang perlu dihapus.\n\n' +
            'Semua folder foto masih dalam rentang 3 bulan terakhir.'
        );
    }
}

/**
 * Helper: Find folder by name (global search)
 */
function getFolderByNameGlobal(name) {
    var folders = DriveApp.getFoldersByName(name);
    return folders.hasNext() ? folders.next() : null;
}

/**
 * Reset Device ID (Kunci Perangkat) untuk guru tertentu
 */
function resetDeviceID() {
    var ui = SpreadsheetApp.getUi();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("database");

    if (!sheet) {
        ui.alert("Sheet 'database' tidak ditemukan!");
        return;
    }

    var result = ui.prompt(
        'Reset Kunci Perangkat',
        'Masukkan NIP atau Nama Lengkap guru yang ingin di-reset:',
        ui.ButtonSet.OK_CANCEL);

    if (result.getSelectedButton() == ui.Button.OK) {
        var input = result.getResponseText().trim().toLowerCase();
        if (!input) return;

        var data = sheet.getDataRange().getValues();
        var found = false;

        for (var i = 1; i < data.length; i++) {
            var name = String(data[i][0]).toLowerCase();
            var nip = String(data[i][1]).toLowerCase();

            if (name === input || nip === input) {
                // Column I (Index 9) adalah DeviceID
                sheet.getRange(i + 1, 9).setValue("");
                ui.alert("✅ Kunci perangkat untuk guru '" + data[i][0] + "' berhasil dihapus.\nSekarang guru tersebut bisa login kembali di HP baru.");
                found = true;
                break;
            }
        }

        if (!found) {
            ui.alert("❌ Data guru tidak ditemukan. Pastikan NIP atau Nama yang dimasukkan benar.");
        }
    }
}

/**
 * SETUP AWAL DATABASE (Jalankan ini sekali saat pertama kali!)
 */
function setupDatabase() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Setup Sheet 'config'
    var sheetConfig = ss.getSheetByName("config");
    if (!sheetConfig) {
        sheetConfig = ss.insertSheet("config");
        sheetConfig.appendRow(["KEY", "VALUE (JANGAN UBAH POSISI INI)"]);
        sheetConfig.appendRow(["LATITUDE_SEKOLAH", "-6.873215"]); // Contoh Bandung
        sheetConfig.appendRow(["LONGITUDE_SEKOLAH", "107.587898"]);
        sheetConfig.appendRow(["RADIUS_METER", "100"]);
        sheetConfig.appendRow(["JAM_MASUK", "07:00"]);
        sheetConfig.appendRow(["JAM_BATAS_IZIN", "09:00"]);
        sheetConfig.appendRow(["JAM_PULANG", "14:00"]); // NEW: Jam minimal check out
        // sheetConfig.appendRow(["ADMIN_PIN", "999999"]); // NEW: PIN untuk admin override
        sheetConfig.appendRow(["NAMA_SEKOLAH", "SDN CONTOH"]); // Baris 8: Nama Sekolah
        sheetConfig.appendRow(["JAM_PULANG_JUMAT", "10:45"]); // Baris 9: Khusus Jumat
        sheetConfig.appendRow(["INFO_PENGUMUMAN", "Isi pengumuman di sini..."]); // Baris 10: Pesan Broadcast
        sheetConfig.appendRow(["STATUS_PENGUMUMAN", "OFF"]); // Baris 11: ON/OFF

        // Style
        sheetConfig.getRange("A1:B1").setFontWeight("bold").setBackground("#cbd5e1");
        sheetConfig.setColumnWidth(1, 180);
        sheetConfig.setColumnWidth(2, 150);
    }

    // 2. Setup Sheet 'database' (Data Guru)
    var sheetDB = ss.getSheetByName("database");
    if (!sheetDB) {
        sheetDB = ss.insertSheet("database");
        // Update Headers: Tambahkan Kolom G (Kosong/PIN) dan Kolom I (DeviceID)
        sheetDB.appendRow(["Nama Lengkap", "NIP", "Jabatan", "Unit Kerja", "Email", "Password", "PIN", "LastCheckInDate", "DeviceID"]);

        // Data Dummy (NIP sebagai identifier utama login)
        sheetDB.appendRow(["Guru Demo 1", "198001012010011001", "Guru Kelas", "Kelas 1A", "guru1@sekolah.id", "1234", "123456", "", ""]);
        sheetDB.appendRow(["Guru Demo 2", "198505052015012002", "Waka Kurikulum", "Kelas 2B", "guru2@sekolah.id", "1234", "123456", "", ""]);
        sheetDB.appendRow(["Admin Demo", "00000000", "Kepala Sekolah", "SDN Pasirhalang", "admin@sekolah.id", "1234", "123456", "", ""]);

        sheetDB.getRange("A1:I1").setFontWeight("bold").setBackground("#bbf7d0");
        sheetDB.setColumnWidth(1, 180);
        sheetDB.setColumnWidth(2, 200); // NIP
        sheetDB.setColumnWidth(3, 150);
        sheetDB.setColumnWidth(4, 150);
        sheetDB.setColumnWidth(5, 200); // Email
        sheetDB.setColumnWidth(9, 250); // DeviceID
    }

    // 3. Setup Sheet 'data-absensi'
    var sheetAbsensi = ss.getSheetByName("data-absensi");
    if (!sheetAbsensi) {
        sheetAbsensi = ss.insertSheet("data-absensi");
        sheetAbsensi.appendRow([
            "Timestamp",
            "Nama Guru",
            "Tipe",
            "Status",
            "Koordinat",
            "Link Foto",         // CHANGED: dari "Foto (Base64)" ke "Link Foto" (Drive URL)
            "Alasan",
            "Override By Admin", // NEW: Kolom H
            "Admin Name"         // NEW: Kolom I
        ]);
        sheetAbsensi.getRange("A1:I1").setFontWeight("bold").setBackground("#fef08a");
        sheetAbsensi.setColumnWidth(1, 150);
        sheetAbsensi.setColumnWidth(2, 180);
        sheetAbsensi.setColumnWidth(6, 300); // Link Foto (URL field - wider for full URL)
        sheetAbsensi.setColumnWidth(7, 200);
    }

    // 4. Setup Sheet 'jadwal-kerja' (NEW!)
    var sheetJadwal = ss.getSheetByName("jadwal-kerja");
    if (!sheetJadwal) {
        sheetJadwal = ss.insertSheet("jadwal-kerja");
        sheetJadwal.appendRow(["Tanggal", "Status", "Keterangan"]);
        sheetJadwal.getRange("A1:C1").setFontWeight("bold").setBackground("#c7d2fe");

        // Auto-populate jadwal untuk bulan berjalan (current month)
        populateWorkSchedule(sheetJadwal);

        sheetJadwal.setColumnWidth(1, 120);
        sheetJadwal.setColumnWidth(2, 100);
        sheetJadwal.setColumnWidth(3, 200);
    }

    SpreadsheetApp.getUi().alert(
        "✅ Database Berhasil Dibuat!\n\n" +
        "Sheet yang dibuat:\n" +
        "• config (Pengaturan)\n" +
        "• database (Data Guru)\n" +
        "• data-absensi (Log Kehadiran)\n" +
        "• jadwal-kerja (Kalender Kerja)\n\n" +
        "Silakan cek sheet 'config' untuk atur Lokasi & Jam!"
    );
}

/**
 * Populate jadwal-kerja dengan hari kerja otomatis
 * Auto-generate untuk bulan berjalan
 */
function populateWorkSchedule(sheet) {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth(); // 0-based (0 = Januari)

    // Start dari hari pertama bulan ini
    var firstDay = new Date(year, month, 1);
    // End di hari terakhir bulan ini
    var lastDay = new Date(year, month + 1, 0);

    var currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
        var dayOfWeek = currentDate.getDay(); // 0 = Minggu, 6 = Sabtu
        var dateStr = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        var status = "";
        var keterangan = "";

        if (dayOfWeek === 0) {
            status = "Libur";
            keterangan = "Hari Minggu";
        } else if (dayOfWeek === 6) {
            status = "Libur";
            keterangan = "Hari Sabtu";
        } else {
            status = "Kerja";
            keterangan = "-";
        }

        sheet.appendRow([dateStr, status, keterangan]);

        // Next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Apply conditional formatting
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        // Highlight "Libur" rows in light red
        var dataRange = sheet.getRange(2, 1, lastRow - 1, 3);
        var rule = SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo("Libur")
            .setBackground("#fecaca")
            .setRanges([sheet.getRange(2, 2, lastRow - 1, 1)])
            .build();
        var rules = sheet.getConditionalFormatRules();
        rules.push(rule);
        sheet.setConditionalFormatRules(rules);
    }
}

/**
 * Utility: Update Jadwal Kerja untuk bulan tertentu
 * Dipanggil manual jika admin ingin generate jadwal bulan depan
 */
function updateWorkScheduleForMonth(monthIndex, yearValue) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("jadwal-kerja");

    if (!sheet) {
        SpreadsheetApp.getUi().alert("Sheet 'jadwal-kerja' belum dibuat! Jalankan 'Setup Database Awal' dulu.");
        return;
    }

    // Clear existing data (except header)
    if (sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
    }

    // Populate with new month
    var firstDay = new Date(yearValue, monthIndex, 1);
    var lastDay = new Date(yearValue, monthIndex + 1, 0);
    var currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
        var dayOfWeek = currentDate.getDay();
        var dateStr = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        var status = (dayOfWeek === 0 || dayOfWeek === 6) ? "Libur" : "Kerja";
        var keterangan = (dayOfWeek === 0) ? "Hari Minggu" : (dayOfWeek === 6) ? "Hari Sabtu" : "-";

        sheet.appendRow([dateStr, status, keterangan]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    SpreadsheetApp.getUi().alert("Jadwal kerja berhasil diupdate untuk bulan " + (monthIndex + 1) + "/" + yearValue);
}