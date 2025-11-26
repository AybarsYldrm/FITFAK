const { createServer } = require('./src/server');

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
createServer({ port });
