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
    
    // Calcular ÚLTIMA SEMANA COMPLETA (lunes a domingo)
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    
    // Calcular cuántos días retroceder para llegar al LUNES PASADO
    // Si hoy es lunes (1), retroceder 7 días para el lunes anterior
    // Si hoy es martes (2), retroceder 8 días
    // Si hoy es domingo (0), retroceder 7 días
    let diasHastaLunesPasado;
    if (diaSemana === 0) {
      // Domingo: retroceder 7 días al lunes anterior
      diasHastaLunesPasado = 7;
    } else {
      // Cualquier otro día: retroceder a lunes de semana pasada
      diasHastaLunesPasado = diaSemana + 6;
    }
    
    // Calcular fecha del lunes pasado en zona horaria local
    const fechaLunesPasado = new Date(hoy);
    fechaLunesPasado.setDate(hoy.getDate() - diasHastaLunesPasado);
    
    // Calcular fecha del domingo pasado (6 días después del lunes pasado)
    const fechaDomingoPasado = new Date(fechaLunesPasado);
    fechaDomingoPasado.setDate(fechaLunesPasado.getDate() + 6);
    
    // Crear fechas UTC con las fechas locales calculadas
    const inicioSemana = new Date(Date.UTC(
      fechaLunesPasado.getFullYear(),
      fechaLunesPasado.getMonth(),
      fechaLunesPasado.getDate(),
      0, 0, 0, 0
    ));
    
    const finSemana = new Date(Date.UTC(
      fechaDomingoPasado.getFullYear(),
      fechaDomingoPasado.getMonth(),
      fechaDomingoPasado.getDate(),
      23, 59, 59, 999
    ));
    
    console.log('📅 Cálculo semanal (ÚLTIMA SEMANA COMPLETA):', {
      hoy: hoy.toISOString(),
      diaSemana,
      diasHastaLunesPasado,
      inicioSemana: inicioSemana.toISOString(),
      finSemana: finSemana.toISOString(),
      rangoLegible: `${fechaLunesPasado.toLocaleDateString()} al ${fechaDomingoPasado.toLocaleDateString()}`
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
        fecha: { 
          gte: inicioSemana,
          lte: finSemana
        }
      },
      select: { id: true, descripcion: true, monto: true, fecha: true }
    });
    console.log('📊 Gastos en última semana completa:', gastosSemanalesDebug.map((g: any) => ({
      ...g,
      fecha: g.fecha.toISOString()
    })));
    
    // Filtros de fecha personalizados (si se proporcionan)
    const wherePersonalizado = fechaInicio && fechaFin ? {
      gte: new Date(fechaInicio),
      lte: new Date(fechaFin)
    } : undefined;
    
    // Filtro para última semana completa
    const whereSemana = {
      gte: inicioSemana,
      lte: finSemana
    };
    
    // Calcular métricas en paralelo
    const [
      totalInversiones,
      totalPagos,
      totalVentas,
      totalGastos,
      totalSaldoDeudores,
      // Métricas de última semana completa
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
      
      // Inversiones última semana completa
      prisma.inversion.aggregate({
        _sum: { monto: true },
        where: { fecha: whereSemana }
      }),
      
      // Pagos última semana completa
      prisma.pago.aggregate({
        _sum: { monto: true },
        where: { fechaPago: whereSemana }
      }),
      
      // Ventas última semana completa
      prisma.venta.aggregate({
        _sum: { totalVenta: true },
        where: { fechaVenta: whereSemana }
      }),
      
      // Gastos última semana completa
      prisma.gasto.aggregate({
        _sum: { monto: true },
        where: {
          confirmado: true,
          fecha: whereSemana
        }
      }).then((result: any) => {
        console.log('💰 Gastos última semana completa:', result);
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
    
    // Calcular capital de última semana completa
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
        gastos: gastosSem,
        // Información adicional sobre el período
        rangoFechas: {
          inicio: inicioSemana,
          fin: finSemana
        }
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