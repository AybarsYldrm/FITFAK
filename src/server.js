const http = require('http');
const { URL } = require('url');
const { generateQRCode } = require('./qrcode');
const { encodePNGFromMatrix } = require('./png');

function buildResponse(text, options = {}) {
  const qr = generateQRCode(text, options.errorLevel);
  const matrix = qr.modules;
  return encodePNGFromMatrix(matrix, { scale: options.scale, margin: options.margin });
}

function createServer({ port = 3000 } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    if (!path.startsWith('/qr/')) {
      res.statusCode = 404;
      res.end('Use /qr/{text} to generate a QR code.');
      return;
    }

    const text = decodeURIComponent(path.slice(4));
    if (!text) {
      res.statusCode = 400;
      res.end('Text parameter is required.');
      return;
    }

    const scale = Number.parseInt(url.searchParams.get('scale') || '8', 10);
    const margin = Number.parseInt(url.searchParams.get('margin') || '4', 10);
    const level = url.searchParams.get('level');
    try {
      const png = buildResponse(text, {
        scale: Number.isNaN(scale) || scale <= 0 ? 8 : scale,
        margin: Number.isNaN(margin) || margin < 0 ? 4 : margin,
        errorLevel: level || undefined,
      });
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': png.length,
        'Cache-Control': 'no-store',
      });
      res.end(png);
    } catch (error) {
      res.statusCode = 500;
      res.end(`Failed to generate QR: ${error.message}`);
    }
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`QR server listening on http://localhost:${server.address().port}`);
  });
  return server;
}

module.exports = { createServer, buildResponse };
