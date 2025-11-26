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
  const pixelsPerRow = Math.ceil(dimension / 8);
  const rowSize = pixelsPerRow + 1; // leading filter byte
  const data = Buffer.alloc(rowSize * dimension, 0xff);

  for (let y = 0; y < dimension; y += 1) {
    const row = Math.floor(y / scale) - margin;
    const rowOffset = y * rowSize;
    data[rowOffset] = 0; // filter type 0

    for (let x = 0; x < dimension; x += 1) {
      const col = Math.floor(x / scale) - margin;
      const isDark = row >= 0 && col >= 0 && row < size && col < size && matrix[row][col];
      if (isDark) {
        const byteIndex = rowOffset + 1 + (x >> 3);
        const bitMask = 0x80 >> (x & 7);
        data[byteIndex] &= ~bitMask;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(dimension, 0);
  ihdr.writeUInt32BE(dimension, 4);
  ihdr[8] = 1; // bit depth: 1 bit per pixel, grayscale
  ihdr[9] = 0; // color type: grayscale
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
