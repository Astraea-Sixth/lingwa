/**
 * Lingwa — API Configuration
 *
 * Single source of truth for backend API URL.
 * All server-side route handlers import from here.
 *
 * Set via environment variable: API_BASE_URL
 * Default: http://localhost:5003
 */

export const API_BASE = process.env.API_BASE_URL || 'http://localhost:5003'
