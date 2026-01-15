Konsep Fitur Token Pindah Perangkat
Fitur ini seharusnya bekerja sebagai berikut:

1. Role Sistem Device Token
Pengamanan Akun: Mencegah penggunaan akun dari perangkat yang tidak dikenal
Verifikasi Identitas: Memastikan bahwa pengguna yang ingin pindah perangkat adalah pengguna yang sah
Pengawasan Keamanan: Mencegah penyalahgunaan akun oleh pihak tidak berwenang
2. Cara Kerja Fitur (Implementasi yang Disarankan)
A. Deteksi Perubahan Perangkat
Saat pengguna login, sistem membandingkan Device ID yang tersimpan di server dengan Device ID baru
Jika berbeda, sistem meminta token verifikasi
B. Permintaan Token oleh Guru
Guru menghubungi administrator/operator sekolah
Administrator menghasilkan token verifikasi untuk guru tersebut
Token dikirim ke guru melalui saluran komunikasi yang aman (WhatsApp, email, atau langsung)
C. Lokasi Input Token
Input token sebaiknya muncul setelah login berhasil tetapi sebelum data sekolah dimuat
Bisa ditampilkan dalam modal dialog yang meminta token verifikasi
Contoh flow:
Guru login dengan NIP/password
Sistem mendeteksi Device ID berbeda
Modal muncul meminta token verifikasi
Guru memasukkan token yang diterima dari admin
Jika token valid, akses diberikan dan Device ID baru diregistrasi
D. Kapan Input Token Muncul
Input token muncul ketika:
Device ID yang digunakan berbeda dari yang terdaftar di server
Ini adalah pertama kalinya pengguna login dari perangkat baru
Administrator telah menandai bahwa perlu verifikasi tambahan