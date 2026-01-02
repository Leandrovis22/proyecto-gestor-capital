import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

export async function GET(request: NextRequest) {
  const authError = validateAuth(request);
  if (authError) return authError;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const soloDeudores = searchParams.get('deudores') === 'true';
    
    // Construir condiciones de filtro
    const whereConditions: any = {
      activo: true // Solo mostrar clientes activos (no eliminados del Drive)
    };
    
    if (soloDeudores) {
      whereConditions.saldoAPagar = { gt: 0 };
    }
    
    const clientes = await prisma.cliente.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: { pagos: true, ventas: true }
        }
      },
      orderBy: { saldoAPagar: 'desc' }
    });
    
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}
