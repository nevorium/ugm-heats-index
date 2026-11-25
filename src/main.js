import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import './style.css';

const icon = (name, size=18) => `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
document.querySelector('#app').innerHTML = `
<header class="topbar"><div class="brand"><div class="brand-mark">${icon('layers-2',20)}</div><div><strong>RUANG PANAS</strong><span>UGM & SEKITARNYA</span></div></div><div class="top-center"><span class="live-dot"></span> EKSPLORASI DATA SPASIAL <span class="divider">/</span> YOGYAKARTA</div><div class="header-right"><span class="year-pill">DATA 2025</span><span class="header-icon">${icon('info',17)}</span></div></header>
<main class="workspace"><aside class="sidebar"><div class="sidebar-scroll"><div class="eyebrow"><span></span> URBAN HEAT ISLAND STUDY</div><h1>Melihat panas<br/>di sekitar <em>kita.</em></h1><p class="intro">Jelajahi hubungan antara suhu permukaan dan vegetasi di kawasan Universitas Gadjah Mada.</p><div class="separator"></div><div class="section-head"><div><div class="overline">EKSPLORASI PETA</div><h2>Lapisan data</h2></div>${icon('sliders-horizontal',17)}</div><p class="section-desc">Pilih data yang ingin ditampilkan pada peta.</p><div class="layer-switch"><button class="layer-btn active" data-layer="lst"><span class="layer-icon warm">${icon('thermometer',18)}</span><span><b>Suhu permukaan</b><small>Land Surface Temperature</small></span><span class="radio"></span></button><button class="layer-btn" data-layer="ndvi"><span class="layer-icon green">${icon('sprout',18)}</span><span><b>Indeks vegetasi</b><small>Normalized Difference Vegetation Index</small></span><span class="radio"></span></button></div><div class="legend"><div class="legend-top"><span id="legend-title">SUHU PERMUKAAN</span><span id="legend-unit">°C</span></div><div id="lst-legend"><div class="legend-bar" id="legend-bar"></div><div class="legend-labels"><span id="legend-min">33,6°</span><span id="legend-mid">38,5°</span><span id="legend-max">43,4°</span></div><div class="legend-caption"><span>Lebih rendah</span><span>Lebih tinggi</span></div></div><div id="ndvi-legend" class="ndvi-legend" hidden></div></div><div class="separator"></div><div class="section-head places-head"><div><div class="overline">TITIK PENGAMATAN</div><h2>Jelajahi area</h2></div><span class="count">03</span></div><p class="section-desc">Arahkan kursor ke titik untuk membandingkan nilai.</p><div id="places" class="places"></div><div class="separator"></div><div class="section-head"><div><div class="overline">AREA PILIHAN</div><h2>Region saya</h2></div><span class="count" id="region-count">00</span></div><p class="section-desc">Gambar area di peta dengan tombol poligon. Hover region untuk melihat rata-rata raster.</p><div class="region-actions"><button id="add-region">＋ Tandai region</button><button id="edit-region">Edit bentuk</button><button id="delete-region">Hapus</button></div><p class="region-help" id="region-help">Titik sudut minimal 3; klik titik pertama untuk selesai.</p><div id="regions-list" class="regions-list"></div><div class="region-files"><button id="export-regions">↓ Ekspor GeoJSON</button><label for="import-regions">↑ Impor GeoJSON</label><input id="import-regions" type="file" accept=".json,.geojson,application/json,application/geo+json" hidden></div><p class="region-note">Tersimpan di browser ini. Ekspor untuk menyimpan atau berbagi file.</p></div><div class="sidebar-bottom"><span class="bottom-logo">${icon('map',16)}</span><span>SEBUAH PETA CERITA<br/><b>Lingkungan & iklim perkotaan</b></span><span class="bottom-arrow">↗</span></div></aside>
<section class="map-area"><div id="map"></div><div class="map-top"><div class="map-title"><span class="map-title-icon">${icon('map-pin',17)}</span><div><b>Kawasan UGM</b><small>Yogyakarta, Indonesia</small></div><span class="map-title-sep"></span><span class="map-scale">7°46′ LS &nbsp; 110°22′ BT</span></div><button class="reset-button" id="reset">${icon('locate-fixed',16)} <span>Reset peta</span></button></div><div class="basemap-control"><span>PETA DASAR</span><div><button class="base-btn active" data-base="satellite">Satelit</button><button class="base-btn" data-base="street">Peta</button></div><label for="opacity">Opasitas raster <b id="opacity-value">55%</b></label><input id="opacity" type="range" min="0" max="100" value="55" aria-label="Opasitas raster"></div><div class="map-label"><span class="pulse"></span> <span id="map-layer-label">SUHU PERMUKAAN</span> <b>·</b> 2025</div><div class="map-hint">${icon('mouse-pointer-2',15)} Arahkan kursor pada raster untuk melihat data</div><div class="compare-card"><div class="card-top"><div><div class="overline">DATA DI LOKASI</div><h3 id="point-title">Arahkan ke peta</h3><p id="point-subtitle">Pilih titik atau jelajahi area raster</p></div><div class="card-symbol">${icon('crosshair',20)}</div></div><div class="card-line"></div><div class="metrics"><div class="metric"><span class="metric-label"><span class="metric-icon temp">${icon('thermometer',15)}</span> SUHU PERMUKAAN</span><div><strong id="lst-value">—</strong><span class="metric-unit"> °C</span></div><small>Land Surface Temperature</small></div><div class="metric"><span class="metric-label"><span class="metric-icon leaf">${icon('leaf',15)}</span> INDEKS VEGETASI</span><div><strong id="ndvi-value">—</strong><span class="metric-unit"> NDVI</span></div><small id="ndvi-category">Indeks kehijauan</small></div></div><div class="card-footer"><span class="status-dot"></span><span id="point-status">MENUNGGU LOKASI</span><span class="coordinates" id="coords">—</span></div></div><div class="map-credit">SUMBER DATA: RASTER LST & NDVI 2025 <span> / </span> RESOLUSI 30 M</div></section></main>`;

// Raster is in WGS 84 / UTM zone 49S; all values and marker coordinates are sampled from it.
const utm = '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs';
const toLL = (x,y) => { const [lng,lat] = proj4(utm,'WGS84',[x,y]); return [lat,lng]; };
const toUTM = (lat,lng) => proj4('WGS84',utm,[lng,lat]);
const map = L.map('map',{zoomControl:false, attributionControl:false}).setView([-7.769,110.377],14);
const basemaps = {
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19, attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'}),
  street: L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_5fkg_1_683d6727d9f52a4aa51dcaef', {maxZoom:19, attribution:'© OpenStreetMap contributors © CARTO'})
};
// Place labels stay above the raster so names remain readable on imagery.
map.createPane('placeLabels');
map.getPane('placeLabels').style.zIndex = 450;
map.getPane('placeLabels').style.pointerEvents = 'none';
const satelliteLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {pane:'placeLabels', maxZoom:19, attribution:'Labels © Esri and contributors'});
let base = 'satellite';
basemaps[base].addTo(map);
satelliteLabels.addTo(map);
document.querySelectorAll('.base-btn').forEach(button => button.addEventListener('click', () => {
  map.removeLayer(basemaps[base]); if (map.hasLayer(satelliteLabels)) map.removeLayer(satelliteLabels); base = button.dataset.base; basemaps[base].addTo(map); if(base === 'satellite') satelliteLabels.addTo(map);
  document.querySelectorAll('.base-btn').forEach(b => b.classList.toggle('active', b === button));
}));
L.control.attribution({position:'bottomright',prefix:false}).addTo(map);
L.control.zoom({position:'bottomright'}).addTo(map);
const files = ['/data/UGM_LST_2025_Urban_Heat_Island2.tif','/data/UGM_NDVI_2025_Urban_Heat_Island.tif'];
const rasters = await Promise.all(files.map(async url => {const t = await fromUrl(url); const img = await t.getImage(); return {img,values:(await img.readRasters())[0],bounds:img.getBoundingBox(),width:img.getWidth(),height:img.getHeight()};}));
const [lst,ndvi] = rasters;
function sample(r,lat,lng){const [x,y]=toUTM(lat,lng),[minX,minY,maxX,maxY]=r.bounds;const col=Math.floor((x-minX)/(maxX-minX)*r.width),row=Math.floor((maxY-y)/(maxY-minY)*r.height);if(col<0||row<0||col>=r.width||row>=r.height)return null;const v=r.values[row*r.width+col];return Number.isFinite(v)?v:null;}
function color(t,stops){t=Math.max(0,Math.min(1,t));let n=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(n)),f=n-i;return stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f));}
const ndviClasses = [
  { max: -0.0138, range: '≤ -0,0138', label: 'Air / area terbangun', color: [231, 124, 70] },
  { max: 0.1275, range: '> -0,0138 – 0,1275', label: 'Tanah terbuka', color: [241, 193, 116] },
  { max: 0.2688, range: '> 0,1275 – 0,2688', label: 'Vegetasi jarang', color: [218, 225, 155] },
  { max: 0.4101, range: '> 0,2688 – 0,4101', label: 'Vegetasi sedang', color: [132, 195, 103] },
  { max: Infinity, range: '> 0,4101', label: 'Vegetasi lebat', color: [41, 151, 75] }
];
const ndviClass = value => ndviClasses.find(item => value <= item.max);
document.querySelector('#ndvi-legend').innerHTML = ndviClasses.map(item => `<div class="ndvi-legend-row"><span class="ndvi-swatch" style="background:rgb(${item.color.join(',')})"></span><span><b>${item.range}</b><small>${item.label}</small></span></div>`).join('');
function makeOverlay(r,type){const canvas=document.createElement('canvas');canvas.width=r.width;canvas.height=r.height;const ctx=canvas.getContext('2d'),img=ctx.createImageData(r.width,r.height);const stops=[[255,234,154],[250,190,94],[238,131,69],[207,73,50],[137,39,43]];r.values.forEach((v,i)=>{if(!Number.isFinite(v))return;const rgb=type==='lst'?color((v-33.595)/9.803,stops):ndviClass(v).color;img.data.set([...rgb,255],i*4)});ctx.putImageData(img,0,0);const [x1,y1,x2,y2]=r.bounds;return L.imageOverlay(canvas.toDataURL(),[toLL(x1,y1),toLL(x2,y2)],{opacity:.55,interactive:false,className:type==='ndvi'?'ndvi-overlay':''});}
const overlays={lst:makeOverlay(lst,'lst'),ndvi:makeOverlay(ndvi,'ndvi')};overlays.lst.addTo(map);
let layer='lst';
const opacityInput = document.querySelector('#opacity');
opacityInput.addEventListener('input', () => {
  const value = Number(opacityInput.value);
  document.querySelector('#opacity-value').textContent = `${value}%`;
  Object.values(overlays).forEach(overlay => overlay.setOpacity(value / 100));
});
document.querySelectorAll('.layer-btn').forEach(btn=>btn.addEventListener('click',()=>{map.removeLayer(overlays[layer]);layer=btn.dataset.layer;overlays[layer].addTo(map);regionGroup.eachLayer(shape=>shape.bringToFront());document.querySelectorAll('.layer-btn').forEach(b=>b.classList.toggle('active',b===btn));document.querySelector('#legend-title').textContent=layer==='lst'?'SUHU PERMUKAAN':'INDEKS VEGETASI';document.querySelector('#legend-unit').textContent=layer==='lst'?'°C':'NDVI';document.querySelector('#lst-legend').hidden=layer!=='lst';document.querySelector('#ndvi-legend').hidden=layer!=='ndvi';document.querySelector('#legend-min').textContent=layer==='lst'?'33,6°':'0,03';document.querySelector('#legend-mid').textContent=layer==='lst'?'38,5°':'0,45';document.querySelector('#legend-max').textContent=layer==='lst'?'43,4°':'0,87';document.querySelector('#map-layer-label').textContent=layer==='lst'?'SUHU PERMUKAAN':'INDEKS VEGETASI';}));
// Representative raster cells, not administrative boundaries.
const places=[{name:'Built area',desc:'Area terbangun',tag:'TERBANGUN',xy:[431900,9140200],icon:'building-2'}, {name:'High vegetation',desc:'Area vegetasi tinggi',tag:'VEGETASI',xy:[431535,9141435],icon:'trees'}, {name:'Open field',desc:'Area terbuka',tag:'LAHAN TERBUKA',xy:[431100,9141900],icon:'sun'}];
// Outline the actual raster cell (30 m), rather than an inferred land-use boundary.
let highlight;
function highlightCell(lat, lng) {
  const [x, y] = toUTM(lat, lng), [minX, , , maxY] = lst.bounds;
  const col = Math.floor((x - minX) / 30), row = Math.floor((maxY - y) / 30);
  const left = minX + col * 30, top = maxY - row * 30;
  const corners = [toLL(left, top), toLL(left + 30, top), toLL(left + 30, top - 30), toLL(left, top - 30)];
  if (!highlight) highlight = L.polygon(corners, {color:'#ffffff', weight:3, fillColor:'#ffffff', fillOpacity:.22, interactive:false, className:'cell-highlight'}).addTo(map);
  else highlight.setLatLngs(corners);
}
function showPoint(lat,lng,title='Titik pada peta',subtitle='Nilai piksel raster di lokasi kursor'){const a=sample(lst,lat,lng),b=sample(ndvi,lat,lng);if(a===null||b===null)return;highlightCell(lat,lng);document.querySelector('#point-title').textContent=title;document.querySelector('#point-subtitle').textContent=subtitle;document.querySelector('#lst-value').textContent=a.toFixed(1).replace('.',',');document.querySelector('#ndvi-value').textContent=b.toFixed(4).replace('.',',');document.querySelector('#ndvi-category').textContent=ndviClass(b).label;document.querySelector('#coords').textContent=`${Math.abs(lat).toFixed(4)}° LS, ${lng.toFixed(4)}° BT`;document.querySelector('#point-status').textContent='DATA TERSEDIA';}
const placesEl=document.querySelector('#places');places.forEach((p,i)=>{const [lat,lng]=toLL(...p.xy);p.lat=lat;p.lng=lng;const marker=L.marker([lat,lng],{icon:L.divIcon({className:'custom-marker',html:`<span>${String(i+1).padStart(2,'0')}</span>`,iconSize:[36,36],iconAnchor:[18,18]})}).addTo(map);const activate=()=>{showPoint(lat,lng,p.name,p.desc);document.querySelectorAll('.place').forEach((el,j)=>el.classList.toggle('selected',i===j));};marker.on('mouseover click',activate);const button=document.createElement('button');button.className='place';button.innerHTML=`<span class="place-number">0${i+1}</span><span class="place-info"><b>${p.name}</b><small>${p.desc}</small></span><span class="place-arrow">↗</span>`;button.addEventListener('mouseenter',activate);button.addEventListener('focus',activate);button.addEventListener('click',()=>{activate();map.flyTo([lat,lng],15,{duration:.7})});placesEl.append(button);});
// Leaflet Draw lets users create and edit actual polygons instead of inferred regions.
window.L = L;
await import('leaflet-draw');
const regionGroup = L.featureGroup().addTo(map);
const storageKey = 'ugm-heat-regions-v1';
let activeRegion = null, regionMode = false, currentHandler = null;
const normalStyle = {color:'#f7fff2', weight:2, fillColor:'#3b7651', fillOpacity:.18, className:'region-shape'};
const hoverStyle = {color:'#fff', weight:4, fillColor:'#d9ffaf', fillOpacity:.35, className:'region-shape region-glow'};
const help = document.querySelector('#region-help');
function pointInRing(point, ring) {
  let inside = false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    if ((yi>point[1]) !== (yj>point[1]) && point[0] < (xj-xi)*(point[1]-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
function regionStats(shape) {
  const rings = shape.toGeoJSON().geometry.coordinates;
  let sumL=0,sumN=0,count=0;
  const [minX,, ,maxY]=lst.bounds;
  for(let row=0;row<lst.height;row++) for(let col=0;col<lst.width;col++) {
    const [lat,lng]=toLL(minX+(col+.5)*30,maxY-(row+.5)*30);
    if (!pointInRing([lng,lat],rings[0]) || rings.slice(1).some(r=>pointInRing([lng,lat],r))) continue;
    const a=lst.values[row*lst.width+col], b=sample(ndvi,lat,lng);
    if(Number.isFinite(a) && b!==null){sumL+=a;sumN+=b;count++;}
  }
  return count?{lst:sumL/count,ndvi:sumN/count,count}:null;
}
function displayRegion(shape) {
  if(highlight){map.removeLayer(highlight);highlight=null;}
  const stats=regionStats(shape);
  document.querySelector('#point-title').textContent=shape.feature.properties.name;
  document.querySelector('#point-subtitle').textContent=stats?`Rata-rata ${stats.count} piksel di dalam region`:'Tidak ada pusat piksel raster di dalam region';
  document.querySelector('#lst-value').textContent=stats?stats.lst.toFixed(1).replace('.',','):'—';
  document.querySelector('#ndvi-value').textContent=stats?stats.ndvi.toFixed(4).replace('.',','):'—';
  document.querySelector('#ndvi-category').textContent=stats?ndviClass(stats.ndvi).label:'Indeks kehijauan';
  document.querySelector('#point-status').textContent=stats?'RATA-RATA REGION':'TIDAK ADA DATA';
  document.querySelector('#coords').textContent=stats?`${stats.count} PIKSEL`:'—';
}
function attachRegion(shape, name) {
  shape.feature = {type:'Feature',properties:{name},geometry:null};
  shape.setStyle(normalStyle);
  shape.on('mouseover',()=>{if(regionMode)return;activeRegion=shape;shape.setStyle(hoverStyle);shape.bringToFront();displayRegion(shape);});
  shape.on('mouseout',()=>{if(regionMode)return;shape.setStyle(normalStyle);if(activeRegion===shape)activeRegion=null;});
  shape.on('click',()=>{if(!regionMode)displayRegion(shape);});
  regionGroup.addLayer(shape);
}
function collection() { return {type:'FeatureCollection',features:regionGroup.toGeoJSON().features}; }
function saveRegions() { try {localStorage.setItem(storageKey,JSON.stringify(collection()));} catch {help.textContent='Gagal menyimpan di browser. Ekspor GeoJSON agar data tidak hilang.';} renderRegions(); }
function renderRegions() {
  const list=document.querySelector('#regions-list');list.replaceChildren();
  const shapes=regionGroup.getLayers();document.querySelector('#region-count').textContent=String(shapes.length).padStart(2,'0');
  if(!shapes.length){const p=document.createElement('p');p.className='region-empty';p.textContent='Belum ada region yang ditandai.';list.append(p);}
  shapes.forEach(shape=>{
    const row=document.createElement('div');row.className='region-row';
    const select=document.createElement('button');select.className='region-select';select.textContent=shape.feature.properties.name;
    select.addEventListener('click',()=>{map.fitBounds(shape.getBounds(),{padding:[60,60],maxZoom:17});displayRegion(shape);});
    select.addEventListener('mouseenter',()=>{if(!regionMode){activeRegion=shape;shape.setStyle(hoverStyle);displayRegion(shape);}});
    select.addEventListener('mouseleave',()=>{if(!regionMode){activeRegion=null;shape.setStyle(normalStyle);}});
    const rename=document.createElement('button');rename.className='region-rename';rename.textContent='Ubah nama';rename.addEventListener('click',()=>{const name=prompt('Nama region:',shape.feature.properties.name);if(name?.trim()){shape.feature.properties.name=name.trim().slice(0,100);saveRegions();}});
    row.append(select,rename);list.append(row);
  });
}
function validFeature(f) {
  return f?.type==='Feature' && f.geometry?.type==='Polygon' && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length>0 && f.geometry.coordinates.every(r=>Array.isArray(r) && r.length>=4 && r.every(p=>Array.isArray(p) && p.length>=2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0])<=180 && Math.abs(p[1])<=90) && r[0][0]===r[r.length-1][0] && r[0][1]===r[r.length-1][1]);
}
function loadCollection(data) {
  if(data?.type!=='FeatureCollection' || !Array.isArray(data.features) || !data.features.every(validFeature)) throw new Error('Format harus berupa GeoJSON FeatureCollection berisi Polygon yang valid.');
  return data.features.map(f=>({layer:L.geoJSON(f).getLayers()[0], name:typeof f.properties?.name==='string' && f.properties.name.trim()?f.properties.name.trim().slice(0,100):'Region tanpa nama'}));
}
try {const saved=localStorage.getItem(storageKey);if(saved)loadCollection(JSON.parse(saved)).forEach(({layer,name})=>attachRegion(layer,name));}catch(e){help.textContent='Data region tersimpan tidak dapat dibaca. Impor kembali dari GeoJSON.';}
renderRegions();
function stopMode(revert=false){if(currentHandler){if(revert && currentHandler.revertLayers) currentHandler.revertLayers();currentHandler.disable();currentHandler=null;}regionMode=false;activeRegion=null;regionGroup.eachLayer(s=>s.setStyle(normalStyle));}
document.querySelector('#add-region').addEventListener('click',()=>{stopMode(true);toggleEditActions(false);regionMode=true;help.textContent='Klik untuk membuat titik sudut; klik titik pertama untuk selesai. Tekan Escape untuk batal.';currentHandler=new L.Draw.Polygon(map,{allowIntersection:false,showArea:true,shapeOptions:normalStyle});currentHandler.enable();});
document.querySelector('#edit-region').addEventListener('click',()=>{if(!regionGroup.getLayers().length){help.textContent='Belum ada region untuk diedit.';return;}stopMode(true);toggleEditActions(false);regionMode=true;help.textContent='Geser titik sudut. Klik “Simpan edit” untuk menyimpan atau “Batal” untuk membatalkan.';currentHandler=new L.EditToolbar.Edit(map,{featureGroup:regionGroup});currentHandler.enable();toggleEditActions(true);});
document.querySelector('#delete-region').addEventListener('click',()=>{if(!regionGroup.getLayers().length){help.textContent='Belum ada region untuk dihapus.';return;}stopMode(true);toggleEditActions(false);regionMode=true;help.textContent='Klik region yang ingin dihapus, lalu klik “Simpan edit”.';currentHandler=new L.EditToolbar.Delete(map,{featureGroup:regionGroup});currentHandler.enable();toggleEditActions(true);});
function toggleEditActions(show){document.querySelector('#region-edit-actions').hidden=!show;}
const actions=document.createElement('div');actions.id='region-edit-actions';actions.className='region-actions';actions.hidden=true;actions.innerHTML='<button id="save-edit">Simpan edit</button><button id="cancel-edit">Batal</button>';document.querySelector('#region-help').after(actions);
document.querySelector('#save-edit').addEventListener('click',()=>{if(currentHandler?.save)currentHandler.save();stopMode();toggleEditActions(false);saveRegions();help.textContent='Perubahan region disimpan di browser.';});
document.querySelector('#cancel-edit').addEventListener('click',()=>{if(currentHandler?.revertLayers)currentHandler.revertLayers();stopMode();toggleEditActions(false);renderRegions();help.textContent='Perubahan dibatalkan.';});
map.on(L.Draw.Event.CREATED,e=>{const name=prompt('Beri nama region:',`Region ${regionGroup.getLayers().length+1}`);if(name?.trim()){attachRegion(e.layer,name.trim().slice(0,100));saveRegions();help.textContent='Region tersimpan. Hover area untuk melihat data.';}else help.textContent='Region tidak disimpan karena tidak diberi nama.';stopMode();});
map.on(L.Draw.Event.DRAWSTOP,()=>{regionMode=false;currentHandler=null;});
document.querySelector('#export-regions').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(collection(),null,2)],{type:'application/geo+json'}));const a=document.createElement('a');a.href=url;a.download='region-ugm.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.querySelector('#import-regions').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const loaded=loadCollection(JSON.parse(await file.text()));if(!confirm(`Impor ${loaded.length} region dan ganti semua region yang ada?`))return;stopMode(true);toggleEditActions(false);regionGroup.clearLayers();loaded.forEach(({layer,name})=>attachRegion(layer,name));saveRegions();help.textContent=`${loaded.length} region berhasil diimpor.`;}catch(err){help.textContent=`Impor gagal: ${err.message}`;}finally{e.target.value='';}});
map.on('mousemove',e=>{if(activeRegion || regionMode) return; if(sample(lst,e.latlng.lat,e.latlng.lng)!==null){showPoint(e.latlng.lat,e.latlng.lng);document.querySelectorAll('.place').forEach(el=>el.classList.remove('selected'));} else if (highlight) { map.removeLayer(highlight); highlight = null; document.querySelector('#point-title').textContent='Di luar raster'; document.querySelector('#point-subtitle').textContent='Arahkan ke area berwarna untuk melihat data'; document.querySelector('#lst-value').textContent='—'; document.querySelector('#ndvi-value').textContent='—'; document.querySelector('#ndvi-category').textContent='Indeks kehijauan'; document.querySelector('#point-status').textContent='TIDAK ADA DATA'; document.querySelector('#coords').textContent='—'; }});
document.querySelector('#reset').addEventListener('click',()=>map.flyTo([-7.769,110.377],14,{duration:.7}));
import {createIcons, Layers2, Info, SlidersHorizontal, Thermometer, Sprout, Map, MapPin, LocateFixed, MousePointer2, Crosshair, Leaf} from 'lucide';
createIcons({icons:{Layers2,Info,SlidersHorizontal,Thermometer,Sprout,Map,MapPin,LocateFixed,MousePointer2,Crosshair,Leaf}});
