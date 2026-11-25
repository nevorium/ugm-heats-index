# Ruang Panas UGM

Peta interaktif LST dan NDVI dari raster yang tersedia di `raster-data/`. Jalankan dengan `npm install` lalu `npm run dev`. Basemap CARTO/OpenStreetMap memerlukan koneksi internet.

Raster dibaca langsung di browser dan koordinatnya ditransformasikan dari WGS 84 / UTM zona 49S. Nilai pada panel adalah sampel piksel terdekat (resolusi 30 m), bukan nilai rata-rata wilayah. Titik pengamatan merupakan contoh eksplorasi, bukan batas atau klasifikasi tutupan lahan yang tervalidasi. LST ditampilkan dalam °C sesuai rentang data; NDVI tanpa satuan.
