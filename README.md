# Ruang Panas UGM

Peta interaktif LST dan NDVI dari raster yang tersedia di `raster-data/`. Jalankan dengan `npm install` lalu `npm run dev`. Basemap citra satelit Esri World Imagery dan peta CARTO/OpenStreetMap memerlukan koneksi internet. Tombol peta dasar dan pengatur opasitas raster tersedia di kanan atas.

Raster dibaca langsung di browser dan koordinatnya ditransformasikan dari WGS 84 / UTM zona 49S. Nilai pada panel adalah sampel piksel terdekat (resolusi 30 m), bukan nilai rata-rata wilayah. Titik pengamatan merupakan contoh eksplorasi, bukan batas atau klasifikasi tutupan lahan yang tervalidasi. LST ditampilkan dalam °C sesuai rentang data; NDVI tanpa satuan.

Saat kursor berada di atas raster, batas yang menyala menunjukkan satu piksel raster 30 m, bukan batas area penggunaan lahan. Panel bawah menampilkan nilai LST dan NDVI pada piksel tersebut.

Legenda NDVI menggunakan ambang kategori yang disediakan: ≤ -0,0138 (air/area terbangun), > -0,0138–0,1275 (tanah terbuka), > 0,1275–0,2688 (vegetasi jarang), > 0,2688–0,4101 (vegetasi sedang), dan > 0,4101 (vegetasi lebat). Kategori merupakan interpretasi nilai NDVI, bukan klasifikasi tutupan lahan yang tervalidasi.

## Region buatan pengguna

Gunakan **Tandai region**, klik minimal tiga titik di peta lalu klik titik awal untuk menutup poligon. Beri nama, lalu hover region untuk melihat rata-rata LST dan NDVI dari pusat piksel 30 m yang berada di dalam poligon. Region yang terlalu kecil atau berada di luar raster mungkin tidak memiliki data. Gunakan **Edit bentuk** atau **Hapus**, lalu simpan/batalkan perubahan. Nama dapat diubah dari daftar region. Region tersimpan di localStorage browser, bukan di server atau file repository; ekspor GeoJSON untuk backup dan impor untuk memulihkannya (impor mengganti daftar yang ada). Citra satelit dilengkapi label tempat dari Esri; ketersediaan nama bangunan bergantung pada penyedia dan tingkat zoom.
