import express from 'express';
import { requestLoggingMiddleware } from './src/middleware/logging.js';
import { notFoundHandler } from './src/middleware/errorHandler.js';
import { healthCheck } from './src/controllers/health.js';
import { getModifiedOpenIDConfiguration } from './src/controllers/modifiedOpenIDConfiguration.js';
import { getUserInfoCompatibleToken } from './src/controllers/userInfoCompatibleToken.js';
import { setupGracefulShutdown } from './src/utils/gracefulShutdown.js';

const app = express();
const PORT = process.env.PORT || 8060;

// Trust proxy for proper IP logging
app.set('trust proxy', true);

// Middleware to parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Request logging middleware (skip health checks for performance)
app.use(requestLoggingMiddleware);

// Routes
app.get('/health', healthCheck);
app.get('/consumers/v2.0/.well-known/openid-configuration', getModifiedOpenIDConfiguration);
app.post('/consumers/oauth2/v2.0/token', getUserInfoCompatibleToken);

// 404 handler with detailed logging
app.use(notFoundHandler);

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

// Setup graceful shutdown handling
setupGracefulShutdown(server);

