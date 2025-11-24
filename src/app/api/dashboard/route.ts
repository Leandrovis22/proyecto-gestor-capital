import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/validateAuth';

export async function GET(request: NextRequest) {
  // Validar autenticación
  const authError = validateAuth(request);
  if (authError) return authError;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');
    
    const FECHA_INICIO_CAPITAL_PAGOS = new Date('2025-11-04');
    const FECHA_INICIO_CAPITAL_VENTAS = new Date('2025-11-04');
    
    // Calcular inicio de esta semana (lunes a domingo) - usar fecha local
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    // Si es domingo (0), retroceder 6 días; si es lunes (1), retroceder 0 días
    const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;
    
    // Calcular la fecha del lunes en la zona horaria local
    const fechaLunes = new Date(hoy);
    fechaLunes.setDate(hoy.getDate() - diasDesdeInicio);
    
    // Crear inicioSemana en UTC con la fecha local calculada
    const inicioSemana = new Date(Date.UTC(
      fechaLunes.getFullYear(),
      fechaLunes.getMonth(),
      fechaLunes.getDate(),
      0, 0, 0, 0
    ));
    
    console.log('📅 Cálculo semanal:', {
      hoy: hoy.toISOString(),
      diaSemana,
      diasDesdeInicio,
      inicioSemana: inicioSemana.toISOString()
    });
    
    // Debug: Ver todos los gastos confirmados
    const todosGastos = await prisma.gasto.findMany({
      where: { confirmado: true },
      select: { id: true, descripcion: true, monto: true, fecha: true, confirmado: true }
    });
    console.log('🔍 Todos los gastos confirmados:', todosGastos.map((g: any) => ({
      ...g,
      fecha: g.fecha.toISOString()
    })));
    
    // Debug: Ver qué gastos cumplen el filtro semanal
    const gastosSemanalesDebug = await prisma.gasto.findMany({
      where: {
        confirmado: true,
        fecha: { gte: inicioSemana }
      },
      select: { id: true, descripcion: true, monto: true, fecha: true }
    });
    console.log('📊 Gastos que cumplen filtro semanal (>= inicioSemana):', gastosSemanalesDebug.map((g: any) => ({
      ...g,
      fecha: g.fecha.toISOString()
    })));
    
    // Filtros de fecha personalizados (si se proporcionan)
    const wherePersonalizado = fechaInicio && fechaFin ? {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    } : undefined;
    
    // Calcular métricas en paralelo
    const [
      totalInversiones,
      totalPagos,
      totalVentas,
      totalGastos,
      totalSaldoDeudores,
      // Métricas de esta semana
      inversionesSemana,
      pagosSemana,
      ventasSemana,
      gastosSemana,
      ultimasPagos,
      ultimasVentas,
      clientesDeudores
    ] = await Promise.all([
      // Total Inversiones
      prisma.inversion.aggregate({
        _sum: { monto: true },
        where: wherePersonalizado ? { fecha: wherePersonalizado } : undefined
      }),
      
      // Total Pagos (>= 04/11/2025)
      prisma.pago.aggregate({
        _sum: { monto: true },
        where: {
          fechaPago: wherePersonalizado || { gte: FECHA_INICIO_CAPITAL_PAGOS }
        }
      }),
      
      // Total Ventas (>= 04/11/2025)
      prisma.venta.aggregate({
        _sum: { totalVenta: true },
        where: {
          fechaVenta: wherePersonalizado || { gte: FECHA_INICIO_CAPITAL_VENTAS }
        }
      }),
      
      // Total Gastos (solo confirmados)
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: {
          confirmado: true,
          ...(wherePersonalizado ? { fecha: wherePersonalizado } : {})
        }
      }),
      
      // Total Saldo Deudores
      prisma.cliente.aggregate({
        _sum: { saldoAPagar: true },
        where: { saldoAPagar: { gt: 0 } }
      }),
      
      // Inversiones esta semana
      prisma.inversion.aggregate({
        _sum: { monto: true },
        where: { fecha: { gte: inicioSemana } }
      }),
      
      // Pagos esta semana
      prisma.pago.aggregate({
        _sum: { monto: true },
        where: { fechaPago: { gte: inicioSemana } }
      }),
      
      // Ventas esta semana
      prisma.venta.aggregate({
        _sum: { totalVenta: true },
        where: { fechaVenta: { gte: inicioSemana } }
      }),
      
      // Gastos esta semana
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: {
          confirmado: true,
          fecha: { gte: inicioSemana }
        }
      }).then((result: any) => {
        console.log('💰 Gastos semanales:', result);
        return result;
      }),
      
      // Últimos 10 pagos
      prisma.pago.findMany({
        take: 10,
        include: { cliente: true },
        orderBy: [
          { fechaPago: 'desc' },
          { timestampArchivo: 'desc' }
        ]
      }),
      
      // Últimas 10 ventas
      prisma.venta.findMany({
        take: 10,
        include: { cliente: true },
        orderBy: [
          { fechaVenta: 'desc' },
          { timestampArchivo: 'desc' }
        ]
      }),
      
      // Clientes deudores (top 10)
      prisma.cliente.findMany({
        where: { saldoAPagar: { gt: 0 } },
        orderBy: { saldoAPagar: 'desc' },
        take: 10
      })
    ]);
    
    // Calcular capital total
    const inversiones = Number(totalInversiones._sum.monto || 0);
    const pagos = Number(totalPagos._sum.monto || 0);
    const ventas = Number(totalVentas._sum.totalVenta || 0);
    const gastos = Number(totalGastos._sum.monto || 0);
    const capital = inversiones + pagos - ventas - gastos;
    
    // Calcular capital de esta semana
    const inversionesSem = Number(inversionesSemana._sum.monto || 0);
    const pagosSem = Number(pagosSemana._sum.monto || 0);
    const ventasSem = Number(ventasSemana._sum.totalVenta || 0);
    const gastosSem = Number(gastosSemana._sum.monto || 0);
    const capitalSemana = inversionesSem + pagosSem - ventasSem - gastosSem;
    
    return NextResponse.json({
      capital: {
        total: capital,
        inversiones,
        pagos,
        ventas,
        gastos
      },
      capitalSemana: {
        total: capitalSemana,
        inversiones: inversionesSem,
        pagos: pagosSem,
        ventas: ventasSem,
        gastos: gastosSem
      },
      saldoDeudores: Number(totalSaldoDeudores._sum.saldoAPagar || 0),
      ultimasPagos,
      ultimasVentas,
      clientesDeudores,
      fechaActualizacion: new Date()
    });
    
  } catch (error) {
    console.error('Error en dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 });
  }
}
