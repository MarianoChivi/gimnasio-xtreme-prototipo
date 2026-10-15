import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Eye, Pencil, UserPlus } from 'lucide-react'
import { useStore } from '../store'
import { fmtDate, initials, normalize } from '../utils'
import { Avatar, Badge, Button, IconButton, PageHeader, SearchInput, Table, Tabs } from '../components/ui'

export default function Socios() {
  const { state, estadoSocio } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('Todos')

  const conteo = useMemo(() => {
    const c = { Todos: state.socios.length, 'Al día': 0, Vencido: 0, Baja: 0 }
    state.socios.forEach((s) => c[estadoSocio.get(s.dni)]++)
    return c
  }, [state.socios, estadoSocio])

  const rows = state.socios
    .filter((s) => filtro === 'Todos' || estadoSocio.get(s.dni) === filtro)
    .filter((s) => !q || s.dni.includes(q.trim()) || normalize(`${s.nombre} ${s.apellido}`).includes(normalize(q.trim())))
    .sort((a, b) => a.apellido.localeCompare(b.apellido))

  return (
    <>
      <PageHeader
        title="Listado de Socios"
        subtitle="Buscá un socio por DNI o nombre para ver su ficha, modificarlo o registrar un pago."
        actions={
          <Button icon={UserPlus} onClick={() => nav('/socios/nuevo')}>
            Registrar Socio
          </Button>
        }
      />
      <Tabs
        value={filtro}
        onChange={setFiltro}
        tabs={['Todos', 'Al día', 'Vencido', 'Baja'].map((v) => ({ value: v, label: v === 'Vencido' ? 'Vencidos' : v === 'Baja' ? 'De baja' : v, count: conteo[v] }))}
      />
      <div className="mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por DNI o nombre..." className="max-w-md" />
      </div>
      <Table
        onRowClick={(s) => nav(`/socios/${s.dni}`)}
        rows={rows}
        rowKey={(s) => s.dni}
        empty="No se encontraron socios con ese criterio."
        footer={`Mostrando ${rows.length} socio${rows.length === 1 ? '' : 's'}`}
        columns={[
          {
            header: 'Socio',
            render: (s) => (
              <div className="flex items-center gap-3">
                <Avatar text={initials(s.nombre, s.apellido)} className={s.baja ? 'bg-ink-100 text-ink-400' : ''} />
                <div>
                  <p className="font-medium text-ink-800">
                    {s.apellido}, {s.nombre}
                  </p>
                  <p className="text-xs text-ink-400">{s.email || 'Sin email'}</p>
                </div>
              </div>
            ),
          },
          { header: 'DNI', key: 'dni', className: 'tabular-nums' },
          { header: 'Teléfono', key: 'telefono', className: 'hidden md:table-cell' },
          { header: 'Ingreso', render: (s) => fmtDate(s.fechaIngreso), className: 'hidden lg:table-cell' },
          { header: 'Estado', render: (s) => <Badge>{estadoSocio.get(s.dni)}</Badge> },
          {
            header: 'Acciones',
            align: 'right',
            render: (s) => (
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <IconButton icon={Eye} title="Ver ficha" onClick={() => nav(`/socios/${s.dni}`)} />
                {!s.baja && <IconButton icon={Pencil} title="Modificar" onClick={() => nav(`/socios/${s.dni}/editar`)} />}
                {estadoSocio.get(s.dni) === 'Vencido' && <IconButton icon={CreditCard} variant="brand" title="Registrar pago" onClick={() => nav(`/pagos?dni=${s.dni}`)} />}
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
