import { useEffect, useState } from 'react'
import {
  doc, onSnapshot, setDoc, collection, query, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { weekId, formatDateTime, TIPOS_VEICULO } from '../utils'

export default function Checklist() {
  const [subaba, setSubaba] = useState('gerenciar')

  return (
    <div>
      <div className="pill-row">
        <button className={`pill ${subaba === 'gerenciar' ? 'active' : ''}`} onClick={() => setSubaba('gerenciar')}>Gerenciar checklist</button>
        <button className={`pill ${subaba === 'realizados' ? 'active' : ''}`} onClick={() => setSubaba('realizados')}>Checklist realizados</button>
      </div>

      {subaba === 'gerenciar' && <GerenciarModelos />}
      {subaba === 'realizados' && <ChecklistsRealizados />}
    </div>
  )
}

function GerenciarModelos() {
  const [tipo, setTipo] = useState('carro')
  const [tarefas, setTarefas] = useState([])
  const [texto, setTexto] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'checklistModelos', tipo), (snap) => {
      setTarefas(snap.exists() ? snap.data().tarefas || [] : [])
    })
    return () => unsub()
  }, [tipo])

  async function adicionar() {
    if (!texto.trim()) return
    const nova = { id: crypto.randomUUID(), texto: texto.trim() }
    await setDoc(doc(db, 'checklistModelos', tipo), { tarefas: [...tarefas, nova] })
    setTexto('')
  }

  async function excluir(id) {
    await setDoc(doc(db, 'checklistModelos', tipo), { tarefas: tarefas.filter((t) => t.id !== id) })
  }

  async function editar(id, novoTexto) {
    await setDoc(doc(db, 'checklistModelos', tipo), {
      tarefas: tarefas.map((t) => (t.id === id ? { ...t, texto: novoTexto } : t)),
    })
  }

  return (
    <div>
      <div className="pill-row">
        {TIPOS_VEICULO.map((t) => (
          <button key={t.id} className={`pill ${tipo === t.id ? 'active' : ''}`} onClick={() => setTipo(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="field">
          <label>Nova tarefa do checklist — {TIPOS_VEICULO.find((t) => t.id === tipo).label}</label>
          <input className="input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex: Verificar óleo" />
        </div>
        <button className="btn btn-primary" onClick={adicionar}>Adicionar</button>
      </div>

      {tarefas.map((t) => (
        <TarefaModeloItem key={t.id} tarefa={t} onEditar={editar} onExcluir={excluir} />
      ))}
      {tarefas.length === 0 && <div className="empty-state">Nenhuma tarefa nesse modelo ainda.</div>}
    </div>
  )
}

function TarefaModeloItem({ tarefa, onEditar, onExcluir }) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(tarefa.texto)

  if (editando) {
    return (
      <div className="list-item" style={{ cursor: 'default' }}>
        <input className="input" value={texto} onChange={(e) => setTexto(e.target.value)} style={{ marginRight: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-small" onClick={() => { onEditar(tarefa.id, texto); setEditando(false) }}>Salvar</button>
          <button className="btn btn-ghost btn-small" onClick={() => setEditando(false)}>×</button>
        </div>
      </div>
    )
  }

  return (
    <div className="list-item" style={{ cursor: 'default' }}>
      <div className="title">{tarefa.texto}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-small" onClick={() => setEditando(true)}>Editar</button>
        <button className="btn btn-danger btn-small" onClick={() => onExcluir(tarefa.id)}>Excluir</button>
      </div>
    </div>
  )
}

function ChecklistsRealizados() {
  const [veiculos, setVeiculos] = useState(null)
  const [realizados, setRealizados] = useState({})
  const [colaboradores, setColaboradores] = useState({})
  const [selecionado, setSelecionado] = useState(null)
  const semana = weekId()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'veiculos'), (snap) => {
      setVeiculos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'colaboradores'), (snap) => {
      const mapa = {}
      snap.docs.forEach((d) => (mapa[d.id] = d.data().nome))
      setColaboradores(mapa)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'checklistRealizados'), where('semana', '==', semana))
    const unsub = onSnapshot(q, (snap) => {
      const mapa = {}
      snap.docs.forEach((d) => (mapa[d.data().veiculoId] = { id: d.id, ...d.data() }))
      setRealizados(mapa)
    })
    return () => unsub()
  }, [semana])

  if (veiculos === null) return <div className="empty-state">Carregando…</div>

  return (
    <div>
      <p className="meta" style={{ marginBottom: 12 }}>Semana atual: {semana}</p>
      {veiculos.map((v) => {
        const feito = realizados[v.id]
        const temObservacao = feito?.tarefas?.some((t) => t.observacao)
        return (
          <div key={v.id} className="list-item" onClick={() => feito && setSelecionado({ v, feito })}>
            <div>
              <div className="title">{v.marca} / {v.modelo}</div>
              <div className="meta">Placa {v.placa}</div>
            </div>
            <span className={`badge ${feito ? 'badge-feito' : 'badge-pendente'}`}>
              {feito ? (temObservacao ? 'Realizado · 💬' : 'Realizado') : 'Pendente'}
            </span>
          </div>
        )
      })}

      {selecionado && (
        <div className="modal-overlay" onClick={() => setSelecionado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 style={{ marginBottom: 4 }}>{selecionado.v.marca} / {selecionado.v.modelo}</h2>
            <p className="meta" style={{ marginBottom: 16 }}>
              Feito por {colaboradores[selecionado.feito.colaboradorId] || '...'} em {formatDateTime(selecionado.feito.dataRealizacao)}
            </p>
            {selecionado.feito.tarefas.map((t, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10, marginBottom: 10 }}>
                <div className="checklist-row" style={{ borderBottom: 'none', padding: '4px 0' }}>
                  <span style={{ color: (t.status || (t.concluida ? 'concluido' : 'nao_realizado')) === 'concluido' ? '#1F8A57' : '#C0392B', fontWeight: 700 }}>
                    {(t.status || (t.concluida ? 'concluido' : 'nao_realizado')) === 'concluido' ? '✓' : '✕'}
                  </span>
                  {t.texto}
                </div>
                {t.observacao && (
                  <div className="meta" style={{ marginLeft: 30, marginTop: 2, fontStyle: 'italic' }}>
                    "{t.observacao}"
                  </div>
                )}
              </div>
            ))}
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => setSelecionado(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}
