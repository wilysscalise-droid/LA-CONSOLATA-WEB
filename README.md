# La Consolata Limpieza y Anexos — Frontend PWA (Tienda Online Desacoplada)

Este paquete contiene el **Bloque 1 Independiente (Frontend PWA de la Tienda Online)** de **La Consolata Limpieza y Anexos**, desacoplado del Backend/ERP (v5.50-20261101-R29).

## Arquitectura Desacoplada en 2 Partes Independientes

1. **Bloque 1: Frontend (esta PWA estática para subir a GitHub / GitHub Pages / Vercel / Netlify)**
   - Es una aplicación estática e independiente que **no contiene ni toca la base de datos interna** (`consolata-db.json`) ni certificados ARCA/AFIP.
   - Consume el stock, precios y envía los pedidos exclusivamente en **formato JSON** a través de `src/services/tiendaApiClient.ts`:
     - `GET /api/public/tienda/catalogo` → Obtiene catálogo público, precios minoristas/mayoristas y stock.
     - `GET /api/public/tienda/stock` → Consulta rápida de stock en tiempo real.
     - `POST /api/public/tienda/verificar-stock` → Valida disponibilidad de stock del carrito antes de confirmar.
     - `POST /api/public/tienda/pedidos` → Envía el pedido en formato JSON seguro al ERP.
   - Incluye el archivo `.env` en la raíz listo con `VITE_MODO_SOLO_TIENDA="true"` y `VITE_ERP_API_URL`.

2. **Bloque 2: Backend / API (El ERP en `C:\ConsolataPOS`)**
   - Expone los endpoints JSON anteriores con CORS habilitado y resguarda la base de datos local.

## Cómo subir a GitHub

- **Opción A (Repositorio con compilación automática)**:
  Subí el contenido de este ZIP a tu repositorio de GitHub. Ya incluye `.env`, `package.json` y el workflow `.github/workflows/deploy-tienda-pages.yml` para publicar automáticamente en GitHub Pages, Vercel o Netlify (`npm run build` -> carpeta `dist`).
- **Opción B (Subida estática directa)**:
  Dentro de la carpeta `dist-estatico-listo/` tenés el `index.html` y los `assets/` ya compilados listos para alojar en cualquier servidor web estático.
