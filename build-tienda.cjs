const fs = require('fs');
const path = require('path');

console.log('==================================================================');
console.log('  COMPILADOR PWA TIENDA ONLINE - LA CONSOLATA R37');
console.log('==================================================================');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'dist');
const outAssetsDir = path.join(outDir, 'assets');

fs.mkdirSync(outAssetsDir, { recursive: true });

function copyIfExists(src, dst) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    return true;
  }
  return false;
}

copyIfExists(path.join(rootDir, 'index.html'), path.join(outDir, 'index.html'));
copyIfExists(path.join(rootDir, 'index.html'), path.join(outDir, '404.html'));
copyIfExists(path.join(rootDir, 'catalogo-tienda.json'), path.join(outDir, 'catalogo-tienda.json'));
copyIfExists(path.join(rootDir, 'tienda-app.js'), path.join(outAssetsDir, 'tienda-app.js'));
copyIfExists(path.join(rootDir, 'tienda-app.js'), path.join(outDir, 'tienda-app.js'));
copyIfExists(path.join(rootDir, 'tienda-app.css'), path.join(outAssetsDir, 'tienda-app.css'));
copyIfExists(path.join(rootDir, 'tienda-app.css'), path.join(outDir, 'tienda-app.css'));

const rootAssetsDir = path.join(rootDir, 'assets');
if (fs.existsSync(rootAssetsDir)) {
  for (const f of fs.readdirSync(rootAssetsDir)) {
    const full = path.join(rootAssetsDir, f);
    if (fs.statSync(full).isFile()) {
      fs.copyFileSync(full, path.join(outAssetsDir, f));
    }
  }
}

for (const pub of ['icon.svg', 'favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'manifest.webmanifest', 'registerSW.js']) {
  copyIfExists(path.join(rootDir, pub), path.join(outDir, pub));
}

console.log('PWA build completed successfully in dist/');
