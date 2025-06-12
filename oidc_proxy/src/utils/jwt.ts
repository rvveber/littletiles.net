import type { MicrosoftUserInfo } from '../types/index.js';

/**
 * Decode a JWT token payload without verification
 * @param token The JWT token to decode
 * @returns The decoded payload or empty object if decoding fails
 */
export function decodeJWT(token: string): MicrosoftUserInfo {
  try {
    const parts = token.split('.');
    if (parts.length === 3 && parts[1]) {
      const payload = parts[1];
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      return JSON.parse(atob(paddedPayload));
    }
  } catch (error) {
    console.error('Error decoding JWT:', error);
  }
  return {};
}
