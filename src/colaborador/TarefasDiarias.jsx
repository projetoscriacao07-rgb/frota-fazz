import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { todayStr, formatDate } from '../utils'

export default function TarefasDiarias({ colaboradorId }) {
  const [todas, setTodas] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'tarefasDiarias'), where('colaboradorId', '==', colaboradorId))
    const unsub = onSnapshot(q, (snap) => {
      setTodas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [colaboradorId])

  async function concluir(id) {
    await updateDoc(doc(db, 'tarefasDiarias', id), {
      concluida: true,
      concluidaEm: serverTimestamp(),
    })
  }

  if (todas === null) return <div className="empty-state">Carregando…</div>

  const hoje = todayStr()
  const atrasadas = todas
    .filter((t) => t.data < hoje && !t.concluida)
    .sort((a, b) => (a.data < b.data ? -1 : 1))
  const tarefasHoje = todas
    .filter((t) => t.data === hoje)
    .sort((a, b) => (a.concluida === b.concluida ? 0 : a.concluida ? 1 : -1))
  // Tarefas já atribuídas pra datas futuras — útil pra quem trabalha em dias
  // que o pessoal do admin não trabalha (ex: fim de semana) e não tem como
  // perguntar na hora o que vai ter depois. O gestor pode deixar uma
  // observação em cada uma (ex: prazo, contexto).
  const futuras = todas
    .filter((t) => t.data > hoje)
    .sort((a, b) => (a.data < b.data ? -1 : 1))

  return (
    <div>
      {atrasadas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ color: '#C0392B' }}>Atrasadas</div>
          {atrasadas.map((t) => (
            <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
              <div>
                <div className="title">{t.texto}</div>
                <div className="meta">{formatDate(new Date(t.data + 'T00:00:00'))}</div>
                {t.observacao && <div className="meta" style={{ fontStyle: 'italic' }}>{t.observacao}</div>}
              </div>
              <button className="btn btn-orange btn-small" onClick={() => concluir(t.id)}>
                Concluir
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">Hoje</div>
      {tarefasHoje.length === 0 && <div className="empty-state">Nenhuma tarefa para hoje. 🎉</div>}
      {tarefasHoje.map((t) => (
        <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
          <div>
            <div className="title" style={t.concluida ? { textDecoration: 'line-through', color: '#b0b0b0' } : undefined}>
              {t.texto}
            </div>
            {t.observacao && <div className="meta" style={{ fontStyle: 'italic' }}>{t.observacao}</div>}
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

      {futuras.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="section-title">Tarefas futuras</div>
          {futuras.map((t) => (
            <div key={t.id} className="list-item" style={{ cursor: 'default' }}>
              <div>
                <div className="title" style={{ color: '#8a8a8a' }}>{t.texto}</div>
                <div className="meta">{formatDate(new Date(t.data + 'T00:00:00'))}</div>
                {t.observacao && <div className="meta" style={{ fontStyle: 'italic' }}>{t.observacao}</div>}
              </div>
              <span className="badge badge-livre">Prévia</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
