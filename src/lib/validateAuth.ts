// src/lib/validateAuth.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/sessionManager';

/**
 * Valida la autenticación de una request
 * Soporta Bearer token (interno) y Session token (cliente)
 */
export function validateAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const sessionToken = request.headers.get('x-session-token');
  const API_KEY = process.env.SYNC_API_KEY;
  
  // debug logs removed to avoid noisy output in production
  
  // Autenticación con Bearer token (interno)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === API_KEY) {
      // authenticated with bearer token
      return null; // Autenticado
    }
  }
  
  // Autenticación con session token (cliente)
  if (sessionToken && validateSession(sessionToken)) {
    // authenticated with session token
    return null; // Autenticado
  }
  
  // No autorizado
  // authentication failed
  return NextResponse.json(
    { error: 'No autorizado' },
    { status: 401 }
  );
}
