import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { formatDateTime } from '../utils'
import SeedButton from './SeedButton.jsx'

export default function Colaboradores() {
  const [subaba, setSubaba] = useState('lista')
  const [colaboradores, setColaboradores] = useState(null)
  const [selecionado, setSelecionado] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'colaboradores'), (snap) => {
      setColaboradores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  return (
    <div>
      <div className="pill-row">
        <button className={`pill ${subaba === 'lista' ? 'active' : ''}`} onClick={() => setSubaba('lista')}>Histórico</button>
        <button className={`pill ${subaba === 'gerenciar' ? 'active' : ''}`} onClick={() => setSubaba('gerenciar')}>Gerenciar</button>
      </div>

      {colaboradores !== null && colaboradores.length === 0 && (
        <div className="empty-state">
          Nenhum colaborador cadastrado.
          <div style={{ marginTop: 16 }}><SeedButton /></div>
        </div>
      )}

      {subaba === 'lista' && colaboradores?.length > 0 && (
        <div>
          {colaboradores.map((c) => (
            <div key={c.id} className="list-item" onClick={() => setSelecionado(c)}>
              <div>
                <div className="title">{c.nome}</div>
                <div className="meta">{c.uid ? 'Login vinculado' : 'Ainda não fez login'}</div>
              </div>
              <span className="badge badge-livre">Ver histórico</span>
            </div>
          ))}
        </div>
      )}

      {subaba === 'gerenciar' && <GerenciarColaboradores colaboradores={colaboradores || []} />}

      {selecionado && (
        <HistoricoColaborador colaborador={selecionado} onClose={() => setSelecionado(null)} />
      )}
    </div>
  )
}

function GerenciarColaboradores({ colaboradores }) {
  const [novoNome, setNovoNome] = useState('')
  const [editando, setEditando] = useState(null)

  async function adicionar() {
    if (!novoNome.trim()) return
    await addDoc(collection(db, 'colaboradores'), { nome: novoNome.trim(), uid: null })
    setNovoNome('')
  }

  async function salvarEdicao(id, nome) {
    await updateDoc(doc(db, 'colaboradores', id), { nome })
    setEditando(null)
  }

  async function excluir(id) {
    if (!confirm('Excluir esse colaborador? Isso não apaga o histórico dele.')) return
    await deleteDoc(doc(db, 'colaboradores', id))
  }

  return (
    <div>
      <div className="card">
        <div className="field">
          <label>Adicionar colaborador</label>
          <input className="input" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
        </div>
        <button className="btn btn-primary" onClick={adicionar}>Adicionar</button>
      </div>

      {colaboradores.map((c) => (
        <div key={c.id} className="list-item" style={{ cursor: 'default' }}>
          {editando === c.id ? (
            <EdicaoInline nomeInicial={c.nome} onSalvar={(nome) => salvarEdicao(c.id, nome)} onCancelar={() => setEditando(null)} />
          ) : (
            <>
              <div className="title">{c.nome}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-small" onClick={() => setEditando(c.id)}>Editar</button>
                <button className="btn btn-danger btn-small" onClick={() => excluir(c.id)}>Excluir</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function EdicaoInline({ nomeInicial, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(nomeInicial)
  return (
    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
      <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      <button className="btn btn-primary btn-small" onClick={() => onSalvar(nome)}>Salvar</button>
      <button className="btn btn-ghost btn-small" onClick={onCancelar}>×</button>
    </div>
  )
}

function HistoricoColaborador({ colaborador, onClose }) {
  const [registros, setRegistros] = useState(null)
  const [tarefas, setTarefas] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'registrosUso'), where('colaboradorId', '==', colaborador.id))
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      lista.sort((a, b) => (b.horaInicio?.seconds || 0) - (a.horaInicio?.seconds || 0))
      setRegistros(lista)
    })
    return () => unsub()
  }, [colaborador.id])

  useEffect(() => {
    const q = query(collection(db, 'tarefasDiarias'), where('colaboradorId', '==', colaborador.id))
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      lista.sort((a, b) => (a.data < b.data ? 1 : -1))
      setTarefas(lista)
    })
    return () => unsub()
  }, [colaborador.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ marginBottom: 16 }}>{colaborador.nome}</h2>

        <div className="section-title">Uso de veículos</div>
        {registros === null && <div className="empty-state">Carregando…</div>}
        {registros?.length === 0 && <div className="empty-state">Sem registros.</div>}
        {registros?.map((r) => (
          <div key={r.id} className="card" style={{ marginBottom: 8 }}>
            <div className="meta">{formatDateTime(r.horaInicio)} → {r.horaFim ? formatDateTime(r.horaFim) : 'em andamento'}</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>
              KM inicial: <strong>{r.kmInicial ?? '—'}</strong> · KM final: <strong>{r.kmFinal ?? '—'}</strong>
            </div>
          </div>
        ))}

        <div className="section-title">Tarefas</div>
        {tarefas === null && <div className="empty-state">Carregando…</div>}
        {tarefas?.length === 0 && <div className="empty-state">Sem tarefas registradas.</div>}
        {tarefas?.map((t) => (
          <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
            <div>
              <div className="title">{t.texto}</div>
              <div className="meta">{t.data}</div>
            </div>
            <span className={`badge ${t.concluida ? 'badge-feito' : 'badge-pendente'}`}>
              {t.concluida ? 'Concluída' : 'Pendente'}
            </span>
          </div>
        ))}

        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}
