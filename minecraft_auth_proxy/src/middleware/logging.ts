import type { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware that skips health checks for performance
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip logging for health check endpoint to reduce overhead
  if (req.url === '/health') {
    return next();
  }
  
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.socket.remoteAddress || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${timestamp}] ${method} ${url} - Response: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
}
