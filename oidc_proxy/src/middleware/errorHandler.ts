import type { Request, Response } from 'express';

/**
 * 404 handler with detailed logging
 */
export function notFoundHandler(req: Request, res: Response): void {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] 404 NOT FOUND - Detailed Request Info:`);
  console.error(`  Method: ${req.method}`);
  console.error(`  URL: ${req.url}`);
  console.error(`  Original URL: ${req.originalUrl}`);
  console.error(`  Base URL: ${req.baseUrl}`);
  console.error(`  Path: ${req.path}`);
  console.error(`  Query: ${JSON.stringify(req.query)}`);
  console.error(`  Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.error(`  Body: ${JSON.stringify(req.body, null, 2)}`);
  console.error(`  Params: ${JSON.stringify(req.params)}`);
  console.error(`  IP: ${req.ip || req.socket.remoteAddress || 'Unknown'}`);
  console.error(`  User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.error(`  Protocol: ${req.protocol}`);
  console.error(`  Host: ${req.get('Host') || 'Unknown'}`);
  console.error(`  Referer: ${req.get('Referer') || 'None'}`);
  console.error(`  Content-Type: ${req.get('Content-Type') || 'None'}`);
  console.error(`  Content-Length: ${req.get('Content-Length') || 'None'}`);
  console.error(`  Cookies: ${JSON.stringify(req.cookies || {})}`);
  console.error('--- End of 404 Request Details ---');
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: timestamp,
    service: 'minecraft_auth_proxy'
  });
}
