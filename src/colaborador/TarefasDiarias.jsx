import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { todayStr } from '../utils'

export default function TarefasDiarias({ colaboradorId }) {
  const [tarefas, setTarefas] = useState(null)

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

  async function concluir(id) {
    await updateDoc(doc(db, 'tarefasDiarias', id), {
      concluida: true,
      concluidaEm: serverTimestamp(),
    })
  }

  if (tarefas === null) return <div className="empty-state">Carregando…</div>

  if (tarefas.length === 0) {
    return <div className="empty-state">Nenhuma tarefa para hoje. 🎉</div>
  }

  return (
    <div>
      <div className="section-title">Hoje</div>
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
