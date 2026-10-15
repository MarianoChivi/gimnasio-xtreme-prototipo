import { useState } from 'react'
import { Pencil, Plus, Trash2, UserCog } from 'lucide-react'
import { useStore } from '../store'
import { Avatar, Badge, Button, Confirm, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Select, Table, useToast } from '../components/ui'

const vacio = { usuario: '', nombre: '', rol: 'Recepcionista', contrasena: '' }

export default function Usuarios() {
  const { state, api, usuario: yo } = useStore()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(vacio)
  const [baja, setBaja] = useState(null)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const abrir = (u) => {
    setForm(u ? { ...u, contrasena: '' } : vacio)
    setError('')
    setModal(u ?? 'nuevo')
  }
  const guardar = () => {
    try {
      if (modal === 'nuevo') api.registrarUsuario(form)
      else api.modificarUsuario(modal.id, form)
      toast(modal === 'nuevo' ? 'Usuario registrado correctamente.' : 'Usuario modificado.')
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas de acceso al sistema y sus permisos."
        actions={
          <Button icon={Plus} onClick={() => abrir(null)}>
            Registrar Usuario
          </Button>
        }
      />
      <Table
        rows={[...state.usuarios].sort((a, b) => (a.estado === b.estado ? 0 : a.estado === 'Activo' ? -1 : 1))}
        columns={[
          {
            header: 'Usuario',
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar text={u.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2)} className={u.estado === 'Baja' ? 'bg-ink-100 text-ink-400' : ''} />
                <div>
                  <p className="font-medium text-ink-800">
                    {u.nombre} {u.id === yo.id && <span className="ml-1 text-xs font-normal text-ink-400">(vos)</span>}
                  </p>
                  <p className="font-mono text-xs text-ink-400">@{u.usuario}</p>
                </div>
              </div>
            ),
          },
          { header: 'Rol', render: (u) => <span className={u.rol === 'Propietario' ? 'font-semibold text-ink-700' : 'text-ink-600'}>{u.rol}</span> },
          { header: 'Permisos', className: 'hidden lg:table-cell text-xs text-ink-400', render: (u) => (u.rol === 'Propietario' ? 'Acceso total' : 'Socios, pagos, ventas, inventario (consulta), caja y reportes') },
          { header: 'Estado', render: (u) => <Badge>{u.estado}</Badge> },
          {
            header: '',
            align: 'right',
            render: (u) =>
              u.estado === 'Activo' && (
                <div className="flex justify-end gap-1">
                  <IconButton icon={Pencil} title="Modificar" onClick={() => abrir(u)} />
                  {u.id !== yo.id && <IconButton icon={Trash2} title="Dar de baja" onClick={() => setBaja(u)} />}
                </div>
              ),
          },
        ]}
      />
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'nuevo' ? 'Registrar Usuario' : 'Modificar Usuario'}
        icon={UserCog}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>{modal === 'nuevo' ? 'Registrar' : 'Guardar cambios'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre y apellido *" className="sm:col-span-2">
            <Input value={form.nombre} onChange={set('nombre')} autoFocus />
          </Field>
          <Field label="Nombre de usuario *">
            <Input value={form.usuario} onChange={set('usuario')} autoComplete="off" />
          </Field>
          <Field label="Rol *">
            <Select value={form.rol} onChange={set('rol')}>
              <option>Propietario</option>
              <option>Recepcionista</option>
            </Select>
          </Field>
          <Field label={modal === 'nuevo' ? 'Contraseña *' : 'Nueva contraseña'} className="sm:col-span-2" hint={modal === 'nuevo' ? 'Mínimo 6 caracteres.' : 'Dejala vacía para mantener la actual.'}>
            <Input type="password" value={form.contrasena} onChange={set('contrasena')} autoComplete="new-password" />
          </Field>
          <div className="sm:col-span-2">
            <ErrorBox>{error}</ErrorBox>
          </div>
        </div>
      </Modal>
      <Confirm
        open={!!baja}
        onClose={() => setBaja(null)}
        title="Baja de Usuario"
        confirmText="Dar de baja"
        onConfirm={() => {
          try {
            api.bajaUsuario(baja.id)
            toast(`El usuario @${baja.usuario} fue dado de baja.`)
          } catch (e) {
            toast(e.message, 'error')
          }
          setBaja(null)
        }}
      >
        {baja && (
          <>
            ¿Confirmás la baja de <b>{baja.nombre}</b> (@{baja.usuario})? Ya no podrá iniciar sesión.
          </>
        )}
      </Confirm>
    </>
  )
}
