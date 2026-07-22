import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import TarefasDiarias from './TarefasDiarias.jsx'
import Veiculos from './Veiculos.jsx'
import ChecklistVeiculo from './ChecklistVeiculo.jsx'

export default function ColaboradorApp({ colaboradorId, onLogout }) {
  const [aba, setAba] = useState('tarefas')
  const [colaborador, setColaborador] = useState(null)
  // Estado do fluxo de retirada de veículo é mantido aqui (no pai) para que
  // trocar de aba não perca o progresso do km inicial/final em andamento.
  const [fluxoVeiculo, setFluxoVeiculo] = useState(null) // { veiculoId, etapa: 'km_inicial'|'km_final', kmInicial }

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'colaboradores', colaboradorId), (snap) => {
      if (snap.exists()) setColaborador({ id: snap.id, ...snap.data() })
    })
    return () => unsub()
  }, [colaboradorId])

  return (
    <div className="app-shell">
      <div className="stripe-band" />
      <div className="topbar">
        <div className="eyebrow">Frota</div>
        <div className="topbar-row">
          <h1>Olá, {colaborador?.nome?.split(' ')[0] || '…'}</h1>
          <button className="icon-btn" onClick={onLogout}>Sair</button>
        </div>
      </div>

      <div className="content">
        {aba === 'tarefas' && <TarefasDiarias colaboradorId={colaboradorId} />}
        {aba === 'veiculos' && (
          <Veiculos
            colaboradorId={colaboradorId}
            fluxo={fluxoVeiculo}
            setFluxo={setFluxoVeiculo}
          />
        )}
        {aba === 'checklist' && <ChecklistVeiculo colaboradorId={colaboradorId} />}
      </div>

      <div className="tabbar">
        <button className={`tab ${aba === 'tarefas' ? 'active' : ''}`} onClick={() => setAba('tarefas')}>
          <span className="glyph"><IconTarefas /></span>
          Tarefas do dia
        </button>
        <button className={`tab ${aba === 'veiculos' ? 'active' : ''}`} onClick={() => setAba('veiculos')}>
          <span className="glyph"><IconVeiculo /></span>
          Veículos
          {fluxoVeiculo && <Dot />}
        </button>
        <button className={`tab ${aba === 'checklist' ? 'active' : ''}`} onClick={() => setAba('checklist')}>
          <span className="glyph"><IconChecklist /></span>
          Checklist
        </button>
      </div>
    </div>
  )
}

function Dot() {
  return <span style={{ width: 6, height: 6, borderRadius: 100, background: '#F5A623', display: 'inline-block', marginLeft: 4 }} />
}

function IconTarefas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}
function IconVeiculo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 13l1.5-5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.4L21 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/>
      <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor"/>
    </svg>
  )
}
function IconChecklist() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
