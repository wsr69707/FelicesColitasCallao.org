/* ==========================================================
   INFÓRMATE: lista de preparación de diciembre y filtro por tema
   Lo usa: informate.html
   ========================================================== */

// 1. Lista "Prepárate antes del 24 y del 31": cuenta cuántas casillas marcó la persona
const casillas = document.querySelectorAll("#listaPrevia input[type=checkbox]");

function contarListos() {
    let listos = 0;
    casillas.forEach(function (c) { if (c.checked) listos++; });
    document.getElementById("barraPrevia").style.width = (listos / casillas.length * 100) + "%";
    document.getElementById("textoPrevia").textContent = listos === casillas.length
        ? "¡Todo listo! Tu mascota está más segura 🐾"
        : listos + " de " + casillas.length + " listos";
}
casillas.forEach(function (c) { c.addEventListener("change", contarListos); });

// 2. Filtro por tema: muestra solo las entradas del tema elegido
const botones = document.querySelectorAll(".filtro-tema");
const notas = document.querySelectorAll(".nota");

botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
        const tema = boton.dataset.tema;
        let visibles = 0;
        botones.forEach(function (b) { b.setAttribute("aria-pressed", b === boton); });
        notas.forEach(function (nota) {
            const mostrar = tema === "todos" || nota.dataset.tema === tema;
            nota.hidden = !mostrar;
            if (mostrar) visibles++;
        });
        document.getElementById("sinNotas").hidden = visibles > 0;
    });
});
