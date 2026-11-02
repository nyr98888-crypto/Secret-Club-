import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve("public/gems");
fs.mkdirSync(DIR, { recursive: true });

const gems = {
  "heart-sapphire.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="h1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fda4af"/><stop offset="45%" stop-color="#fb7185"/><stop offset="100%" stop-color="#e11d48"/></linearGradient>
    <linearGradient id="h2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity=".85"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M64 110 C28 84 12 62 12 40 C12 24 24 14 40 14 C50 14 58 20 64 28 C70 20 78 14 88 14 C104 14 116 24 116 40 C116 62 100 84 64 110Z" fill="url(#h1)" stroke="#fbbf24" stroke-width="4"/>
  <path d="M40 28 C48 22 56 30 64 42 C58 34 48 26 40 28Z" fill="url(#h2)"/>
  <path d="M64 48 L72 70 L56 70Z" fill="#fff" opacity=".35"/>
</svg>`,

  "star-prism.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="s1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f9a8d4"/><stop offset="25%" stop-color="#c4b5fd"/><stop offset="50%" stop-color="#7dd3fc"/><stop offset="75%" stop-color="#fde68a"/><stop offset="100%" stop-color="#f9a8d4"/></linearGradient>
  </defs>
  <path d="M64 10 L76 48 L116 48 L84 72 L96 110 L64 86 L32 110 L44 72 L12 48 L52 48Z" fill="url(#s1)" stroke="#fff" stroke-width="3"/>
  <path d="M64 28 L70 48 L58 48Z" fill="#fff" opacity=".55"/>
  <circle cx="64" cy="64" r="6" fill="#fff" opacity=".7"/>
</svg>`,

  "teardrop-emerald.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="t1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#99f6e4"/><stop offset="55%" stop-color="#2dd4bf"/><stop offset="100%" stop-color="#0f766e"/></linearGradient>
  </defs>
  <path d="M64 12 C64 12 96 48 96 76 C96 96 82 110 64 110 C46 110 32 96 32 76 C32 48 64 12 64 12Z" fill="url(#t1)" stroke="#fbbf24" stroke-width="3.5"/>
  <path d="M52 36 C58 28 64 24 64 24 C64 24 70 40 72 56 C62 48 54 42 52 36Z" fill="#fff" opacity=".45"/>
  <path d="M64 58 L74 86 L54 86Z" fill="#134e4a" opacity=".25"/>
</svg>`,

  "brilliant-diamond.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="d1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="40%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#7dd3fc"/></linearGradient>
  </defs>
  <path d="M32 44 L48 20 H80 L96 44 L64 112Z" fill="url(#d1)" stroke="#fff" stroke-width="3"/>
  <path d="M32 44 H96 L80 56 H48Z" fill="#fff" opacity=".55"/>
  <path d="M48 56 L64 112 L48 44Z" fill="#38bdf8" opacity=".25"/>
  <path d="M80 56 L64 112 L80 44Z" fill="#0ea5e9" opacity=".2"/>
  <path d="M48 20 L56 44 H40Z" fill="#fff" opacity=".7"/>
</svg>`,

  "amethyst-cushion.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="a1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e9d5ff"/><stop offset="50%" stop-color="#c084fc"/><stop offset="100%" stop-color="#7e22ce"/></linearGradient>
  </defs>
  <rect x="24" y="24" width="80" height="80" rx="14" fill="url(#a1)" stroke="#fbbf24" stroke-width="4"/>
  <path d="M40 40 L64 28 L88 40 L64 64Z" fill="#fff" opacity=".35"/>
  <path d="M40 40 L64 64 L40 88Z" fill="#6b21a8" opacity=".2"/>
  <path d="M88 40 L64 64 L88 88Z" fill="#581c87" opacity=".18"/>
  <circle cx="52" cy="48" r="5" fill="#fff" opacity=".55"/>
</svg>`,

  "daisy-blossom.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#facc15"/></linearGradient>
  </defs>
  <g fill="url(#f1)" stroke="#fbbf24" stroke-width="2.5">
    <ellipse cx="64" cy="28" rx="14" ry="22"/>
    <ellipse cx="64" cy="100" rx="14" ry="22"/>
    <ellipse cx="28" cy="64" rx="22" ry="14"/>
    <ellipse cx="100" cy="64" rx="22" ry="14"/>
    <ellipse cx="38" cy="38" rx="16" ry="20" transform="rotate(-45 38 38)"/>
    <ellipse cx="90" cy="38" rx="16" ry="20" transform="rotate(45 90 38)"/>
    <ellipse cx="38" cy="90" rx="16" ry="20" transform="rotate(45 38 90)"/>
    <ellipse cx="90" cy="90" rx="16" ry="20" transform="rotate(-45 90 90)"/>
  </g>
  <circle cx="64" cy="64" r="18" fill="#f59e0b" stroke="#fff" stroke-width="3"/>
  <circle cx="58" cy="58" r="5" fill="#fff" opacity=".6"/>
</svg>`,

  "opal-crescent.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="o1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fce7f3"/><stop offset="35%" stop-color="#e9d5ff"/><stop offset="70%" stop-color="#a5f3fc"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient>
  </defs>
  <path d="M78 18 C48 22 28 48 28 74 C28 100 50 118 78 114 C58 108 46 88 46 68 C46 44 58 26 78 18Z" fill="url(#o1)" stroke="#fbbf24" stroke-width="3.5"/>
  <circle cx="58" cy="52" r="4" fill="#fff" opacity=".7"/>
  <circle cx="48" cy="78" r="3" fill="#fff" opacity=".55"/>
</svg>`,

  "ring-pop-hex.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#db2777"/></linearGradient>
  </defs>
  <path d="M64 14 L104 38 V90 L64 114 L24 90 V38Z" fill="url(#r1)" stroke="#fbbf24" stroke-width="4"/>
  <path d="M64 28 L88 42 V70 L64 56Z" fill="#fff" opacity=".35"/>
  <path d="M64 56 L88 70 V86 L64 100Z" fill="#9d174d" opacity=".25"/>
  <circle cx="52" cy="44" r="6" fill="#fff" opacity=".5"/>
</svg>`,

  "ruby-ribbon-bow.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="b1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fecaca"/><stop offset="50%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/></linearGradient>
  </defs>
  <path d="M64 58 C40 30 12 36 18 58 C22 72 40 74 64 66 C88 74 106 72 110 58 C116 36 88 30 64 58Z" fill="url(#b1)" stroke="#fbbf24" stroke-width="3"/>
  <path d="M56 62 L48 108 L64 92 L80 108 L72 62Z" fill="url(#b1)" stroke="#fbbf24" stroke-width="2.5"/>
  <circle cx="64" cy="60" r="12" fill="#fbbf24" stroke="#fff" stroke-width="2"/>
  <path d="M58 52 C60 48 64 48 66 52" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>
</svg>`,

  "gummy-bear.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fda4af" stop-opacity=".95"/><stop offset="100%" stop-color="#fb7185" stop-opacity=".85"/></linearGradient>
  </defs>
  <ellipse cx="40" cy="34" rx="16" ry="14" fill="url(#g1)" stroke="#fbbf24" stroke-width="2"/>
  <ellipse cx="88" cy="34" rx="16" ry="14" fill="url(#g1)" stroke="#fbbf24" stroke-width="2"/>
  <ellipse cx="64" cy="58" rx="36" ry="32" fill="url(#g1)" stroke="#fbbf24" stroke-width="3"/>
  <ellipse cx="64" cy="92" rx="30" ry="24" fill="url(#g1)" stroke="#fbbf24" stroke-width="3"/>
  <circle cx="52" cy="54" r="4" fill="#831843"/>
  <circle cx="76" cy="54" r="4" fill="#831843"/>
  <ellipse cx="64" cy="66" rx="6" ry="4" fill="#be123c" opacity=".55"/>
  <path d="M40 28 L44 18 M88 28 L84 18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
</svg>`,

  "crystal-butterfly.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="w1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e9d5ff"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
    <linearGradient id="w2" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ddd6fe"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient>
  </defs>
  <ellipse cx="36" cy="48" rx="28" ry="34" fill="url(#w1)" stroke="#fbbf24" stroke-width="2.5"/>
  <ellipse cx="92" cy="48" rx="28" ry="34" fill="url(#w2)" stroke="#fbbf24" stroke-width="2.5"/>
  <ellipse cx="40" cy="86" rx="18" ry="20" fill="url(#w1)" stroke="#fbbf24" stroke-width="2"/>
  <ellipse cx="88" cy="86" rx="18" ry="20" fill="url(#w2)" stroke="#fbbf24" stroke-width="2"/>
  <rect x="58" y="36" width="12" height="60" rx="6" fill="#fbbf24"/>
  <circle cx="64" cy="32" r="8" fill="#f59e0b"/>
  <path d="M60 24 L52 12 M68 24 L76 12" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
  <path d="M28 40 L44 52 M100 40 L84 52" stroke="#fff" stroke-width="2" opacity=".45"/>
</svg>`,

  "sunburst-topaz.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="u1" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#fef3c7"/><stop offset="55%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></radialGradient>
  </defs>
  <g fill="#f59e0b" stroke="#fbbf24" stroke-width="2">
    <path d="M64 8 L70 28 L58 28Z"/><path d="M64 120 L70 100 L58 100Z"/>
    <path d="M8 64 L28 70 L28 58Z"/><path d="M120 64 L100 70 L100 58Z"/>
    <path d="M22 22 L40 36 L30 42Z"/><path d="M106 106 L88 92 L98 86Z"/>
    <path d="M106 22 L88 36 L98 42Z"/><path d="M22 106 L40 92 L30 86Z"/>
  </g>
  <circle cx="64" cy="64" r="28" fill="url(#u1)" stroke="#fff" stroke-width="3"/>
  <path d="M52 48 L64 40 L76 48 L64 64Z" fill="#fff" opacity=".4"/>
</svg>`,

  "strawberry-ruby.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="st1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#be123c"/></linearGradient>
  </defs>
  <path d="M64 118 C28 92 22 58 34 40 C42 28 54 30 64 40 C74 30 86 28 94 40 C106 58 100 92 64 118Z" fill="url(#st1)" stroke="#fbbf24" stroke-width="3"/>
  <path d="M44 36 C50 22 64 16 64 16 C64 16 78 22 84 36 C74 30 54 30 44 36Z" fill="#16a34a" stroke="#fbbf24" stroke-width="2"/>
  <circle cx="50" cy="58" r="3" fill="#fde68a"/><circle cx="72" cy="52" r="2.5" fill="#fde68a"/>
  <circle cx="60" cy="74" r="3" fill="#fde68a"/><circle cx="78" cy="78" r="2.5" fill="#fde68a"/>
  <circle cx="48" cy="88" r="2.5" fill="#fde68a"/><circle cx="66" cy="96" r="3" fill="#fde68a"/>
</svg>`,

  "disco-sphere.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="di1" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="55%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#334155"/></radialGradient>
  </defs>
  <circle cx="64" cy="64" r="46" fill="url(#di1)" stroke="#e2e8f0" stroke-width="3"/>
  <g stroke="#64748b" stroke-width="1.2" fill="none" opacity=".7">
    <ellipse cx="64" cy="64" rx="46" ry="16"/><ellipse cx="64" cy="64" rx="46" ry="32"/>
    <ellipse cx="64" cy="64" rx="16" ry="46"/><ellipse cx="64" cy="64" rx="32" ry="46"/>
    <line x1="18" y1="64" x2="110" y2="64"/><line x1="64" y1="18" x2="64" y2="110"/>
  </g>
  <rect x="48" y="36" width="10" height="10" fill="#fff" opacity=".75" transform="rotate(-12 53 41)"/>
  <rect x="70" y="52" width="9" height="9" fill="#f9a8d4" opacity=".7" transform="rotate(18 74 56)"/>
  <rect x="52" y="72" width="8" height="8" fill="#7dd3fc" opacity=".65"/>
</svg>`,

  "aqua-bubble-pearl.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="p1" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ecfeff"/><stop offset="45%" stop-color="#99f6e4"/><stop offset="100%" stop-color="#14b8a6"/></radialGradient>
  </defs>
  <circle cx="64" cy="68" r="40" fill="url(#p1)" stroke="#fbbf24" stroke-width="3.5"/>
  <circle cx="50" cy="52" r="12" fill="#fff" opacity=".55"/>
  <circle cx="74" cy="78" r="5" fill="#fff" opacity=".35"/>
  <path d="M64 18 L68 30 L80 32 L70 40 L74 52 L64 44 L54 52 L58 40 L48 32 L60 30Z" fill="#fbbf24" stroke="#fff" stroke-width="1.5"/>
</svg>`,

  "princess-marquise.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="m1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f5d0fe"/><stop offset="45%" stop-color="#e879f9"/><stop offset="100%" stop-color="#a21caf"/></linearGradient>
  </defs>
  <path d="M64 10 C78 36 118 50 118 64 C118 78 78 92 64 118 C50 92 10 78 10 64 C10 50 50 36 64 10Z" fill="url(#m1)" stroke="#fbbf24" stroke-width="3.5"/>
  <path d="M64 28 C72 44 96 54 96 64 C80 58 70 48 64 28Z" fill="#fff" opacity=".4"/>
  <path d="M64 48 L74 64 L64 80 L54 64Z" fill="#86198f" opacity=".22"/>
  <circle cx="52" cy="56" r="4" fill="#fff" opacity=".55"/>
</svg>`,
};

for (const [name, svg] of Object.entries(gems)) {
  fs.writeFileSync(path.join(DIR, name), svg.trim() + "\n");
  console.log("wrote", name);
}
console.log("done", Object.keys(gems).length);
