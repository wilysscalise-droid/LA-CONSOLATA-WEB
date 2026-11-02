const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('==================================================================');
console.log('  COMPILADOR ULTRARRAPIDO PWA TIENDA ONLINE - LA CONSOLATA R32');
console.log('==================================================================');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');
const outAssetsDir = path.join(outDir, 'assets');

fs.mkdirSync(outAssetsDir, { recursive: true });

function fetchUrlBuffer(url) {
  return new Promise((resolve) => {
    try {
      https.get(url, { timeout: 15000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrlBuffer(res.headers.location).then(resolve);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

(async () => {
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

  const baseUrl = (envVars.VITE_ERP_API_URL || 'https://ais-pre-oron74v33fwvgprqtdsqts-654305302959.us-west2.run.app').replace(/\/$/, '');

  const candidateAssetDirs = [
    rootDir,
    path.join(rootDir, 'assets'),
    path.join(rootDir, 'dist-tienda', 'assets'),
    path.join(rootDir, 'dist-estatico-listo', 'assets'),
  ];

  let jsFileName = '';
  let cssFileName = '';

  for (const dir of candidateAssetDirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
      const fullP = path.join(dir, name);
      if (!fs.statSync(fullP).isFile()) continue;
      if ((name === 'tienda-app.js' || (name.startsWith('index-') && name.endsWith('.js'))) && fs.statSync(fullP).size > 1000) {
        fs.copyFileSync(fullP, path.join(outAssetsDir, 'tienda-app.js'));
        fs.copyFileSync(fullP, path.join(outDir, 'tienda-app.js'));
        jsFileName = 'tienda-app.js';
      } else if ((name === 'tienda-app.css' || (name.startsWith('index-') && name.endsWith('.css'))) && fs.statSync(fullP).size > 500) {
        fs.copyFileSync(fullP, path.join(outAssetsDir, 'tienda-app.css'));
        fs.copyFileSync(fullP, path.join(outDir, 'tienda-app.css'));
        cssFileName = 'tienda-app.css';
      }
    }
  }

  if (!jsFileName) {
    const remoteJs = await fetchUrlBuffer(baseUrl + '/tienda-app.js');
    if (remoteJs && remoteJs.length > 1000) {
      fs.writeFileSync(path.join(outAssetsDir, 'tienda-app.js'), remoteJs);
      fs.writeFileSync(path.join(outDir, 'tienda-app.js'), remoteJs);
      jsFileName = 'tienda-app.js';
    }
  }

  if (!cssFileName) {
    const remoteCss = await fetchUrlBuffer(baseUrl + '/tienda-app.css');
    if (remoteCss && remoteCss.length > 500) {
      fs.writeFileSync(path.join(outAssetsDir, 'tienda-app.css'), remoteCss);
      fs.writeFileSync(path.join(outDir, 'tienda-app.css'), remoteCss);
      cssFileName = 'tienda-app.css';
    }
  }

  let catalogObj = null;
  const localCatalogPath = path.join(rootDir, 'catalogo-tienda.json');
  if (fs.existsSync(localCatalogPath)) {
    try {
      catalogObj = JSON.parse(fs.readFileSync(localCatalogPath, 'utf-8'));
    } catch {}
  }
  if (!catalogObj || !Array.isArray(catalogObj.products) || catalogObj.products.length === 0) {
    const remoteCatBuf = await fetchUrlBuffer(baseUrl + '/api/public/tienda/catalogo');
    if (remoteCatBuf) {
      try {
        catalogObj = JSON.parse(remoteCatBuf.toString('utf-8'));
      } catch {}
    }
  }
  if (catalogObj) {
    fs.writeFileSync(path.join(outDir, 'catalogo-tienda.json'), JSON.stringify(catalogObj), 'utf-8');
  }

  const staticRoots = [rootDir, path.join(rootDir, 'public')];
  const staticExts = ['.ico', '.svg', '.png', '.webmanifest'];
  for (const sDir of staticRoots) {
    if (!fs.existsSync(sDir)) continue;
    for (const f of fs.readdirSync(sDir)) {
      const fullF = path.join(sDir, f);
      if (fs.statSync(fullF).isFile() && staticExts.some((ext) => f.endsWith(ext))) {
        fs.copyFileSync(fullF, path.join(outDir, f));
      }
    }
  }

  const envScript = '<script>window.__CONSOLATA_ENV__ = ' + JSON.stringify(envVars) + '; window.__CONSOLATA_INITIAL_CATALOG__ = ' + JSON.stringify(catalogObj || null) + ';</script>';
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
    <link rel="stylesheet" crossorigin href="/assets/${cssFileName || 'tienda-app.css'}">
    <script type="module" crossorigin src="/assets/${jsFileName || 'tienda-app.js'}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), htmlOut, 'utf-8');
  fs.writeFileSync(path.join(outDir, '404.html'), htmlOut, 'utf-8');
  console.log('✓ Build completado en /dist -> JS:', jsFileName || 'OK', '| CSS:', cssFileName || 'OK');
})();
