/* ==========================================================
   REPORTAR UNA MASCOTA: formulario que envía el reporte a Google Sheets
   Lo usa: reportar-mascota.html
   Necesita cargar antes: config.js, mascota-svg.js y reportes.js
   Contiene, en este orden: foto, botones de opciones, validación y envío.
   ========================================================== */

const $ = s => document.querySelector(s);
const datos = { tipo: 'perro', tamano: '', fotoDataUrl: '', paleta: [] };

/* distrito (solo del Callao) y fecha (hoy como valor inicial, sin fechas futuras) */
$('#distrito').innerHTML = opcionesDistritos('Elige el distrito');
function fechaDeHoy() { return fechaHace(0); }
function reiniciarFecha() { $('#fecha').value = fechaDeHoy(); $('#fecha').max = fechaDeHoy(); $('#fecha').min = fechaHace(60); }
reiniciarFecha();

/* ----- Foto ----- */
async function recibirFoto(archivo) {
  if (!archivo) return;
  $('#zonaSubir').classList.add('cargando');
  try {
    const f = await procesarFoto(archivo, 900);
    datos.fotoDataUrl = f.dataUrl; datos.paleta = f.paleta;
    $('#fotoPrevia').src = f.dataUrl;
    $('#colores').innerHTML = f.paleta.map(c => `<span class="punto" style="background:${c.hex}" title="Color detectado"></span>`).join('');
    $('#zonaSubir').hidden = true; $('#vistaFoto').hidden = false;
    $('#campoFoto').classList.remove('invalido');
  } catch (e) { toast(e.message); }
  finally { $('#zonaSubir').classList.remove('cargando'); $('#archivoFoto').value = ''; }
}
function quitarFoto() {
  datos.fotoDataUrl = ''; datos.paleta = [];
  $('#vistaFoto').hidden = true; $('#zonaSubir').hidden = false; $('#fotoPrevia').removeAttribute('src');
}
$('#archivoFoto').addEventListener('change', e => recibirFoto(e.target.files[0]));
$('#btnCambiarFoto').onclick = quitarFoto;

/* ----- Botones de opciones (animal y tamaño) ----- */
document.querySelectorAll('.pastilla').forEach(b => {
  b.onclick = () => {
    const g = b.dataset.grupo;
    document.querySelectorAll(`.pastilla[data-grupo="${g}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    datos[g] = b.dataset.valor;
    b.closest('.campo').classList.remove('invalido');
  };
});

/* ----- Validación ----- */
function marcar(el, texto) {
  // los campos sueltos (texto, lista, casilla) se marcan ellos mismos; el resto, todo su bloque
  if (el.matches('input, select')) (el.type === 'checkbox' ? el.closest('.casilla') : el).classList.add('mal');
  else el.closest('.campo').classList.add('invalido');
  return { el, texto };
}

function validar() {
  document.querySelectorAll('.invalido, .mal').forEach(x => x.classList.remove('invalido', 'mal'));
  const tel = $('#telefono').value.replace(/\D/g, '');
  const faltas = [];
  if (!datos.fotoDataUrl) faltas.push(marcar($('#campoFoto'), 'Agrega una foto de la mascota.'));
  if (!datos.tamano) faltas.push(marcar($('.pastilla[data-grupo="tamano"]'), 'Elige el tamaño aproximado.'));
  if (!$('#distrito').value) faltas.push(marcar($('#distrito'), 'Elige el distrito del Callao.'));
  if (!DISTRITOS.includes($('#distrito').value) && $('#distrito').value) faltas.push(marcar($('#distrito'), 'Solo recibimos reportes del Callao.'));
  if (!$('#fecha').value || $('#fecha').value > fechaDeHoy()) faltas.push(marcar($('#fecha'), 'Indica una fecha que no sea futura.'));
  if ($('#lugar').value.trim().length < 4) faltas.push(marcar($('#lugar'), 'Cuéntanos en qué lugar la viste.'));
  if (!/^9\d{8}$/.test(tel)) faltas.push(marcar($('#telefono'), 'Escribe un celular de 9 dígitos que empiece con 9.'));
  if (!$('#acepto').checked) faltas.push(marcar($('#acepto'), 'Necesitamos tu permiso para mostrar el celular.'));
  return faltas;
}

/* ----- Envío ----- */
$('#formReporte').addEventListener('submit', async e => {
  e.preventDefault();
  const faltas = validar();
  const caja = $('#error');
  if (faltas.length) {
    caja.textContent = faltas[0].texto + (faltas.length > 1 ? ` (y ${faltas.length - 1} más por completar)` : '');
    caja.hidden = false;
    faltas[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  caja.hidden = true;
  const btn = $('#btnEnviar'); btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    const r = await enviarReporte({
      tipo: datos.tipo, tamano: datos.tamano, distrito: $('#distrito').value, lugar: $('#lugar').value.trim(),
      fecha: $('#fecha').value, nota: $('#nota').value.trim(), collar: $('#collar').checked,
      nombre: $('#nombre').value.trim(), telefono: $('#telefono').value.replace(/\D/g, ''),
      paleta: datos.paleta, fotoDataUrl: datos.fotoDataUrl, web: $('#web').value
    });
    $('#graciasTexto').textContent = r.prueba
      ? 'Modo prueba: el reporte se guardó solo en este navegador. Aparecerá en “Mascotas perdidas”.'
      : 'Tu reporte ya está publicado. Si su familia la está buscando, podrá encontrarla.';
    $('#formReporte').hidden = true; $('#gracias').hidden = false;
    $('#gracias').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    caja.textContent = err.message || 'No pudimos enviar el reporte. Inténtalo otra vez.';
    caja.hidden = false;
  } finally { btn.disabled = false; btn.textContent = 'Enviar reporte'; }
});

$('#btnOtro').onclick = () => {
  $('#formReporte').reset(); quitarFoto(); reiniciarFecha();
  datos.tipo = 'perro'; datos.tamano = '';
  document.querySelectorAll('.pastilla').forEach(x => x.setAttribute('aria-pressed', x.dataset.grupo === 'tipo' && x.dataset.valor === 'perro'));
  $('#gracias').hidden = true; $('#formReporte').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* el celular se muestra con espacios: 987 654 321 */
$('#telefono').addEventListener('input', e => {
  const n = e.target.value.replace(/\D/g, '').slice(0, 9);
  e.target.value = n.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
});
