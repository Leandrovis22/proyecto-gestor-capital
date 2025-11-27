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
  
  console.log('🔍 Validando auth - Bearer:', !!authHeader, 'Session:', !!sessionToken);
  
  // Autenticación con Bearer token (interno)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === API_KEY) {
      console.log('✅ Auth válida: Bearer token');
      return null; // Autenticado
    }
  }
  
  // Autenticación con session token (cliente)
  if (sessionToken && validateSession(sessionToken)) {
    console.log('✅ Auth válida: Session token');
    return null; // Autenticado
  }
  
  // No autorizado
  console.log('❌ Auth fallida');
  return NextResponse.json(
    { error: 'No autorizado' },
    { status: 401 }
  );
}
