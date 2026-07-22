import { useState } from 'react'
import VeiculosStatus from './VeiculosStatus.jsx'
import Colaboradores from './Colaboradores.jsx'
import VeiculosKm from './VeiculosKm.jsx'
import Tarefas from './Tarefas.jsx'
import Checklist from './Checklist.jsx'
import ConfigVeiculos from './ConfigVeiculos.jsx'
import Usuarios from './Usuarios.jsx'

const SECOES = [
  { id: 'status', label: 'Veículos' },
  { id: 'colaboradores', label: 'Colaboradores' },
  { id: 'km', label: 'Veículos KM' },
  { id: 'tarefas', label: 'Tarefas' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'config', label: 'Config. veículos' },
  { id: 'usuarios', label: 'Administradores' },
]

export default function AdminApp({ onLogout }) {
  const [secao, setSecao] = useState('status')

  return (
    <div className="app-shell">
      <div className="stripe-band" />
      <div className="topbar">
        <div className="eyebrow">Frota · Admin</div>
        <div className="topbar-row">
          <h1>Painel</h1>
          <button className="icon-btn" onClick={onLogout}>Sair</button>
        </div>
      </div>

      <div className="content" style={{ paddingTop: 16 }}>
        <div className="pill-row">
          {SECOES.map((s) => (
            <button
              key={s.id}
              className={`pill ${secao === s.id ? 'active' : ''}`}
              onClick={() => setSecao(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {secao === 'status' && <VeiculosStatus />}
        {secao === 'colaboradores' && <Colaboradores />}
        {secao === 'km' && <VeiculosKm />}
        {secao === 'tarefas' && <Tarefas />}
        {secao === 'checklist' && <Checklist />}
        {secao === 'config' && <ConfigVeiculos />}
        {secao === 'usuarios' && <Usuarios />}
      </div>
    </div>
  )
}
