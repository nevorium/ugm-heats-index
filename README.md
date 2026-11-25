# Ruang Panas UGM

Peta interaktif LST dan NDVI dari raster yang tersedia di `raster-data/`. Jalankan dengan `npm install` lalu `npm run dev`. Basemap citra satelit Esri World Imagery dan peta CARTO/OpenStreetMap memerlukan koneksi internet. Tombol peta dasar dan pengatur opasitas raster tersedia di kanan atas.

Raster dibaca langsung di browser dan koordinatnya ditransformasikan dari WGS 84 / UTM zona 49S. Nilai pada panel adalah sampel piksel terdekat (resolusi 30 m), bukan nilai rata-rata wilayah. Titik pengamatan merupakan contoh eksplorasi, bukan batas atau klasifikasi tutupan lahan yang tervalidasi. LST ditampilkan dalam °C sesuai rentang data; NDVI tanpa satuan.

Saat kursor berada di atas raster, batas yang menyala menunjukkan satu piksel raster 30 m, bukan batas area penggunaan lahan. Panel bawah menampilkan nilai LST dan NDVI pada piksel tersebut.
