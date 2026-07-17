const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (config.clientUrl || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(config.uploadsDir));

app.use('/api', routes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const clientIndex = path.join(clientDist, 'index.html');

if (fs.existsSync(clientIndex)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      return next();
    }
    return res.sendFile(clientIndex);
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`CareerFit AI API running on port ${config.port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use. Set a different PORT in server/.env`);
    process.exit(1);
  }
  throw err;
});
