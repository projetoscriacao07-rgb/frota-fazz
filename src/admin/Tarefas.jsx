import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, query, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { todayStr, yesterdayStr } from '../utils'

export default function Tarefas() {
  const [subaba, setSubaba] = useState('atribuir')
  const [colaboradores, setColaboradores] = useState([])
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
        <button className={`pill ${subaba === 'atribuir' ? 'active' : ''}`} onClick={() => { setSubaba('atribuir'); setSelecionado(null) }}>Atribuir</button>
        <button className={`pill ${subaba === 'historico' ? 'active' : ''}`} onClick={() => { setSubaba('historico'); setSelecionado(null) }}>Histórico</button>
        <button className={`pill ${subaba === 'pendencias' ? 'active' : ''}`} onClick={() => { setSubaba('pendencias'); setSelecionado(null) }}>Pendências</button>
      </div>

      {subaba === 'pendencias' && <Pendencias colaboradores={colaboradores} />}

      {subaba !== 'pendencias' && colaboradores.length === 0 && <div className="empty-state">Cadastre colaboradores primeiro.</div>}

      {subaba !== 'pendencias' && colaboradores.length > 0 && !selecionado && (
        <div>
          {colaboradores.map((c) => (
            <div key={c.id} className="list-item" onClick={() => setSelecionado(c)}>
              <div className="title">{c.nome}</div>
              <span className="badge badge-livre">Selecionar</span>
            </div>
          ))}
        </div>
      )}

      {selecionado && subaba === 'atribuir' && (
        <AtribuirTarefas colaborador={selecionado} onVoltar={() => setSelecionado(null)} />
      )}
      {selecionado && subaba === 'historico' && (
        <HistoricoPeriodo colaborador={selecionado} onVoltar={() => setSelecionado(null)} />
      )}
    </div>
  )
}

function Pendencias({ colaboradores }) {
  const [data, setData] = useState(yesterdayStr())
  const [tarefas, setTarefas] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'tarefasDiarias'),
      where('data', '==', data),
      where('concluida', '==', false)
    )
    const unsub = onSnapshot(q, (snap) => {
      setTarefas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [data])

  const nomes = {}
  colaboradores.forEach((c) => { nomes[c.id] = c.nome })

  return (
    <div>
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Ver pendências do dia</label>
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} max={todayStr()} />
        </div>
      </div>

      {tarefas === null && <div className="empty-state">Carregando…</div>}
      {tarefas?.length === 0 && <div className="empty-state">Ninguém ficou com tarefa pendente nesse dia. 🎉</div>}
      {tarefas?.map((t) => (
        <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
          <div>
            <div className="title">{t.texto}</div>
            <div className="meta">{nomes[t.colaboradorId] || '...'}</div>
          </div>
          <span className="badge badge-pendente">Pendente</span>
        </div>
      ))}
    </div>
  )
}

function AtribuirTarefas({ colaborador, onVoltar }) {
  const [data, setData] = useState(todayStr())
  const [texto, setTexto] = useState('')
  const [tarefas, setTarefas] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'tarefasDiarias'),
      where('colaboradorId', '==', colaborador.id),
      where('data', '==', data)
    )
    const unsub = onSnapshot(q, (snap) => {
      setTarefas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [colaborador.id, data])

  async function adicionar() {
    if (!texto.trim()) return
    await addDoc(collection(db, 'tarefasDiarias'), {
      colaboradorId: colaborador.id,
      texto: texto.trim(),
      data,
      concluida: false,
    })
    setTexto('')
  }

  async function excluir(id) {
    await deleteDoc(doc(db, 'tarefasDiarias', id))
  }

  return (
    <div>
      <button className="link-btn" onClick={onVoltar}>← Trocar colaborador</button>
      <h2 style={{ margin: '14px 0 16px' }}>{colaborador.nome}</h2>

      <div className="card">
        <div className="field">
          <label>Data</label>
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="field">
          <label>Nova tarefa</label>
          <input className="input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex: Organizar estoque" />
        </div>
        <button className="btn btn-primary" onClick={adicionar}>Adicionar tarefa</button>
      </div>

      {tarefas?.map((t) => (
        <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
          <div>
            <div className="title">{t.texto}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${t.concluida ? 'badge-feito' : 'badge-pendente'}`}>
              {t.concluida ? 'Concluída' : 'Pendente'}
            </span>
            <button className="btn btn-danger btn-small" onClick={() => excluir(t.id)}>Excluir</button>
          </div>
        </div>
      ))}
      {tarefas?.length === 0 && <div className="empty-state">Nenhuma tarefa nessa data.</div>}
    </div>
  )
}

function HistoricoPeriodo({ colaborador, onVoltar }) {
  const [inicio, setInicio] = useState(todayStr())
  const [fim, setFim] = useState(todayStr())
  const [tarefas, setTarefas] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'tarefasDiarias'), where('colaboradorId', '==', colaborador.id))
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t) => t.data >= inicio && t.data <= fim)
      lista.sort((a, b) => (a.data < b.data ? 1 : -1))
      setTarefas(lista)
    })
    return () => unsub()
  }, [colaborador.id, inicio, fim])

  return (
    <div>
      <button className="link-btn" onClick={onVoltar}>← Trocar colaborador</button>
      <h2 style={{ margin: '14px 0 16px' }}>{colaborador.nome}</h2>

      <div className="card" style={{ display: 'flex', gap: 10 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>De</label>
          <input className="input" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Até</label>
          <input className="input" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </div>

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
      {tarefas?.length === 0 && <div className="empty-state">Nenhuma tarefa no período.</div>}
    </div>
  )
}
