const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('==================================================================');
console.log('  COMPILADOR ULTRARRAPIDO PWA TIENDA ONLINE - LA CONSOLATA R35');
console.log('==================================================================');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');
const outAssetsDir = path.join(outDir, 'assets');

fs.mkdirSync(outAssetsDir, { recursive: true });

function isBufferHtml(buf) {
  if (!buf || buf.length < 20) return true;
  const head = buf.slice(0, Math.min(256, buf.length)).toString('utf-8').trimStart().toLowerCase();
  return head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('<head');
}

function isValidJsBuffer(buf) {
  return Boolean(buf && buf.length > 50000 && !isBufferHtml(buf));
}

function isValidCssBuffer(buf) {
  return Boolean(buf && buf.length > 3000 && !isBufferHtml(buf));
}

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
    VITE_ERP_API_URL: '',
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

  const baseUrl = (envVars.VITE_ERP_API_URL || '').replace(/\/$/, '');

  const candidateAssetDirs = [
    rootDir,
    path.join(rootDir, 'assets'),
    path.join(rootDir, 'dist', 'assets'),
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
      if (name === 'tienda-app.js' || (name.startsWith('index-') && name.endsWith('.js'))) {
        const buf = fs.readFileSync(fullP);
        if (isValidJsBuffer(buf)) {
          fs.writeFileSync(path.join(outAssetsDir, 'tienda-app.js'), buf);
          fs.writeFileSync(path.join(outDir, 'tienda-app.js'), buf);
          jsFileName = 'tienda-app.js';
        }
      } else if (name === 'tienda-app.css' || (name.startsWith('index-') && name.endsWith('.css'))) {
        const buf = fs.readFileSync(fullP);
        if (isValidCssBuffer(buf)) {
          fs.writeFileSync(path.join(outAssetsDir, 'tienda-app.css'), buf);
          fs.writeFileSync(path.join(outDir, 'tienda-app.css'), buf);
          cssFileName = 'tienda-app.css';
        }
      }
    }
  }

  if (!jsFileName) {
    const remoteJs = await fetchUrlBuffer(baseUrl + '/tienda-app.js');
    if (isValidJsBuffer(remoteJs)) {
      fs.writeFileSync(path.join(outAssetsDir, 'tienda-app.js'), remoteJs);
      fs.writeFileSync(path.join(outDir, 'tienda-app.js'), remoteJs);
      jsFileName = 'tienda-app.js';
    }
  }

  if (!cssFileName) {
    const remoteCss = await fetchUrlBuffer(baseUrl + '/tienda-app.css');
    if (isValidCssBuffer(remoteCss)) {
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
  const fallbackScript = "<script>\n(function(){\n  function mountAutonomousStoreIfEmpty(){\n    var root = document.getElementById('root');\n    if (!root || root.children.length > 0) return;\n    var cat = window.__CONSOLATA_INITIAL_CATALOG__;\n    var env = window.__CONSOLATA_ENV__ || {};\n    var apiBase = (env.VITE_ERP_API_URL || '').replace(/\\/$/, '');\n    function renderCatalog(data){\n      if (!data || !Array.isArray(data.products)) return;\n      var rootEl = document.getElementById('root');\n      if (!rootEl || (rootEl.children.length > 0 && !rootEl.getAttribute('data-fallback-store'))) return;\n      rootEl.setAttribute('data-fallback-store', 'true');\n      var cfg = data.storeConfig || {};\n      var prods = data.products || [];\n      var cart = {};\n      var search = '';\n      var selectedDept = 'TODOS';\n      var depts = ['TODOS'];\n      prods.forEach(function(p){\n        var d = (p.department || 'General').toUpperCase();\n        if (depts.indexOf(d) === -1) depts.push(d);\n      });\n      function fmt(n){\n        return '$ ' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n      }\n      function getUnitPrice(p, qty){\n        if (cfg.showWholesalePrices !== false && p.wholesalePrice > 0 && p.wholesaleQuantity > 1 && qty >= p.wholesaleQuantity) {\n          return Number(p.wholesalePrice);\n        }\n        return Number(p.salePrice || 0);\n      }\n      function draw(){\n        var filtered = prods.filter(function(p){\n          if (cfg.hideOutOfStock && p.usesInventory !== false && Number(p.stock || 0) <= 0) return false;\n          var matchDept = selectedDept === 'TODOS' || (p.department || 'General').toUpperCase() === selectedDept;\n          var q = search.trim().toLowerCase();\n          var matchQ = !q || (p.description || '').toLowerCase().indexOf(q) !== -1 || (p.barcode || '').toLowerCase().indexOf(q) !== -1;\n          return matchDept && matchQ;\n        });\n        var totalItems = 0;\n        var totalAmount = 0;\n        Object.keys(cart).forEach(function(id){\n          var entry = cart[id];\n          if (entry && entry.qty > 0) {\n            totalItems += entry.qty;\n            totalAmount += getUnitPrice(entry.p, entry.qty) * entry.qty;\n          }\n        });\n        var html = '<div style=\"min-height:100vh;background:#EFF2EE;color:#2D3E46;font-family:\\'Instrument Sans\\',sans-serif;\">';\n        html += '<div style=\"background:#2D3E46;color:#fff;text-align:center;padding:8px 14px;font-size:12px;font-weight:600;letter-spacing:0.04em;\">' + (cfg.bannerMessage || '🚚 Envíos en Sampacho y Zona') + '</div>';\n        html += '<header style=\"background:#fff;border-bottom:1px solid #C9D2C6;padding:18px 24px;position:sticky;top:0;z-index:30;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;\">';\n        html += '<div><h1 style=\"margin:0;font-family:\\'Piazzolla\\',serif;font-size:26px;color:#2D3E46;\">' + (cfg.storeTitle || 'LA CONSOLATA LIMPIEZA Y ANEXOS') + '</h1>';\n        html += '<p style=\"margin:3px 0 0;font-size:13px;color:#576A72;\">' + (cfg.storeSubtitle || 'Artículos de Limpieza, Perfumería, Bazar y Anexos • Mayor y Menor') + ' • ' + (cfg.address || 'PRINGLES 467, SAMPACHO, CÓRDOBA') + '</p></div>';\n        html += '<div style=\"display:flex;align-items:center;gap:10px;flex:1;max-width:460px;\">';\n        html += '<input id=\"fb-search\" type=\"search\" placeholder=\"Buscar producto o código...\" value=\"' + search.replace(/\"/g, '&quot;') + '\" style=\"flex:1;padding:10px 14px;border:1px solid #C9D2C6;border-radius:6px;font-size:14px;\" />';\n        html += '</div>';\n        html += '<button id=\"fb-whatsapp-order\" style=\"background:#2D3E46;color:#fff;border:none;padding:11px 18px;border-radius:6px;font-weight:700;cursor:pointer;font-size:14px;\">🛒 Pedido (' + totalItems + ') • ' + fmt(totalAmount) + '</button>';\n        html += '</header>';\n        html += '<div style=\"max-width:1280px;margin:0 auto;padding:20px;\">';\n        html += '<div style=\"display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;\">';\n        depts.forEach(function(d){\n          var active = d === selectedDept;\n          html += '<button data-dept=\"' + d + '\" style=\"padding:7px 14px;border-radius:4px;border:1px solid ' + (active ? '#2D3E46' : '#C9D2C6') + ';background:' + (active ? '#2D3E46' : '#fff') + ';color:' + (active ? '#fff' : '#2D3E46') + ';font-size:12px;font-weight:700;cursor:pointer;\">' + d + '</button>';\n        });\n        html += '</div>';\n        html += '<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;\">';\n        filtered.forEach(function(p){\n          var inCart = cart[p.id] ? cart[p.id].qty : 0;\n          var hasW = cfg.showWholesalePrices !== false && p.wholesalePrice > 0 && p.wholesalePrice < p.salePrice;\n          html += '<div style=\"background:#fff;border:1px solid #C9D2C6;border-radius:8px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.04);\">';\n          html += '<div>';\n          if (p.imageUrl) {\n            html += '<div style=\"height:160px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;background:#F8FAF7;border-radius:6px;overflow:hidden;\"><img src=\"' + p.imageUrl + '\" alt=\"\" style=\"max-height:150px;max-width:100%;object-fit:contain;\" /></div>';\n          } else {\n            html += '<div style=\"height:130px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;background:linear-gradient(135deg,#E5ECE6,#D5E2D8);border-radius:6px;color:#2D3E46;font-weight:800;font-size:13px;text-align:center;padding:12px;\">' + (p.department || 'LIMPIEZA') + '<br/><span style=\"font-size:11px;font-weight:500;opacity:0.75;\">Cód. ' + (p.barcode || '-') + '</span></div>';\n          }\n          html += '<div style=\"font-size:11px;font-weight:700;color:#80AA8D;text-transform:uppercase;margin-bottom:4px;\">' + (p.department || 'General') + '</div>';\n          html += '<div style=\"font-weight:700;font-size:15px;color:#2D3E46;margin-bottom:8px;min-height:40px;\">' + p.description + '</div>';\n          html += '<div style=\"font-size:22px;font-weight:800;color:#2D3E46;\">' + fmt(p.salePrice) + '</div>';\n          if (hasW) {\n            html += '<div style=\"margin-top:4px;font-size:12px;color:#1A6B54;font-weight:700;background:#E8F5E9;padding:4px 8px;border-radius:4px;display:inline-block;\">Mayorista (' + (p.wholesaleQuantity || 3) + '+ u.): ' + fmt(p.wholesalePrice) + '</div>';\n          }\n          html += '</div>';\n          html += '<div style=\"margin-top:14px;display:flex;align-items:center;gap:8px;\">';\n          if (inCart > 0) {\n            html += '<button data-dec=\"' + p.id + '\" style=\"width:36px;height:36px;border:1px solid #2D3E46;background:#fff;color:#2D3E46;font-weight:800;border-radius:6px;cursor:pointer;\">-</button>';\n            html += '<span style=\"flex:1;text-align:center;font-weight:800;font-size:15px;\">' + inCart + ' en carrito</span>';\n            html += '<button data-inc=\"' + p.id + '\" style=\"width:36px;height:36px;border:none;background:#2D3E46;color:#fff;font-weight:800;border-radius:6px;cursor:pointer;\">+</button>';\n          } else {\n            html += '<button data-inc=\"' + p.id + '\" style=\"width:100%;padding:10px;border:none;background:#80AA8D;color:#fff;font-weight:700;border-radius:6px;cursor:pointer;font-size:13px;\">+ Agregar al pedido</button>';\n          }\n          html += '</div></div>';\n        });\n        html += '</div></div></div>';\n        rootEl.innerHTML = html;\n        var sInput = document.getElementById('fb-search');\n        if (sInput) {\n          sInput.addEventListener('input', function(ev){\n            search = ev.target.value || '';\n            draw();\n            var el = document.getElementById('fb-search');\n            if (el) { el.focus(); el.setSelectionRange(search.length, search.length); }\n          });\n        }\n        rootEl.querySelectorAll('[data-dept]').forEach(function(btn){\n          btn.addEventListener('click', function(){\n            selectedDept = btn.getAttribute('data-dept') || 'TODOS';\n            draw();\n          });\n        });\n        rootEl.querySelectorAll('[data-inc]').forEach(function(btn){\n          btn.addEventListener('click', function(){\n            var pid = btn.getAttribute('data-inc');\n            var prod = prods.find(function(x){ return String(x.id) === String(pid); });\n            if (!prod) return;\n            if (!cart[pid]) cart[pid] = { p: prod, qty: 0 };\n            cart[pid].qty += 1;\n            draw();\n          });\n        });\n        rootEl.querySelectorAll('[data-dec]').forEach(function(btn){\n          btn.addEventListener('click', function(){\n            var pid = btn.getAttribute('data-dec');\n            if (cart[pid]) {\n              cart[pid].qty = Math.max(0, cart[pid].qty - 1);\n              if (cart[pid].qty === 0) delete cart[pid];\n              draw();\n            }\n          });\n        });\n        var ordBtn = document.getElementById('fb-whatsapp-order');\n        if (ordBtn) {\n          ordBtn.addEventListener('click', function(){\n            if (totalItems <= 0) return;\n            var lines = ['Hola! Quiero realizar el siguiente pedido en *' + (cfg.storeTitle || 'LA CONSOLATA') + '*:'];\n            Object.keys(cart).forEach(function(id){\n              var e = cart[id];\n              if (e && e.qty > 0) {\n                var up = getUnitPrice(e.p, e.qty);\n                lines.push('• ' + e.qty + 'x ' + e.p.description + ' (' + fmt(up * e.qty) + ')');\n              }\n            });\n            lines.push('*TOTAL: ' + fmt(totalAmount) + '*');\n            var wp = String(cfg.whatsappNumber || '5493582400000').replace(/\\D/g, '');\n            window.location.href = 'https://wa.me/' + wp + '?text=' + encodeURIComponent(lines.join('\\n'));\n          });\n        }\n      }\n      draw();\n    }\n    if (cat && Array.isArray(cat.products) && cat.products.length > 0) {\n      renderCatalog(cat);\n    } else {\n      fetch('/catalogo-tienda.json').then(function(r){ return r.json(); }).then(renderCatalog).catch(function(){\n        if (apiBase) fetch(apiBase + '/api/public/tienda/catalogo').then(function(r){ return r.json(); }).then(renderCatalog).catch(function(){});\n      });\n    }\n  }\n  setTimeout(mountAutonomousStoreIfEmpty, 1400);\n  setTimeout(mountAutonomousStoreIfEmpty, 3200);\n})();\n</script>";
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
    ${fallbackScript}
  </body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), htmlOut, 'utf-8');
  fs.writeFileSync(path.join(outDir, '404.html'), htmlOut, 'utf-8');
  console.log('✓ Build completado en /dist -> JS:', jsFileName || 'FALLBACK-AUTONOMO', '| CSS:', cssFileName || 'OK');
})();
