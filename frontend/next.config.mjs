/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      // ── Gerçek Backend Proxy Kuralları ──────────────────────────────────────
      // Bu rotalar doğrudan NestJS'e gider (token zorunlu).
      { source: '/api/auth/:path*',         destination: 'http://localhost:3001/auth/:path*' },
      { source: '/api/products',            destination: 'http://localhost:3001/products' },
      { source: '/api/products/:id/price',  destination: 'http://localhost:3001/products/:id/price' },
      { source: '/api/products/:id',        destination: 'http://localhost:3001/products/:id' },
      { source: '/api/orders/:id/status',    destination: 'http://localhost:3001/orders/:id/status' },
      { source: '/api/orders/:id',           destination: 'http://localhost:3001/orders/:id' },
      { source: '/api/orders',               destination: 'http://localhost:3001/orders' },
      { source: '/api/dashboard/summary',    destination: 'http://localhost:3001/dashboard/summary' },
      { source: '/api/finance/summary',      destination: 'http://localhost:3001/finance/summary' },
      { source: '/api/finance/ledger',       destination: 'http://localhost:3001/finance/ledger' },
      { source: '/api/returns/stats',        destination: 'http://localhost:3001/returns/stats' },
      { source: '/api/returns/order/:orderNumber', destination: 'http://localhost:3001/returns/order/:orderNumber' },
      { source: '/api/returns/:id/status',   destination: 'http://localhost:3001/returns/:id/status' },
      { source: '/api/returns',              destination: 'http://localhost:3001/returns' },
      { source: '/api/integrations/:path*', destination: 'http://localhost:3001/integrations/:path*' },

      // ── AI Insights ────────────────────────────────────────────────────────
      { source: '/api/ai-insights/weekly-report',  destination: 'http://localhost:3001/ai-insights/weekly-report' },
      { source: '/api/ai-insights/return-analysis', destination: 'http://localhost:3001/ai-insights/return-analysis' },
      { source: '/api/ai-insights/ask',             destination: 'http://localhost:3001/ai-insights/ask' },
    ];
  },
};

export default nextConfig;
