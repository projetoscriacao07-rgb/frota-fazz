import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { weekId, TIPOS_VEICULO } from '../utils'

export default function ChecklistVeiculo({ colaboradorId }) {
  const [veiculos, setVeiculos] = useState(null)
  const [modelos, setModelos] = useState({})
  const [realizados, setRealizados] = useState({})
  const [colaboradores, setColaboradores] = useState({})
  const [aberto, setAberto] = useState(null) // veiculo selecionado
  const [respostas, setRespostas] = useState({}) // { [tarefaId]: { status, observacao } }
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const semana = weekId()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'veiculos'), (snap) => {
      setVeiculos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checklistModelos'), (snap) => {
      const mapa = {}
      snap.docs.forEach((d) => (mapa[d.id] = d.data()))
      setModelos(mapa)
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

  function abrir(v) {
    const modelo = modelos[v.tipo]
    if (!modelo || !modelo.tarefas?.length) return
    const iniciais = {}
    modelo.tarefas.forEach((t) => (iniciais[t.id] = { status: null, observacao: '' }))
    setRespostas(iniciais)
    setErro('')
    setAberto(v)
  }

  function marcar(tarefaId, status) {
    setRespostas((r) => ({ ...r, [tarefaId]: { ...r[tarefaId], status } }))
  }

  function atualizarObservacao(tarefaId, texto) {
    setRespostas((r) => ({ ...r, [tarefaId]: { ...r[tarefaId], observacao: texto } }))
  }

  async function enviar() {
    const modelo = modelos[aberto.tipo]
    const faltando = modelo.tarefas.some((t) => !respostas[t.id]?.status)
    if (faltando) {
      setErro('Marque "Concluído" ou "Não realizado" em todas as tarefas.')
      return
    }
    const semJustificativa = modelo.tarefas.some(
      (t) => respostas[t.id]?.status === 'nao_realizado' && !respostas[t.id]?.observacao?.trim()
    )
    if (semJustificativa) {
      setErro('Toda tarefa marcada como "Não realizado" precisa de uma observação explicando o motivo.')
      return
    }
    setErro('')
    setSalvando(true)
    const tarefas = modelo.tarefas.map((t) => ({
      texto: t.texto,
      status: respostas[t.id].status,
      observacao: respostas[t.id].observacao?.trim() || '',
    }))
    await addDoc(collection(db, 'checklistRealizados'), {
      veiculoId: aberto.id,
      semana,
      colaboradorId,
      tarefas,
      dataRealizacao: serverTimestamp(),
    })
    setSalvando(false)
    setAberto(null)
  }

  if (veiculos === null) return <div className="empty-state">Carregando…</div>

  return (
    <div>
      {TIPOS_VEICULO.map((tipo) => {
        const lista = veiculos.filter((v) => v.tipo === tipo.id)
        if (lista.length === 0) return null
        return (
          <div key={tipo.id}>
            <div className="section-title">{tipo.label}</div>
            {lista.map((v) => {
              const feito = realizados[v.id]
              return (
                <div key={v.id} className="list-item" onClick={() => !feito && abrir(v)}>
                  <div>
                    <div className="title">{v.marca} / {v.modelo}</div>
                    <div className="meta">
                      Placa {v.placa}
                      {feito && ` · feito por ${colaboradores[feito.colaboradorId] || '...'}`}
                    </div>
                  </div>
                  <span className={`badge ${feito ? 'badge-feito' : 'badge-pendente'}`}>
                    {feito ? 'Realizado' : 'Pendente'}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}

      {aberto && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-handle" />
            <h2 style={{ marginBottom: 4 }}>{aberto.marca} / {aberto.modelo}</h2>
            <p style={{ color: '#8a8a8a', fontSize: 13, marginBottom: 16 }}>
              Checklist semanal — placa {aberto.placa}
            </p>

            {erro && <div className="error-msg">{erro}</div>}

            {modelos[aberto.tipo]?.tarefas?.map((t) => {
              const resp = respostas[t.id] || {}
              return (
                <div key={t.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 8 }}>{t.texto}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button
                      type="button"
                      className={resp.status === 'concluido' ? 'btn btn-primary btn-small' : 'btn btn-ghost btn-small'}
                      style={resp.status === 'concluido' ? { background: '#1F8A57' } : undefined}
                      onClick={() => marcar(t.id, 'concluido')}
                    >
                      ✓ Concluído
                    </button>
                    <button
                      type="button"
                      className={resp.status === 'nao_realizado' ? 'btn btn-danger btn-small' : 'btn btn-ghost btn-small'}
                      onClick={() => marcar(t.id, 'nao_realizado')}
                    >
                      ✕ Não realizado
                    </button>
                  </div>
                  {resp.status && (
                    <textarea
                      className="input"
                      rows={2}
                      placeholder={resp.status === 'nao_realizado' ? 'Explique o motivo (obrigatório)' : 'Observação (opcional)'}
                      value={resp.observacao || ''}
                      onChange={(e) => atualizarObservacao(t.id, e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  )}
                </div>
              )
            })}

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost" onClick={() => setAberto(null)}>Cancelar</button>
              <button className="btn btn-primary" disabled={salvando} onClick={enviar}>
                Enviar checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
