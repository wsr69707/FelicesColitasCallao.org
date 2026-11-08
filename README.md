# Felices Colitas Callao

Página web de concientización y ayuda para mascotas del Callao.

## Páginas

| Página | Archivo | Menú |
|---|---|---|
| Inicio (sin pie de redes) | `index.html` | Inicio |
| Quiénes somos | `quienes-somos.html` | Quiénes somos |
| Historias felices | `historias-mascotas-felices.html` | Felices Colitas Blog > Historias felices |
| Infórmate | `informate.html` | Felices Colitas Blog > Infórmate |
| Mascotas perdidas (buscar por maqueta o por imagen) | `mascotas-perdidas-callao.html` | Ayuda > Mascotas perdidas |
| Reportar una mascota | `reportar-mascota.html` | Ayuda > Reportar una mascota |

La página se ve al **100 %** (tamaño real) y se adapta a computadora, tablet y celular con `css/adaptable.css`.

## Conectar los reportes con Google Sheets (Google Apps Script)

Mientras `js/config.js` esté vacío, la página funciona en **modo prueba**: muestra reportes de ejemplo y
guarda los reportes nuevos solo en el navegador de quien los envía. Para guardarlos de verdad:

1. Crea una **hoja de cálculo de Google** nueva (por ejemplo, "Felices Colitas - Reportes").
2. Entra a **Extensiones > Apps Script**, borra lo que haya y pega el contenido de `google-apps-script/Code.gs`. Guarda.
3. En la barra superior elige la función **`configurar`** y pulsa **Ejecutar**. Acepta los permisos
   (crea la pestaña "Reportes" con sus columnas y una carpeta de Drive para las fotos).
4. Pulsa **Implementar > Nueva implementación**, tipo **Aplicación web**:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier persona**
5. Copia la **URL de la aplicación web** (termina en `/exec`).
6. Pégala en `js/config.js`:
   ```js
   const COLITAS_API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
7. Sube los archivos a tu hosting y prueba enviando un reporte desde `reportar-mascota.html`.

**Si cambias `Code.gs`:** Implementar > Administrar implementaciones > Editar > Nueva versión (la URL no cambia).

### Cómo funciona

- **Reportar una mascota** envía la foto (ya reducida) y los datos al script. El script guarda la foto en
  Drive y una fila en la hoja: fecha, animal, tamaño, distrito, lugar, descripción, collar, contacto,
  enlace de la foto y los colores principales de la foto.
- **Mascotas perdidas** lee esa hoja y muestra los reportes. Se puede filtrar por animal, tamaño,
  distrito (solo del Callao), fecha y palabras clave, y comparar con una **maqueta** o una **imagen**.
- El parecido se calcula comparando los **colores principales** y el tamaño (no reconoce rostros ni razas).
  Siempre hay que confirmar con la foto y el lugar.
- El celular de quien reporta se muestra solo como botón de WhatsApp ("Es mi mascota"). El formulario
  pide su permiso.
- Cuando una mascota vuelva a casa, escribe **Reencontrado** en la columna `estado` de la hoja y dejará de mostrarse.

### Distritos permitidos

Bellavista, Callao (Cercado), Carmen de la Legua Reynoso, La Perla, La Punta, Mi Perú y Ventanilla.
La lista está en `js/reportes.js` (`DISTRITOS`) y en `google-apps-script/Code.gs`. El script rechaza
cualquier distrito que no esté en su lista.

### Notas

- Si tu cuenta es de una organización de Google Workspace, puede bloquear compartir archivos
  "con cualquier persona que tenga el enlace". En ese caso, usa una cuenta personal de Gmail para el script.
- Revisa la hoja de vez en cuando y borra los reportes falsos o antiguos.
