import express from 'express';
import { requestLoggingMiddleware } from './src/middleware/logging.js';
import { notFoundHandler } from './src/middleware/errorHandler.js';
import { healthCheck } from './src/controllers/health.js';
import { getModifiedOpenIDConfiguration } from './src/controllers/openid.js';
import { getUserinfo } from './src/controllers/userinfo.js';
import { setupGracefulShutdown } from './src/utils/gracefulShutdown.js';

const app = express();
const PORT = process.env.PORT || 8060;

// Trust proxy for proper IP logging
app.set('trust proxy', true);

// Middleware to parse JSON bodies
app.use(express.json());

// Request logging middleware (skip health checks for performance)
app.use(requestLoggingMiddleware);

// Routes
app.get('/health', healthCheck);
app.get('/modified-openid-configuration/.well-known/openid-configuration', getModifiedOpenIDConfiguration);
app.get('/modified-openid-userinfo', getUserinfo);

// 404 handler with detailed logging
app.use(notFoundHandler);

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

// Setup graceful shutdown handling
setupGracefulShutdown(server);

