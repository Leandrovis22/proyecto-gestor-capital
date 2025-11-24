import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/sessionManager';

const API_KEY = process.env.SYNC_API_KEY || '4781a3a659d818c7bf991cba7bea990dad253d7765c6094172f76fb036be1ad7';

/**
 * GET /api/sync/status
 * Consulta el estado de la última sincronización desde Google Script
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación - puede venir como Bearer token (interno) o Session token (cliente)
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.headers.get('x-session-token');
    
    // Si viene con Bearer token (llamada interna entre servicios)
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token || token !== API_KEY) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }
    // Si viene con session token (cliente web)
    else if (sessionToken) {
      if (!validateSession(sessionToken)) {
        return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
      }
    }
    // Sin autenticación
    else {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Llamar a Google Script para obtener el estado
    const googleScriptUrl = process.env.GOOGLE_SCRIPT_WEB_APP_URL;
    if (!googleScriptUrl) {
      return NextResponse.json({ error: 'URL de Google Script no configurada' }, { status: 500 });
    }

    const response = await fetch(`${googleScriptUrl}?action=getStatus`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al consultar estado: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error al consultar estado de sincronización:', error);
    return NextResponse.json(
      { 
        error: 'Error al consultar estado de sincronización',
        detalle: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
