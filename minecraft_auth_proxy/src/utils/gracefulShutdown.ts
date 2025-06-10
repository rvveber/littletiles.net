import type { Server } from 'http';

/**
 * Setup graceful shutdown handling for the server
 * @param server The HTTP server instance
 */
export function setupGracefulShutdown(server: Server): void {
  function gracefulShutdown(signal: string) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      console.log('Server closed successfully');
      process.exit(0);
    });
    
    // Force shutdown after 5 seconds if graceful shutdown takes too long
    setTimeout(() => {
      console.error('Forceful shutdown due to timeout');
      process.exit(1);
    }, 5000);
  }

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}
