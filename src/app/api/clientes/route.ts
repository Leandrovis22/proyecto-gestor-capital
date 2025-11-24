import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

export async function GET(request: NextRequest) {
  const authError = validateAuth(request);
  if (authError) return authError;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const soloDeudores = searchParams.get('deudores') === 'true';
    
    const clientes = await prisma.cliente.findMany({
      where: soloDeudores ? { saldoAPagar: { gt: 0 } } : undefined,
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
