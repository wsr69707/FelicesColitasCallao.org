// Lista de mascotas (cambia los nombres). Fotos: imagenes/mascotas/mascota1.jpg, mascota2.jpg ...
const nombres = ["Sami","Tom","Dusty","Nala","Hercules","Mía","Simba","Coco","Bruno","Lola",
                 "Thor","Kira","Rex","Akira","Duke","Pelusa","Zeus","Bella","Chispa","Oreo"];

// 1. MENÚ: se dibuja dentro de <div id="menu"> para no repetirlo en cada página
function crearMenu() {
    const contenedor = document.getElementById("menu");
    contenedor.innerHTML = `
        <div class="menu" id="barra-menu">
            <img src="imagenes/logo-menu.png" class="logo" alt="Logo de Felices Colitas Callao, protección de mascotas">
            <button class="boton-menu" id="boton-menu">☰</button>
            <div class="enlaces" id="enlaces">
                <ul>
                    <li><a href="index.html">Inicio</a></li>
                    <li><a href="quienes-somos.html">Quiénes somos</a></li>
                    <li class="tiene-submenu">
                        <a href="historias-mascotas-felices.html" aria-haspopup="true">Felices Colitas Blog<span class="flecha-sub" aria-hidden="true">▼</span></a>
                        <div class="submenu">
                            <ul>
                                <li><a href="historias-mascotas-felices.html">Historias felices</a></li>
                                <li><a href="informate.html">Infórmate</a></li>
                            </ul>
                        </div>
                    </li>
                    <li class="tiene-submenu">
                        <a href="mascotas-perdidas-callao.html" aria-haspopup="true">Ayuda<span class="flecha-sub" aria-hidden="true">▼</span></a>
                        <div class="submenu">
                            <ul>
                                <li><a href="mascotas-perdidas-callao.html">Mascotas perdidas</a></li>
                                <li><a href="reportar-mascota.html">Reportar una mascota</a></li>
                            </ul>
                        </div>
                    </li>
                    <li><a href="iniciosesion.html">Iniciar sesión</a></li>
                    <li><a href="contactanos.html">Contáctanos</a></li>
                </ul>
            </div>
        </div>`;

    // Marca en naranja el enlace de la página donde estás
    const paginaActual = window.location.pathname.split("/").pop() || "index.html";
    const enlaces = document.querySelectorAll("#enlaces a");
    for (const enlace of enlaces) {
        if (enlace.getAttribute("href") === paginaActual) {
            enlace.classList.add("activo");
            // si la página está dentro de un desplegable, también se marca su título (Blog o Ayuda)
            const padre = enlace.closest(".tiene-submenu");
            if (padre) padre.querySelector("a").classList.add("activo");
        }
    }

    // En tablet o pantalla táctil no existe "pasar el mouse": el primer toque abre el desplegable
    document.querySelectorAll(".tiene-submenu > a").forEach(function (enlaceSub) {
        enlaceSub.onclick = function (e) {
            const tactil = window.matchMedia("(hover: none)").matches;
            const li = enlaceSub.parentElement;
            if (tactil && window.innerWidth > 960 && !li.classList.contains("abierto-sub")) {
                e.preventDefault();
                document.querySelectorAll(".tiene-submenu.abierto-sub").forEach(function (x) { x.classList.remove("abierto-sub"); });
                li.classList.add("abierto-sub");
            }
        };
    });

    // En celular y tablet: el botón ☰ muestra u oculta los enlaces
    document.getElementById("boton-menu").onclick = function () {
        document.getElementById("enlaces").classList.toggle("abierto");
    };

    // El menú se oscurece cuando bajas la página
    window.onscroll = function () {
        document.getElementById("barra-menu").classList.toggle("menu-oscuro", window.scrollY > 10);
    };
}

// 2. REDES SOCIALES: en el pie de cada página (menos Inicio, que ya no tiene pie) y en Inicio una barra a la derecha
// Cambia los enlaces por los de Felices Colitas Callao
function crearRedes() {
    const redes = [
        { nombre: "TikTok",   imagen: "tiktok.png",   enlace: "https://www.tiktok.com/" },
        { nombre: "YouTube",  imagen: "youtube.png",  enlace: "https://www.youtube.com/" },
        { nombre: "Facebook", imagen: "facebook.png", enlace: "https://www.facebook.com/" },
        { nombre: "WhatsApp", imagen: "Whatsapp.png", enlace: "https://wa.me/51999999999" }
    ];

    let iconos = "";
    for (const red of redes) {
        iconos += `<a href="${red.enlace}" target="_blank" aria-label="${red.nombre}">
                       <img src="imagenes/${red.imagen}" alt="${red.nombre}"></a>`;
    }

    const pie = document.getElementById("pie");
    if (pie) {
        pie.innerHTML += `<div class="redes-pie">${iconos}</div>`;
    }

    if (document.body.id === "inicio") {
        document.body.innerHTML += `<div class="redes-lateral">${iconos}</div>`;
    }
}

// 3. CARRUSEL (Inicio): crea una tarjeta por mascota y activa las flechas
function crearCarrusel() {
    const pista = document.getElementById("pista");
    if (!pista) return;

    for (let i = 0; i < nombres.length; i++) {
        pista.innerHTML += `
            <div class="tarjeta">
                <img src="imagenes/mascotas/mascota${i + 1}.jpg" alt="${nombres[i]}, mascota de un integrante de Felices Colitas Callao">
                <h3>${nombres[i]}</h3>
            </div>`;
    }
    document.getElementById("flecha-izq").onclick = function () { pista.scrollBy({ left: -260, behavior: "smooth" }); };
    document.getElementById("flecha-der").onclick = function () { pista.scrollBy({ left: 260, behavior: "smooth" }); };
}

// 4. FELICES COLITAS: muestra todas las historias
function crearColitasFelices() {
    const galeria = document.getElementById("galeria");
    if (!galeria) return;

    for (let i = 0; i < nombres.length; i++) {
        galeria.innerHTML += `
            <div class="historia">
                <img src="imagenes/mascotas/mascota${i + 1}.jpg" alt="${nombres[i]}, mascota de un integrante de Felices Colitas Callao">
                <h3>${nombres[i]}</h3>
                <p>Escribe aquí la historia de ${nombres[i]} y cómo llegó a su hogar.</p>
            </div>`;
    }
}

// 5. CONTRASEÑA: mostrar u ocultar
function verClave(idClave, idIcono) {
    const clave = document.getElementById(idClave);
    const icono = document.getElementById(idIcono);
    if (clave.type === "password") {
        clave.type = "text";
        icono.src = "imagenes/ojo-abierto.png";
    } else {
        clave.type = "password";
        icono.src = "imagenes/ojo-cerrado.png";
    }
}

// 6. REGISTRO: revisa que las dos contraseñas sean iguales
function validarClaves() {
    if (document.getElementById("clave").value !== document.getElementById("confirmarclave").value) {
        alert("Las contraseñas no coinciden.");
        return false;
    }
    return true;
}

// Al cargar la página se ejecuta todo (las funciones se saltan solas si su sección no existe)
// Nota: crearRedes va primero porque reescribe el body en Inicio
window.onload = function () {
    crearRedes();
    crearMenu();
    crearCarrusel();
    crearColitasFelices();
};
