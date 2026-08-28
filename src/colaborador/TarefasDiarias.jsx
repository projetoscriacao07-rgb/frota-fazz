import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { todayStr, formatDate } from '../utils'

export default function TarefasDiarias({ colaboradorId }) {
  const [tarefas, setTarefas] = useState(null)
  const [atrasadas, setAtrasadas] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'tarefasDiarias'),
      where('colaboradorId', '==', colaboradorId),
      where('data', '==', todayStr())
    )
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      lista.sort((a, b) => (a.concluida === b.concluida ? 0 : a.concluida ? 1 : -1))
      setTarefas(lista)
    })
    return () => unsub()
  }, [colaboradorId])

  // Tarefas de dias anteriores que ficaram sem marcar como concluídas.
  useEffect(() => {
    const q = query(
      collection(db, 'tarefasDiarias'),
      where('colaboradorId', '==', colaboradorId),
      where('concluida', '==', false)
    )
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t) => t.data < todayStr())
      lista.sort((a, b) => (a.data < b.data ? -1 : 1))
      setAtrasadas(lista)
    })
    return () => unsub()
  }, [colaboradorId])

  async function concluir(id) {
    await updateDoc(doc(db, 'tarefasDiarias', id), {
      concluida: true,
      concluidaEm: serverTimestamp(),
    })
  }

  if (tarefas === null) return <div className="empty-state">Carregando…</div>

  return (
    <div>
      {atrasadas && atrasadas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ color: '#C0392B' }}>Atrasadas</div>
          {atrasadas.map((t) => (
            <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
              <div>
                <div className="title">{t.texto}</div>
                <div className="meta">{formatDate(new Date(t.data + 'T00:00:00'))}</div>
              </div>
              <button className="btn btn-orange btn-small" onClick={() => concluir(t.id)}>
                Concluir
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Hoje</div>
      {tarefas.length === 0 && <div className="empty-state">Nenhuma tarefa para hoje. 🎉</div>}
      {tarefas.map((t) => (
        <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
          <div>
            <div className="title" style={t.concluida ? { textDecoration: 'line-through', color: '#b0b0b0' } : undefined}>
              {t.texto}
            </div>
          </div>
          {t.concluida ? (
            <span className="badge badge-feito">Concluída</span>
          ) : (
            <button className="btn btn-orange btn-small" onClick={() => concluir(t.id)}>
              Concluir
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
