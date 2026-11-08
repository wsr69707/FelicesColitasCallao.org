/**
 * FELICES COLITAS CALLAO - Reportes de mascotas encontradas
 * Guarda los reportes en una hoja de cálculo de Google y las fotos en Google Drive.
 *
 * Cómo usarlo (los pasos completos están en el README.md del proyecto):
 *   1. Abre tu hoja de cálculo de Google > Extensiones > Apps Script y pega este archivo.
 *   2. Ejecuta una vez la función "configurar" y acepta los permisos.
 *   3. Implementar > Nueva implementación > Aplicación web
 *        Ejecutar como: Yo      Quién tiene acceso: Cualquier persona
 *   4. Copia la URL que termina en /exec y pégala en js/config.js (COLITAS_API_URL).
 */

var NOMBRE_HOJA = 'Reportes';
var NOMBRE_CARPETA = 'Colitas Felices - Fotos de reportes';
var COLUMNAS = ['id', 'creado', 'fecha_hallazgo', 'tipo', 'tamano', 'distrito', 'lugar',
                'descripcion', 'collar', 'nombre', 'telefono', 'foto', 'paleta', 'estado'];

// Solo distritos del Callao
var DISTRITOS = ['Bellavista', 'Callao', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'];
var TIPOS = ['perro', 'gato'];
var TAMANOS = ['pequeno', 'mediano', 'grande'];
var MAX_FOTO_BYTES = 3 * 1024 * 1024;   // 3 MB (la página envía fotos de unos 200 KB)
var MAX_REPORTES_LISTA = 200;
var MAX_POR_HORA = 5;                    // reportes por celular en una hora

/* ----------------------------------------------------------
   Preparación (se ejecuta una sola vez a mano)
   ---------------------------------------------------------- */
function configurar() {
  var hoja = obtenerHoja_();
  carpetaFotos_();
  Logger.log('Listo. Hoja: "' + hoja.getName() + '". Ahora implementa como aplicación web.');
}

/* ----------------------------------------------------------
   GET: la página pide la lista de reportes
   ---------------------------------------------------------- */
function doGet(e) {
  try {
    var accion = e && e.parameter && e.parameter.action;
    if (accion !== 'list') return respuesta_({ ok: true, mensaje: 'Felices Colitas Callao: servicio de reportes activo.' });
    return respuesta_({ ok: true, reportes: listarReportes_() });
  } catch (err) {
    return respuesta_({ ok: false, error: 'No pudimos cargar los reportes.' });
  }
}

function listarReportes_() {
  var hoja = obtenerHoja_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var zona = Session.getScriptTimeZone();
  var filas = hoja.getRange(2, 1, ultima - 1, COLUMNAS.length).getValues();
  var lista = [];
  for (var i = filas.length - 1; i >= 0 && lista.length < MAX_REPORTES_LISTA; i--) {
    var f = filas[i];
    var estado = String(f[13] || 'Activo').toLowerCase();
    if (estado !== 'activo') continue;           // "Reencontrado" u otros: no se muestran
    if (!f[0] || !f[11]) continue;
    lista.push({
      id: String(f[0]),
      fecha: fechaTexto_(f[2], zona),
      tipo: String(f[3]), tamano: String(f[4]), distrito: String(f[5]), lugar: String(f[6]),
      nota: String(f[7]), collar: String(f[8]) === 'Sí', nombre: String(f[9]),
      telefono: String(f[10]).replace(/\D/g, ''), foto: String(f[11]), paleta: String(f[12])
    });
  }
  return lista;
}

function fechaTexto_(valor, zona) {
  if (valor instanceof Date) return Utilities.formatDate(valor, zona, 'yyyy-MM-dd');
  return String(valor).substring(0, 10);
}

/* ----------------------------------------------------------
   POST: la página envía un reporte nuevo
   ---------------------------------------------------------- */
function doPost(e) {
  var bloqueo = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents);

    // Campo trampa: los programas automáticos lo rellenan; se ignora sin avisar
    if (d.web) return respuesta_({ ok: true });

    var error = validar_(d);
    if (error) return respuesta_({ ok: false, error: error });

    bloqueo.waitLock(20000);
    if (superaLimite_(d.telefono)) {
      return respuesta_({ ok: false, error: 'Ya enviaste varios reportes. Inténtalo de nuevo en una hora.' });
    }

    var id = Utilities.getUuid().substring(0, 8);
    var urlFoto = guardarFoto_(d.fotoDataUrl, id);
    var hoja = obtenerHoja_();
    hoja.appendRow([
      id, new Date(), d.fecha, d.tipo, d.tamano, d.distrito, limpiar_(d.lugar, 120),
      limpiar_(d.nota, 200), d.collar ? 'Sí' : 'No', limpiar_(d.nombre, 40), String(d.telefono),
      urlFoto, JSON.stringify(paletaSegura_(d.paleta)), 'Activo'
    ]);
    return respuesta_({ ok: true, id: id });
  } catch (err) {
    return respuesta_({ ok: false, error: 'No pudimos guardar el reporte. Inténtalo otra vez.' });
  } finally {
    try { bloqueo.releaseLock(); } catch (x) { /* no tenía el bloqueo */ }
  }
}

function validar_(d) {
  if (!d || typeof d !== 'object') return 'Datos incompletos.';
  if (TIPOS.indexOf(d.tipo) < 0) return 'Elige si es perro o gato.';
  if (TAMANOS.indexOf(d.tamano) < 0) return 'Elige el tamaño.';
  if (DISTRITOS.indexOf(d.distrito) < 0) return 'Solo recibimos reportes de distritos del Callao.';
  if (String(d.lugar || '').trim().length < 4) return 'Indica el lugar donde la viste.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.fecha))) return 'La fecha no es válida.';
  var hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (d.fecha > hoy) return 'La fecha no puede ser futura.';
  if (!/^9\d{8}$/.test(String(d.telefono))) return 'El celular debe tener 9 dígitos y empezar con 9.';
  var m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+\/=]+)$/.exec(String(d.fotoDataUrl || ''));
  if (!m) return 'La foto no es válida.';
  if (m[2].length * 0.75 > MAX_FOTO_BYTES) return 'La foto es demasiado pesada.';
  return null;
}

// Quita el "=" y símbolos que Google Sheets leería como fórmula y recorta el largo
function limpiar_(texto, max) {
  var t = String(texto || '').replace(/[\r\n]+/g, ' ').trim().substring(0, max);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function paletaSegura_(paleta) {
  var salida = [];
  (Array.isArray(paleta) ? paleta : []).slice(0, 6).forEach(function (c) {
    if (c && /^#[0-9a-fA-F]{6}$/.test(c.hex) && typeof c.w === 'number') {
      salida.push({ hex: c.hex.toLowerCase(), w: Math.round(c.w * 1000) / 1000 });
    }
  });
  return salida;
}

function superaLimite_(telefono) {
  var cache = CacheService.getScriptCache();
  var clave = 'rep_' + telefono;
  var n = Number(cache.get(clave) || 0);
  if (n >= MAX_POR_HORA) return true;
  cache.put(clave, String(n + 1), 3600);
  return false;
}

/* ----------------------------------------------------------
   Hoja y Drive
   ---------------------------------------------------------- */
function obtenerHoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(NOMBRE_HOJA);
  if (!hoja) hoja = libro.insertSheet(NOMBRE_HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#F28C28').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('C:C').setNumberFormat('@');   // fecha como texto (aaaa-mm-dd)
    hoja.getRange('K:K').setNumberFormat('@');   // celular como texto
  }
  return hoja;
}

function carpetaFotos_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CARPETA_FOTOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* se vuelve a crear */ } }
  var carpeta = DriveApp.createFolder(NOMBRE_CARPETA);
  props.setProperty('CARPETA_FOTOS', carpeta.getId());
  return carpeta;
}

function guardarFoto_(dataUrl, id) {
  var m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(dataUrl);
  var tipo = m[1] === 'png' ? 'image/png' : 'image/jpeg';
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), tipo, 'reporte-' + id + (m[1] === 'png' ? '.png' : '.jpg'));
  var archivo = carpetaFotos_().createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + archivo.getId() + '&sz=w800';
}

function respuesta_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
