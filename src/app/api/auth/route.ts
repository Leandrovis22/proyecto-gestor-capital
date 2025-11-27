// src/app/api/auth/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/sessionManager';

const AUTH_USERNAME = process.env.APP_USERNAME;
const AUTH_PASSWORD = process.env.APP_PASSWORD;

/**
 * POST /api/auth
 * Autentica usuario y devuelve un token de sesión
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('🔐 Intento de login:', username);

    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      const sessionToken = createSession(username);

      return NextResponse.json({
        success: true,
        sessionToken
      });
    }

    console.log('❌ Credenciales incorrectas');
    return NextResponse.json(
      { success: false, error: 'Credenciales incorrectas' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error en autenticación:', error);
    return NextResponse.json(
      { success: false, error: 'Error al autenticar' },
      { status: 500 }
    );
  }
}
