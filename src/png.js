const zlib = require('zlib');

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (~crc) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcValue, 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePNGFromMatrix(matrix, { scale = 8, margin = 4 } = {}) {
  const size = matrix.length;
  const dimension = (size + margin * 2) * scale;
  const rowSize = dimension * 4 + 1;
  const data = Buffer.alloc(rowSize * dimension, 0xff);

  for (let y = 0; y < dimension; y += 1) {
    const row = Math.floor(y / scale) - margin;
    data[y * rowSize] = 0; // filter type 0
    for (let x = 0; x < dimension; x += 1) {
      const col = Math.floor(x / scale) - margin;
      const offset = y * rowSize + 1 + x * 4;
      const isDark = row >= 0 && col >= 0 && row < size && col < size && matrix[row][col];
      const value = isDark ? 0x00 : 0xff;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(dimension, 0);
  ihdr.writeUInt32BE(dimension, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(data);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    pngSignature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

module.exports = { encodePNGFromMatrix };
