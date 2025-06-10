import type { Request, Response } from 'express';

/**
 * Health check endpoint - optimized for speed
 */
export function healthCheck(_req: Request, res: Response): void {
  // Skip logging for health checks to reduce overhead
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).end('{"status":"ok"}');
}
