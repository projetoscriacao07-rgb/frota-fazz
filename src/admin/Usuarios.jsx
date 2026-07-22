import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(null)
  const [colaboradores, setColaboradores] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsuarios(snap.docs.map((d) => ({ uid: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'colaboradores'), (snap) => {
      const mapa = {}
      snap.docs.forEach((d) => {
        if (d.data().uid) mapa[d.data().uid] = d.data().nome
      })
      setColaboradores(mapa)
    })
    return () => unsub()
  }, [])

  async function alternarAdmin(usuario) {
    const souEuMesmo = usuario.uid === auth.currentUser?.uid
    const novoRole = usuario.role === 'admin' ? 'colaborador' : 'admin'
    if (souEuMesmo && novoRole === 'colaborador') {
      if (!confirm('Você está prestes a remover o seu próprio acesso de administrador. Continuar?')) return
    }
    await updateDoc(doc(db, 'users', usuario.uid), { role: novoRole })
  }

  if (usuarios === null) return <div className="empty-state">Carregando…</div>

  return (
    <div>
      <p className="meta" style={{ marginBottom: 14 }}>
        Qualquer administrador pode promover ou remover o acesso de outras pessoas.
      </p>
      {usuarios.map((u) => (
        <div key={u.uid} className="list-item" style={{ cursor: 'default' }}>
          <div>
            <div className="title">{colaboradores[u.uid] || u.email || 'Sem nome'}</div>
            <div className="meta">{u.email || 'e-mail não disponível'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${u.role === 'admin' ? 'badge-feito' : 'badge-pendente'}`}>
              {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
            </span>
            <button className="btn btn-ghost btn-small" onClick={() => alternarAdmin(u)}>
              {u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
            </button>
          </div>
        </div>
      ))}
      {usuarios.length === 0 && <div className="empty-state">Ninguém fez login ainda.</div>}
    </div>
  )
}
