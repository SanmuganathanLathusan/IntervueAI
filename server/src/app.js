const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'IntervueAI API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', interviewRoutes);
app.use('/api/report', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Internal server error',
  });
});

module.exports = app;
