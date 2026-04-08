import { useMemo, useState } from 'react'
import { trpc } from '../../../lib/trpc'
import { Wallet, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { subMonths, format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '../../../lib/utils'

export function DegeneradoFiscalPage() {
  const { data: ingresos = [] } = trpc.ingresos.getMany.useQuery()
  const { data: gastoServices = [] } = trpc.gastosFijos.getMany.useQuery()
  const { data: creditos = [] } = trpc.creditos.getMany.useQuery()
  const { data: proyectos = [] } = trpc.proyectos.getMany.useQuery()

  const ingresosRaw = ingresos as any[]
  const gastosRaw = gastoServices as any[]
  const creditosRaw = creditos as any[]
  const proyectosRaw = proyectos as any[]

  const now = new Date()
  const currentM = now.getMonth()
  const currentY = now.getFullYear()

  const allRegistros: any[] = gastosRaw.flatMap(s => s.registros ?? [])
  const allCuotas: any[] = creditosRaw.flatMap(c =>
    (c.pagos ?? []).map((p: any) => ({ ...p, _creditoNombre: c.nombre }))
  )

  const currentMonthIngresos = ingresosRaw.filter(i => {
    const d = new Date(i.fecha)
    return d.getMonth() === currentM && d.getFullYear() === currentY
  })

  const currentMonthRegistros = allRegistros.filter(r => {
    const d = r.fechaVencimiento ? new Date(r.fechaVencimiento) : new Date(r.fecha)
    return d.getMonth() === currentM && d.getFullYear() === currentY
  })

  // Cuotas que vencen este mes O fueron pagadas este mes
  const currentMonthCuotas = allCuotas.filter(c => {
    // Si fue pagada, usar la fecha real de pago
    if (c.pagado && c.fechaPagado) {
      const d = new Date(c.fechaPagado)
      return d.getMonth() === currentM && d.getFullYear() === currentY
    }
    // Si no fue pagada (o no tiene fecha de pago), usar la fecha de vencimiento
    const d = new Date(c.fechaPago)
    return d.getMonth() === currentM && d.getFullYear() === currentY
  })

  const allGastosProyecto: any[] = proyectosRaw.flatMap(p => p.gastos ?? [])
  const currentMonthGastosProyecto = allGastosProyecto.filter(g => {
    const d = new Date(g.fecha)
    return d.getMonth() === currentM && d.getFullYear() === currentY
  })

  const totalIngresos = currentMonthIngresos.reduce((s, i) => s + Number(i.monto), 0)
  const totalGastosServicios = currentMonthRegistros.reduce((s, r) => s + Number(r.monto), 0)
  const totalGastosCuotas = currentMonthCuotas.reduce((s, c) => s + Number(c.monto), 0)
  const totalGastosProyecto = currentMonthGastosProyecto.reduce((s, g) => s + Number(g.monto), 0)
  const totalGastos = totalGastosServicios + totalGastosCuotas + totalGastosProyecto

  const totalPagadoServicios = currentMonthRegistros.filter(r => r.pagado).reduce((s, r) => s + Number(r.monto), 0)
  const totalPagadoCuotas = currentMonthCuotas.filter(c => c.pagado).reduce((s, c) => s + Number(c.monto), 0)
  // Los gastos de proyecto son siempre gastos reales (ya ejecutados)
  const totalGastosPagados = totalPagadoServicios + totalPagadoCuotas + totalGastosProyecto

  const balance = totalIngresos - totalGastos

  // Últimos 6 meses para el gráfico
  const monthlyData = useMemo(() => {
    const registros = (gastoServices as any[]).flatMap((s: any) => s.registros ?? [])
    const cuotas = (creditos as any[]).flatMap((c: any) => c.pagos ?? [])
    const gastosProyecto = (proyectos as any[]).flatMap((p: any) => p.gastos ?? [])
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      const m = date.getMonth()
      const y = date.getFullYear()

      const monthIngresos = (ingresos as any[])
        .filter(ing => { const d = new Date(ing.fecha); return d.getMonth() === m && d.getFullYear() === y })
        .reduce((s, ing) => s + Number(ing.monto), 0)

      const monthGastosServicios = registros
        .filter((r: any) => { const d = r.fechaVencimiento ? new Date(r.fechaVencimiento) : new Date(r.fecha); return d.getMonth() === m && d.getFullYear() === y })
        .reduce((s: number, r: any) => s + Number(r.monto), 0)

      const monthGastosCuotas = cuotas
        .filter((c: any) => {
          if (c.pagado && c.fechaPagado) {
            const d = new Date(c.fechaPagado)
            return d.getMonth() === m && d.getFullYear() === y
          }
          const d = new Date(c.fechaPago)
          return d.getMonth() === m && d.getFullYear() === y
        })
        .reduce((s: number, c: any) => s + Number(c.monto), 0)

      const monthGastosProyecto = gastosProyecto
        .filter((g: any) => { const d = new Date(g.fecha); return d.getMonth() === m && d.getFullYear() === y })
        .reduce((s: number, g: any) => s + Number(g.monto), 0)

      return { mes: format(date, 'MMM', { locale: es }), Ingresos: monthIngresos, Gastos: monthGastosServicios + monthGastosCuotas + monthGastosProyecto }
    })
  }, [ingresos, gastoServices, creditos, proyectos])

  // Próximas facturas/cuotas a vencer (15 días)
  const upcomingBills = [
    ...allRegistros
      .filter(r => !r.pagado && r.fechaVencimiento)
      .map(r => {
        const days = differenceInDays(new Date(r.fechaVencimiento), now)
        const service = gastosRaw.find(s => s.registros?.some((x: any) => x.id === r.id))
        return { id: r.id, monto: r.monto, days, label: service?.nombre ?? 'Servicio' }
      }),
    ...allCuotas
      .filter(c => !c.pagado)
      .map(c => {
        const days = differenceInDays(new Date(c.fechaPago), now)
        return { id: c.id, monto: c.monto, days, label: `${c._creditoNombre} — Cuota ${c.numeroCuota}` }
      }),
  ]
    .filter(r => r.days >= 0 && r.days <= 15)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)

  const [movFilter, setMovFilter] = useState<'todos' | 'ingresos' | 'gastos'>('todos')

  const allMovements = useMemo(() => {
    const items: { id: string; tipo: 'ingreso' | 'gasto'; categoria: string; label: string; sublabel: string; monto: number; fecha: Date; pagado?: boolean }[] = []

    // Ingresos
    ;(ingresos as any[]).forEach(i => {
      items.push({ id: `ing-${i.id}`, tipo: 'ingreso', categoria: 'Ingreso', label: i.descripcion, sublabel: i.tipo, monto: Number(i.monto), fecha: new Date(i.fecha), pagado: true })
    })

    // Registros de gastos fijos
    ;(gastoServices as any[]).forEach(s => {
      ;(s.registros ?? []).forEach((r: any) => {
        items.push({ id: `reg-${r.id}`, tipo: 'gasto', categoria: 'Servicio', label: s.nombre, sublabel: s.categoria ?? '', monto: Number(r.monto), fecha: new Date(r.fechaVencimiento ?? r.fecha), pagado: r.pagado })
      })
    })

    // Cuotas de créditos
    ;(creditos as any[]).forEach(c => {
      ;(c.pagos ?? []).forEach((p: any) => {
        items.push({ id: `cuota-${p.id}`, tipo: 'gasto', categoria: 'Crédito', label: c.nombre, sublabel: `Cuota ${p.numeroCuota}`, monto: Number(p.monto), fecha: new Date(p.fechaPagado ?? p.fechaPago), pagado: p.pagado })
      })
    })

    // Gastos de proyectos
    ;(proyectos as any[]).forEach(p => {
      ;(p.gastos ?? []).forEach((g: any) => {
        items.push({ id: `proy-${g.id}`, tipo: 'gasto', categoria: 'Proyecto', label: g.descripcion, sublabel: p.nombre, monto: Number(g.monto), fecha: new Date(g.fecha), pagado: true })
      })
    })

    return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }, [ingresos, gastoServices, creditos, proyectos])

  const filteredMovements = movFilter === 'todos'
    ? allMovements
    : allMovements.filter(m => m.tipo === (movFilter === 'ingresos' ? 'ingreso' : 'gasto'))

  const fmt = (v: number) => `$${v.toLocaleString('es-AR')}`

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left — 2 cols */}
      <div className="md:col-span-2 space-y-6">

        {/* Mini summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2">Ingresos</p>
            <p className="text-2xl font-black text-white tabular-nums">{fmt(totalIngresos)}</p>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">Este mes</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/15">
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">Gastos</p>
            <p className="text-2xl font-black text-yellow-400 tabular-nums">{fmt(totalGastos)}</p>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">Este mes</p>
          </div>
          <div className={cn(
            'card p-4 bg-gradient-to-br to-transparent',
            balance >= 0 ? 'from-green-500/5 border-green-500/15' : 'from-red-500/5 border-red-500/15'
          )}>
            <p className={cn('text-[10px] font-black uppercase tracking-widest mb-2', balance >= 0 ? 'text-green-500' : 'text-red-500')}>Balance</p>
            <p className={cn('text-2xl font-black tabular-nums', balance >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(balance)}</p>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">Ingresos − Gastos</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card p-5">
          <h2 className="text-base font-bold text-slate-200 mb-0.5">Ingresos vs Gastos</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff07" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={v => v === 0 ? '0' : `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false} tickLine={false} width={44}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #ffffff12', borderRadius: 12, fontSize: 12, padding: '8px 14px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                formatter={(v: number) => [fmt(v), undefined]}
                cursor={{ fill: '#ffffff05' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 18 }}
                formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>}
              />
              <Bar dataKey="Ingresos" fill="#22c55e" radius={[5, 5, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Gastos" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Movimientos */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-200">Movimientos</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Todos los registros</p>
            </div>
            <div className="flex gap-1 bg-surface-950 rounded-xl p-1">
              {(['todos', 'ingresos', 'gastos'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMovFilter(f)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                    movFilter === f ? 'bg-brand-500 text-black' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <p className="text-center text-xs text-slate-600 py-8">Sin movimientos</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {filteredMovements.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/50 border border-white/5 hover:border-white/10 transition-all">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    m.tipo === 'ingreso' ? 'bg-green-500/10' : 'bg-yellow-500/10'
                  )}>
                    {m.tipo === 'ingreso'
                      ? <ArrowUpRight size={14} className="text-green-400" />
                      : <ArrowDownLeft size={14} className="text-yellow-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{m.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      <span className="text-slate-600 font-bold uppercase">{m.categoria}</span>
                      {m.sublabel ? ` · ${m.sublabel}` : ''}
                      {' · '}{format(m.fecha, 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn('text-sm font-black tabular-nums', m.tipo === 'ingreso' ? 'text-green-400' : 'text-yellow-400')}>
                      {m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}
                    </p>
                    {m.tipo === 'gasto' && (
                      <p className={cn('text-[9px] font-black uppercase', m.pagado ? 'text-green-500/70' : 'text-yellow-500')}>
                        {m.pagado ? 'pagado' : 'pendiente'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right col */}
      <div className="space-y-6">
        {/* Estado Actual */}
        <div className="card p-5 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Actual</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Disponible', value: balance, icon: Wallet, color: balance >= 0 ? 'text-brand-400' : 'text-red-400' },
              { label: 'Total Ingresos', value: totalIngresos, icon: TrendingDown, color: 'text-blue-400' },
              { label: 'Pagado (servicios + cuotas)', value: totalGastosPagados, icon: CheckCircle2, color: 'text-green-400' },
              { label: 'Pendiente', value: totalGastos - totalGastosPagados, icon: AlertCircle, color: 'text-yellow-400' },
              { label: 'Total Gastos + Créditos', value: totalGastos, icon: TrendingUp, color: 'text-red-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-surface-900/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <item.icon size={15} className={item.color} />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
                <span className={cn('text-sm font-black tabular-nums', item.color)}>{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas a vencer */}
        {upcomingBills.length > 0 && (
          <div className="card p-5 space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximas a Vencer</h3>
            {upcomingBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/50 border border-white/5">
                <div>
                  <p className="text-xs font-bold text-slate-200">{bill.label}</p>
                  <p className={cn('text-[10px] font-bold mt-0.5', bill.days <= 3 ? 'text-red-400' : 'text-yellow-500')}>
                    {bill.days === 0 ? 'Vence hoy' : `En ${bill.days} día${bill.days !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <span className="text-xs font-black text-white tabular-nums">{fmt(Number(bill.monto))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
