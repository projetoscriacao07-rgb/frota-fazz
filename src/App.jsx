import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore'
import { auth, db } from './firebase'
import Login from './screens/Login.jsx'
import SelectColaborador from './screens/SelectColaborador.jsx'
import ColaboradorApp from './colaborador/ColaboradorApp.jsx'
import AdminApp from './admin/AdminApp.jsx'

export default function App() {
  const [authUser, setAuthUser] = useState(undefined) // undefined = carregando, null = deslogado
  const [perfil, setPerfil] = useState(null) // { role, colaboradorId }
  const [loadingPerfil, setLoadingPerfil] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthUser(u)
      if (!u) {
        setPerfil(null)
        setLoadingPerfil(false)
        return
      }
      await carregarOuCriarPerfil(u.uid, u.email)
    })
    return () => unsub()
  }, [])

  async function carregarOuCriarPerfil(uid, email) {
    setLoadingPerfil(true)
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      setPerfil(snap.data())
    } else {
      // Bootstrap: se ainda não existe nenhum usuário no sistema, o primeiro vira admin.
      const usersSnap = await getDocs(collection(db, 'users'))
      const role = usersSnap.empty ? 'admin' : 'colaborador'
      const novoPerfil = { role, colaboradorId: null, email: email || null }
      await setDoc(ref, novoPerfil)
      setPerfil(novoPerfil)
    }
    setLoadingPerfil(false)
  }

  function handleColaboradorVinculado(colaboradorId) {
    setPerfil((p) => ({ ...p, colaboradorId }))
  }

  async function handleLogout() {
    await signOut(auth)
  }

  if (authUser === undefined || (authUser && loadingPerfil)) {
    return (
      <div className="app-shell">
        <div className="loading-screen">Carregando…</div>
      </div>
    )
  }

  if (!authUser) {
    return <Login />
  }

  if (perfil?.role === 'admin') {
    return <AdminApp onLogout={handleLogout} />
  }

  if (!perfil?.colaboradorId) {
    return (
      <SelectColaborador
        uid={authUser.uid}
        onVinculado={handleColaboradorVinculado}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <ColaboradorApp
      colaboradorId={perfil.colaboradorId}
      onLogout={handleLogout}
    />
  )
}
