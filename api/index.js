const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const app = express();

app.use('/proxy/:hostname', (req, res, next) => {
  const targetHost = req.params.hostname;
  
  const proxy = createProxyMiddleware({
    target: `https://${targetHost}`,
    changeOrigin: true,
    followRedirects: true,
    // THE FIX: Strips '/proxy/google.com' so Google only sees '/'
    pathRewrite: (path) => {
        return path.replace(`/proxy/${targetHost}`, '') || '/';
    },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      proxyReq.setHeader('Referer', `https://${targetHost}/`);
      proxyReq.setHeader('Origin', `https://${targetHost}`);
    },
    onProxyRes: (proxyRes) => {
      // Deletes the security blocks
      const headersToRemove = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only'];
      headersToRemove.forEach(h => delete proxyRes.headers[h]);
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    onError: (err, req, res) => {
      res.status(500).send('BlackCosmos Tunnel Error: Target site ' + targetHost + ' is blocking the connection.');
    }
  });

  return proxy(req, res, next);
});

module.exports = app;
