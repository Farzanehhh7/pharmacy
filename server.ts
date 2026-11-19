import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'darustan-pharmacy-platform', timestamp: new Date().toISOString() });
  });

  // Dynamic robots.txt for SEO crawlers
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /checkout',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n')
    );
  });

  // Dynamic sitemap.xml endpoint
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const staticRoutes = ['', '/shop', '/categories', '/seo-guide'];
    const urls = staticRoutes
      .map(
        (r) => `  <url>
    <loc>${baseUrl}${r}</loc>
    <lastmod>2026-11-17</lastmod>
    <changefreq>daily</changefreq>
    <priority>${r === '' ? '1.0' : '0.8'}</priority>
  </url>`
      )
      .join('\n');

    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
  });

  // Simulated Iranian Payment Gateway token initiation & verification endpoint
  app.post('/api/payment/initiate', (req, res) => {
    const { gatewayCode, amount, orderNumber } = req.body as {
      gatewayCode?: string;
      amount?: number;
      orderNumber?: string;
    };

    if (!gatewayCode || !amount || amount <= 0) {
      res.status(400).json({ ok: false, error: 'اطلاعات تراکنش نامعتبر است.' });
      return;
    }

    const prefixMap: Record<string, string> = {
      zarinpal: 'ZP-A00000000',
      mellat: 'BPM-88291',
      saman: 'SEP-49012',
      idpay: 'IDP-77310',
      cod: 'COD-TEH',
    };

    const prefix = prefixMap[gatewayCode] || 'TXN';
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const transactionRef = `${prefix}${randomDigits}`;

    res.json({
      ok: true,
      orderNumber,
      gatewayCode,
      transactionRef,
      verifiedAt: new Date().toISOString(),
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Darustan Pharmacy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
