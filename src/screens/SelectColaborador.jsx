import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

export default function SelectColaborador({ uid, onVinculado, onLogout }) {
  const [colaboradores, setColaboradores] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'colaboradores'), (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setColaboradores(lista)
    })
    return () => unsub()
  }, [])

  async function selecionar(colaboradorId) {
    setErro('')
    try {
      await runTransaction(db, async (tx) => {
        const colabRef = doc(db, 'colaboradores', colaboradorId)
        const colabSnap = await tx.get(colabRef)
        if (!colabSnap.exists() || colabSnap.data().uid) {
          throw new Error('Esse nome já foi selecionado por outra pessoa.')
        }
        tx.update(colabRef, { uid })
        tx.set(doc(db, 'users', uid), { role: 'colaborador', colaboradorId }, { merge: true })
      })
      onVinculado(colaboradorId)
    } catch (e) {
      setErro(e.message || 'Não foi possível vincular esse nome.')
    }
  }

  const disponiveis = colaboradores?.filter((c) => !c.uid) || []

  return (
    <div className="app-shell">
      <div className="stripe-band" />
      <div className="topbar">
        <div className="eyebrow">Frota</div>
        <div className="topbar-row">
          <h1>Quem é você?</h1>
          <button className="icon-btn" onClick={onLogout}>Sair</button>
        </div>
        <div className="sub">Selecione seu nome na lista abaixo</div>
      </div>
      <div className="content">
        {erro && <div className="error-msg">{erro}</div>}

        {colaboradores === null && <div className="empty-state">Carregando…</div>}

        {colaboradores !== null && disponiveis.length === 0 && (
          <div className="empty-state">
            Nenhum nome disponível no momento.<br />
            Fale com o administrador.
          </div>
        )}

        <div className="name-select-grid">
          {disponiveis.map((c) => (
            <button key={c.id} className="name-btn" onClick={() => selecionar(c.id)}>
              {c.nome}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
