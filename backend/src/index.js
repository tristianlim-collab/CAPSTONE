import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GAOIRS API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const PORT = config.port;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚨 GAOIRS API Server                                ║
║   Geospatial Approach to Optimize                    ║
║   Incident Response System                           ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                        ║
║   Environment: ${config.nodeEnv}                      ║
║   Time: ${new Date().toLocaleString()}                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
