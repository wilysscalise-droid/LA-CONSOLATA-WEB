const fs = require('fs');
const path = require('path');

console.log('==================================================================');
console.log('  COMPILADOR ULTRARRAPIDO PWA TIENDA ONLINE - LA CONSOLATA R30');
console.log('==================================================================');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');
const outAssetsDir = path.join(outDir, 'assets');

fs.mkdirSync(outAssetsDir, { recursive: true });

// 1. Leer variables de entorno desde .env y process.env
const envVars = {
  VITE_MODO_SOLO_TIENDA: 'true',
  VITE_STORE_ONLY: 'true',
  VITE_DEFAULT_VIEW: 'tienda',
  VITE_TIENDA_SLUG: 'consolatalimpieza',
  VITE_ERP_API_URL: 'https://ais-pre-oron74v33fwvgprqtdsqts-654305302959.us-west2.run.app',
  VITE_FIREBASE_PROJECT_ID: 'angular-marking-fxctm',
  VITE_FIREBASE_APP_ID: '1:583902617780:web:7c3c93a3b31804bd3a77e1',
  VITE_FIREBASE_API_KEY: 'AIzaSyBJmooQg1-lbRswYU4PhMec5v_FhYhAxh0',
  VITE_FIREBASE_AUTH_DOMAIN: 'angular-marking-fxctm.firebaseapp.com',
  VITE_FIREBASE_FIRESTORE_DATABASE_ID: 'ai-studio-wily10sistemapun-97ebc181-c58a-419d-8470-ded038875878',
};

const envFiles = ['.env', '.env.production', '.env.local'];
for (const ef of envFiles) {
  const fullEf = path.join(rootDir, ef);
  if (fs.existsSync(fullEf)) {
    const lines = fs.readFileSync(fullEf, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key) envVars[key] = val;
      }
    }
  }
}

for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('VITE_') && v) {
    envVars[k] = v;
  }
}

// 2. Localizar bundles JS y CSS precompilados (en ./assets, ./dist-tienda/assets, ./dist-estatico-listo/assets o raíz)
const candidateAssetDirs = [
  path.join(rootDir, 'assets'),
  path.join(rootDir, 'dist-tienda', 'assets'),
  path.join(rootDir, 'dist-estatico-listo', 'assets'),
  rootDir,
];

let jsFileName = '';
let cssFileName = '';

for (const dir of candidateAssetDirs) {
  if (!fs.existsSync(dir)) continue;
  const entries = fs.readdirSync(dir);
  for (const name of entries) {
    const fullP = path.join(dir, name);
    if (!fs.statSync(fullP).isFile()) continue;
    if (name.startsWith('index-') && name.endsWith('.js')) {
      fs.copyFileSync(fullP, path.join(outAssetsDir, name));
      if (!jsFileName) jsFileName = name;
    } else if (name.startsWith('index-') && name.endsWith('.css')) {
      fs.copyFileSync(fullP, path.join(outAssetsDir, name));
      if (!cssFileName) cssFileName = name;
    }
  }
}

// Copiar archivos públicos estáticos (iconos, manifest, etc.)
const staticRoots = [rootDir, path.join(rootDir, 'public'), path.join(rootDir, 'dist-tienda'), path.join(rootDir, 'dist-estatico-listo')];
const staticExts = ['.ico', '.svg', '.png', '.webmanifest', '.json'];
for (const sDir of staticRoots) {
  if (!fs.existsSync(sDir)) continue;
  for (const f of fs.readdirSync(sDir)) {
    if (f === 'package.json' || f === 'package-lock.json' || f === 'tsconfig.json' || f === 'vercel.json' || f === 'firebase-applet-config.json') continue;
    const fullF = path.join(sDir, f);
    if (fs.statSync(fullF).isFile() && staticExts.some((ext) => f.endsWith(ext))) {
      fs.copyFileSync(fullF, path.join(outDir, f));
    }
  }
}

// 3. Generar dist/index.html con variables .env inyectadas
const envScript = '<script>window.__CONSOLATA_ENV__ = ' + JSON.stringify(envVars) + ';</script>';
const htmlOut = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0F172A" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="La Consolata" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Piazzolla:ital,opsz,wght@0,8..30,400;0,8..30,600;0,8..30,700;1,8..30,400&display=swap" rel="stylesheet" />
    <title>La Consolata Limpieza y Anexos — Tienda Online</title>
    <meta name="description" content="Tienda Online Oficial de La Consolata Limpieza y Anexos. Artículos de limpieza, perfumería, bazar y anexos por mayor y menor." />
    <meta property="og:title" content="La Consolata Limpieza y Anexos — Tienda Online" />
    <meta property="og:description" content="Hacé tu pedido online de artículos de limpieza, perfumería y bazar por mayor y menor." />
    <meta property="og:type" content="website" />
    ${envScript}
    ${cssFileName ? `<link rel="stylesheet" crossorigin href="/assets/${cssFileName}">` : ''}
    ${jsFileName ? `<script type="module" crossorigin src="/assets/${jsFileName}"></script>` : ''}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), htmlOut, 'utf-8');
fs.writeFileSync(path.join(outDir, '404.html'), htmlOut, 'utf-8');
console.log('✓ Build completado en /dist -> JS:', jsFileName || 'OK', '| CSS:', cssFileName || 'OK');
