/* ==========================================================
   DIBUJOS DE MASCOTAS (formas SVG por parte del cuerpo)
   Lo usan: la maqueta de mascotas-perdidas-callao.html y los reportes de ejemplo.
   ========================================================== */
const NOMBRES = {cola:'Cola',cuerpo:'Cuerpo',anca:'Anca',pata:'Pata delantera',patitas:'Patitas',cabeza:'Cabeza',oreja:'Orejas',hocico:'Hocico',nariz:'Nariz',ojo:'Ojo'};
const ORDEN = ['cola','cuerpo','anca','pata','patitas','cabeza','oreja','hocico'];
const PESOS = {cuerpo:3,cabeza:2.5,anca:1.5,oreja:1.2,hocico:1.2,cola:1,pata:1,patitas:1,nariz:.5,ojo:.5};
const ESCALA = {pequeno:.72,mediano:.86,grande:1};
const ETIQ = {pequeno:'Pequeño',mediano:'Mediano',grande:'Grande'};
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const FORMAS = {
  perro:{
    cola:  [['path','d="M125 385 C30 395 5 300 55 245 C75 235 85 255 70 280 C65 310 90 335 135 335 Z"']],
    cuerpo:[['path','d="M150 165 C105 215 100 330 120 395 L255 395 C268 330 252 245 232 170 Z"']],
    anca:  [['ellipse','cx="150" cy="335" rx="62" ry="58"']],
    pata:  [['rect','x="212" y="245" width="42" height="155" rx="18"']],
    patitas:[['ellipse','cx="240" cy="399" rx="33" ry="13"'],['ellipse','cx="150" cy="398" rx="56" ry="13"']],
    cabeza:[['ellipse','cx="245" cy="118" rx="64" ry="56"']],
    oreja: [['path','d="M196 78 C150 82 142 160 188 178 C216 158 218 110 206 80 Z"']],
    hocico:[['rect','x="282" y="100" width="88" height="52" rx="26"']],
    ojo:   [['circle','cx="278" cy="98" r="7"']],
    nariz: [['circle','cx="364" cy="114" r="12"']],
    detalles:'<path d="M300 140 Q330 152 358 138" fill="none" stroke="#1b1b2f" stroke-width="4" stroke-linecap="round"/>'
  },
  gato:{
    cola:  [['path','d="M122 392 C25 405 0 300 60 262 C82 252 92 275 76 292 C60 325 90 355 140 350 Z"']],
    cuerpo:[['path','d="M150 195 C105 245 100 340 120 395 L258 395 C272 335 255 255 235 195 Z"']],
    anca:  [['ellipse','cx="150" cy="338" rx="60" ry="56"']],
    pata:  [['rect','x="215" y="262" width="38" height="138" rx="17"']],
    patitas:[['ellipse','cx="238" cy="399" rx="31" ry="13"'],['ellipse','cx="150" cy="398" rx="54" ry="13"']],
    cabeza:[['ellipse','cx="245" cy="140" rx="62" ry="52"']],
    oreja: [['path','d="M192 112 L196 48 L242 92 Z"'],['path','d="M250 92 L296 48 L300 118 Z"']],
    hocico:[['ellipse','cx="292" cy="156" rx="26" ry="18"']],
    ojo:   [['circle','cx="272" cy="128" r="8"']],
    nariz: [['path','d="M283 143 L301 143 L292 156 Z"']],
    detalles:'<path d="M296 168 Q300 176 310 170 M296 168 Q290 176 282 170" fill="none" stroke="#1b1b2f" stroke-width="3" stroke-linecap="round"/><path d="M310 150 l45 -10 M310 158 l48 4 M310 166 l40 16" stroke="#1b1b2f" stroke-width="2.5" stroke-linecap="round"/>'
  }
};

function trazosSVG(strokes){
  return strokes.map(s=>{
    const d = s.pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ') + (s.pts.length===1?' l0 0':'');
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}

function mascotaSVG(pet, fills, strokes, pre, tamano='grande'){
  const F = FORMAS[pet];
  let cuerpo = '', clip = '';
  const dibujar = part => F[part].forEach((e,i)=>{
    const id = `${pre}-${part}-${i}`;
    cuerpo += `<${e[0]} id="${id}" class="region" data-part="${part}" ${e[1]} fill="${fills[part]||(part==='nariz'?(pet==='perro'?'#1b1b2f':'#e0707f'):'#ffffff')}"/>`;
    clip += `<use href="#${id}"/>`;
  });
  ORDEN.forEach(dibujar);
  const pincel = `<g id="${pre}-trazos" clip-path="url(#${pre}-clip)" style="pointer-events:none">${trazosSVG(strokes)}</g>`;
  const ojoStart = cuerpo.length;
  dibujar('nariz'); dibujar('ojo');
  const ojo = cuerpo.slice(ojoStart);
  cuerpo = cuerpo.slice(0, ojoStart);
  return `<svg viewBox="0 0 400 430" xmlns="http://www.w3.org/2000/svg" style="scale:${ESCALA[tamano]};transform-origin:50% 96%" role="img" aria-label="Dibujo de ${pet} para colorear">
    <defs><clipPath id="${pre}-clip">${clip}</clipPath></defs>
    <ellipse cx="200" cy="410" rx="170" ry="12" fill="rgba(27,27,47,.08)"/>
    ${cuerpo}${pincel}${ojo}
    <g style="pointer-events:none">${F.detalles}</g>
  </svg>`;
}

