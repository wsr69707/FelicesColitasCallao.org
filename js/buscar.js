/* ==========================================================
   MASCOTAS PERDIDAS: buscar por maqueta o por imagen y filtrar los reportes
   Lo usa: mascotas-perdidas-callao.html
   Necesita cargar antes: config.js, mascota-svg.js y reportes.js
   Contiene, en este orden: elegir cómo buscar, maqueta (dibujo), imagen (foto),
   búsqueda, filtros y lista de reportes.
   ========================================================== */

const $ = s => document.querySelector(s);

/* ============================================================
   1) ELEGIR CÓMO BUSCAR: maqueta o imagen
   ============================================================ */
function elegirModo(modo) {
  const esMaqueta = modo === 'maqueta';
  $('#opcMaqueta').setAttribute('aria-pressed', esMaqueta);
  $('#opcImagen').setAttribute('aria-pressed', !esMaqueta);
  $('#panelMaqueta').hidden = !esMaqueta;
  $('#panelImagen').hidden = esMaqueta;
  $('#zonaBusqueda').hidden = false;
  $('#zonaBusqueda').dataset.modo = modo;
  $('#zonaBusqueda').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
$('#opcMaqueta').onclick = () => elegirModo('maqueta');
$('#opcImagen').onclick = () => elegirModo('imagen');

/* ============================================================
   MAQUETA: estado y controles del dibujo
   ============================================================ */
const PALETA = [
  ['#e0a030','Dorado'],['#ffc61a','Amarillo'],['#c58f35','Canela'],['#d8b27a','Arena'],['#f3e2bf','Crema'],['#e8742a','Naranja'],['#8a5a24','Café'],
  ['#4e3118','Chocolate'],['#1f1f24','Negro'],['#8d939c','Gris'],['#ffffff','Blanco'],['#f4a6b8','Rosado'],['#3f8f4f','Verde'],['#4aa3df','Celeste']
];

const estado = { pet:'perro', tamano:'mediano', fills:{}, strokes:[], color:'#e0a030', tool:'fill', size:16, dibujando:false };
let historial = [];

function guardarHistorial(){
  historial.push(JSON.stringify({fills:estado.fills, strokes:estado.strokes}));
  if(historial.length>60) historial.shift();
}
function deshacer(){
  const h = historial.pop();
  if(!h) return toast('No hay nada que deshacer');
  const e = JSON.parse(h); estado.fills = e.fills; estado.strokes = e.strokes; pintar();
}
function pintar(animar){
  const cont = $('#lienzo');
  cont.innerHTML = mascotaSVG(estado.pet, estado.fills, estado.strokes, 'main', estado.tamano);
  if(animar){ cont.firstElementChild.classList.add('pop'); }
}

/* paleta */
function crearPaleta(){
  const p = $('#paleta');
  PALETA.forEach(([hex,nombre])=>{
    const b = document.createElement('button');
    b.className='color'; b.style.background=hex; b.title=nombre; b.setAttribute('aria-label',nombre);
    b.dataset.hex=hex; b.setAttribute('aria-pressed', hex===estado.color);
    b.onclick=()=>elegirColor(hex);
    p.appendChild(b);
  });
}
function elegirColor(hex){
  estado.color = hex;
  document.querySelectorAll('.color').forEach(c=>c.setAttribute('aria-pressed', c.dataset.hex===hex));
  $('#colorCustom').value = hex;
}
$('#colorCustom').addEventListener('input', e=>{
  estado.color = e.target.value;
  document.querySelectorAll('.color').forEach(c=>c.setAttribute('aria-pressed','false'));
});

/* herramientas */
function elegirHerramienta(t){
  estado.tool = t;
  $('#herrRellenar').setAttribute('aria-pressed', t==='fill');
  $('#herrPincel').setAttribute('aria-pressed', t==='brush');
  $('#cajaTamano').hidden = t!=='brush';
  $('#caja').classList.toggle('pincel', t==='brush');
}
$('#herrRellenar').onclick=()=>elegirHerramienta('fill');
$('#herrPincel').onclick=()=>elegirHerramienta('brush');
$('#tamano').oninput=e=>estado.size=+e.target.value;
$('#btnDeshacer').onclick=deshacer;
$('#btnLimpiar').onclick=()=>{ guardarHistorial(); estado.fills={}; estado.strokes=[]; pintar(true); };
$('#btnQuitarPincel').onclick=()=>{ if(!estado.strokes.length) return; guardarHistorial(); estado.strokes=[]; pintar(); };

/* cambiar de mascota */
document.querySelectorAll('.btn-mascota').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.btn-mascota').forEach(x=>x.setAttribute('aria-pressed', x===b));
    estado.pet=b.dataset.pet; estado.fills={}; estado.strokes=[]; historial=[]; pintar(true);
  };
});

/* interacción con el lienzo */
const caja = $('#caja');
function puntoSVG(e){
  const svg = caja.querySelector('svg');
  const pt = svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [r.x, r.y];
}
caja.addEventListener('pointerdown', e=>{
  if(caja.classList.contains('buscando')) return;
  if(estado.tool==='fill'){
    const reg = e.target.closest('.region');
    if(!reg) return;
    guardarHistorial();
    estado.fills[reg.dataset.part] = estado.color;
    pintar(true);
  } else {
    guardarHistorial();
    estado.strokes.push({color:estado.color, size:estado.size, pts:[puntoSVG(e)]});
    estado.dibujando = true;
    caja.setPointerCapture(e.pointerId);
    actualizarTrazos();
  }
});
caja.addEventListener('pointermove', e=>{
  if(estado.dibujando){
    estado.strokes[estado.strokes.length-1].pts.push(puntoSVG(e));
    actualizarTrazos();
  }
  const reg = e.target.closest && e.target.closest('.region');
  const et = $('#etiquetaParte');
  if(reg && estado.tool==='fill'){ et.textContent = NOMBRES[reg.dataset.part]; et.classList.add('visible'); }
  else et.classList.remove('visible');
});
['pointerup','pointercancel'].forEach(ev=>caja.addEventListener(ev,()=>estado.dibujando=false));
caja.addEventListener('pointerleave',()=>$('#etiquetaParte').classList.remove('visible'));
function actualizarTrazos(){ const g=$('#main-trazos'); if(g) g.innerHTML = trazosSVG(estado.strokes); }


/* tamaño de la maqueta */
document.querySelectorAll('#panelMaqueta .btn-tam').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('#panelMaqueta .btn-tam').forEach(x=>x.setAttribute('aria-pressed', x===b));
    estado.tamano=b.dataset.tam;
    const svg=$('#lienzo svg'); if(svg) svg.style.scale=ESCALA[estado.tamano];
  };
});

/* descripción de la maqueta */
$('#comentario').addEventListener('input',e=>{ $('#contador').textContent=e.target.value.length; });

/* ============================================================
   2) IMAGEN: el usuario sube la foto de su mascota
   ============================================================ */
const img = { dataUrl:null, paleta:null, tipo:'perro', tamano:'' };

function mostrarPaleta(paleta){
  $('#coloresDetectados').innerHTML = paleta.map(c =>
    `<span class="muestra" style="--c:${c.hex}"><i></i>${Math.round(c.w*100)}%</span>`).join('');
}

async function recibirFoto(archivo){
  if(!archivo) return;
  try {
    $('#zonaSubir').classList.add('cargando');
    const f = await procesarFoto(archivo, 700);
    img.dataUrl = f.dataUrl; img.paleta = f.paleta;
    $('#fotoUsuario').src = f.dataUrl;
    mostrarPaleta(f.paleta);
    $('#zonaSubir').hidden = true; $('#vistaFoto').hidden = false;
    toast('Foto lista. Ya puedes buscar 🐾');
  } catch(e){ toast(e.message); }
  finally { $('#zonaSubir').classList.remove('cargando'); $('#archivoFoto').value=''; }
}
function quitarFoto(){
  img.dataUrl = null; img.paleta = null;
  $('#vistaFoto').hidden = true; $('#zonaSubir').hidden = false; $('#fotoUsuario').removeAttribute('src');
}
$('#archivoFoto').addEventListener('change', e => recibirFoto(e.target.files[0]));
$('#btnCambiarFoto').onclick = quitarFoto;
['dragenter','dragover'].forEach(ev => $('#zonaSubir').addEventListener(ev, e => { e.preventDefault(); $('#zonaSubir').classList.add('arrastrando'); }));
['dragleave','drop'].forEach(ev => $('#zonaSubir').addEventListener(ev, e => { e.preventDefault(); $('#zonaSubir').classList.remove('arrastrando'); }));
$('#zonaSubir').addEventListener('drop', e => recibirFoto(e.dataTransfer.files[0]));

document.querySelectorAll('.img-tipo').forEach(b=>{
  b.onclick=()=>{ document.querySelectorAll('.img-tipo').forEach(x=>x.setAttribute('aria-pressed', x===b)); img.tipo=b.dataset.pet; };
});
document.querySelectorAll('.img-tam').forEach(b=>{
  b.onclick=()=>{   // el tamaño es opcional: al tocar otra vez se quita
    const activar = b.getAttribute('aria-pressed') !== 'true';
    document.querySelectorAll('.img-tam').forEach(x=>x.setAttribute('aria-pressed', x===b && activar));
    img.tamano = activar ? b.dataset.tam : '';
  };
});
$('#comentarioImg').addEventListener('input',e=>{ $('#contadorImg').textContent=e.target.value.length; });

/* ============================================================
   3) BÚSQUEDA: compara la maqueta o la foto con los reportes
   ============================================================ */
let busqueda = null;          // lo que el usuario está buscando ahora
let TODOS = [];               // todos los reportes cargados
let limite = 12;              // cuántas tarjetas se muestran

function sacudir(btn){ btn.classList.remove('sacudir'); void btn.offsetWidth; btn.classList.add('sacudir'); }
const pasos = ['Analizando colores…','Comparando con los reportes…','Revisando los distritos del Callao…'];

function lanzarBusqueda(btn, cajaEscaner, estadoEl, datos){
  btn.disabled = true; cajaEscaner.classList.add('buscando');
  let k = 0; estadoEl.textContent = pasos[0];
  const t = setInterval(()=>{ k=(k+1)%pasos.length; estadoEl.textContent=pasos[k]; }, 700);
  setTimeout(()=>{
    clearInterval(t); cajaEscaner.classList.remove('buscando'); btn.disabled = false;
    busqueda = datos; limite = 12;
    $('#fTipo').value = datos.tipo;
    pintarLista(true);
  }, 1900);
}

$('#btnBuscar').onclick = ()=>{
  if(!Object.keys(estado.fills).length && !estado.strokes.length){
    sacudir($('#btnBuscar')); return toast('Colorea a tu mascota para poder buscar 🎨');
  }
  lanzarBusqueda($('#btnBuscar'), $('#caja'), $('#estadoBusqueda'), {
    modo:'maqueta', paleta:paletaDeMaqueta(estado.fills, estado.strokes), tipo:estado.pet,
    tamano:estado.tamano, nota:$('#comentario').value, nombre:$('#nombre').value.trim()
  });
};
$('#btnBuscarImg').onclick = ()=>{
  if(!img.paleta){ sacudir($('#btnBuscarImg')); return toast('Primero sube una foto de tu mascota 📷'); }
  lanzarBusqueda($('#btnBuscarImg'), $('#vistaFoto'), $('#estadoImg'), {
    modo:'imagen', paleta:img.paleta, tipo:img.tipo, tamano:img.tamano,
    nota:$('#comentarioImg').value, miniatura:img.dataUrl
  });
};
$('#btnQuitarBusqueda').onclick = ()=>{ busqueda = null; pintarLista(false); };

/* ============================================================
   4) FILTROS Y LISTA DE REPORTES
   ============================================================ */
$('#fDistrito').innerHTML = opcionesDistritos('Todos los distritos');

function pasaFiltros(r){
  const tipo=$('#fTipo').value, tam=$('#fTamano').value, dis=$('#fDistrito').value, dias=+$('#fFecha').value, txt=$('#fTexto').value.trim().toLowerCase();
  if(tipo && r.tipo!==tipo) return false;
  if(tam && r.tamano!==tam) return false;
  if(dis && r.distrito!==dis) return false;
  if(dias){ const lim=fechaHace(dias); if(r.fecha<lim) return false; }
  if(txt && !(`${r.lugar} ${r.nota} ${r.distrito}`.toLowerCase().includes(txt))) return false;
  return true;
}

function resumenBusqueda(){
  const b = busqueda, r = $('#resumen');
  if(!b){ r.hidden = true; return; }
  const muestra = b.modo==='imagen'
    ? `<div class="miniatura"><img src="${b.miniatura}" alt="Foto de tu mascota"></div>`
    : `<div class="miniatura miniatura-maqueta">${mascotaSVG(b.tipo, estado.fills, estado.strokes, 'res', b.tamano)}</div>`;
  const colores = prepararPaleta(b.paleta).map(c=>`<span class="punto" style="background:${c.hex}" title="${c.hex}"></span>`).join('');
  r.innerHTML = `${muestra}<div class="texto-resumen">
      <b>${b.nombre?esc(b.nombre)+': ':''}${b.modo==='imagen'?'búsqueda por imagen':'búsqueda por maqueta'}</b>
      <span>${b.tipo} ${b.tamano?ETIQ[b.tamano].toLowerCase():''} <span class="puntos">${colores}</span></span>
      ${b.nota.trim()?`<p>“${esc(b.nota.trim())}”</p>`:''}</div>`;
  r.hidden = false;
}

function pintarLista(irAResultados){
  const filtrados = TODOS.filter(pasaFiltros).map(r => ({ r, pct: busqueda ? parecido(busqueda, r) : null }));
  if(busqueda) filtrados.sort((x,y)=>y.pct-x.pct); else filtrados.sort((x,y)=> y.r.fecha.localeCompare(x.r.fecha));

  resumenBusqueda();
  $('#btnQuitarBusqueda').hidden = !busqueda;
  $('#tituloResultados').textContent = busqueda
    ? (busqueda.nombre ? `Coincidencias para ${busqueda.nombre}` : 'Coincidencias con tu mascota')
    : 'Reportes recientes en el Callao';
  $('#subResultados').textContent = busqueda
    ? (filtrados.length && filtrados[0].pct>=45
        ? 'Estos reportes se parecen más a tu mascota. Toca “Es mi mascota” para escribir a quien la encontró.'
        : 'Todavía no hay coincidencias fuertes. Estos son los más cercanos; prueba cambiar los filtros o ajustar los colores.')
    : 'Mascotas que otras personas encontraron en la calle. Usa los filtros o busca con una maqueta o una imagen.';

  const hayFiltros = ['#fTipo','#fTamano','#fDistrito','#fFecha','#fTexto'].some(s=>$(s).value);
  $('#cuenta').textContent = `${filtrados.length} ${filtrados.length===1?'reporte':'reportes'}`;
  $('#btnLimpiarFiltros').hidden = !hayFiltros;

  if(!filtrados.length){
    $('#rejilla').innerHTML = `<div class="vacio">🐾 No hay reportes con estos filtros.<br>
      <a href="reportar-mascota.html">¿Encontraste una mascota? Repórtala aquí</a></div>`;
  } else {
    $('#rejilla').innerHTML = filtrados.slice(0, limite).map((x,i)=>fichaReporte(x.r, x.pct, i)).join('');
  }
  $('#btnMas').hidden = filtrados.length <= limite;
  if(irAResultados) $('#resultados').scrollIntoView({ behavior:'smooth', block:'start' });
}

['#fTipo','#fTamano','#fDistrito','#fFecha'].forEach(s=>$(s).addEventListener('change', ()=>{ limite=12; pintarLista(false); }));
$('#fTexto').addEventListener('input', ()=>{ limite=12; pintarLista(false); });
$('#btnLimpiarFiltros').onclick = ()=>{ ['#fTipo','#fTamano','#fDistrito','#fFecha','#fTexto'].forEach(s=>$(s).value=''); limite=12; pintarLista(false); };
$('#btnMas').onclick = ()=>{ limite += 12; pintarLista(false); };

async function iniciarReportes(){
  $('#rejilla').innerHTML = '<div class="vacio">Cargando reportes…</div>';
  try {
    const { lista, prueba } = await cargarReportes();
    TODOS = lista;
    $('#avisoPrueba').hidden = !prueba;
    pintarLista(false);
  } catch(e){
    $('#rejilla').innerHTML = `<div class="vacio">No pudimos cargar los reportes. Revisa tu conexión e inténtalo otra vez.<br>
      <button class="herr" id="btnReintentar">Volver a intentar</button></div>`;
    $('#btnReintentar').onclick = iniciarReportes;
  }
}

crearPaleta();
pintar();
iniciarReportes();
if(location.hash==='#imagen') elegirModo('imagen');
if(location.hash==='#maqueta') elegirModo('maqueta');
