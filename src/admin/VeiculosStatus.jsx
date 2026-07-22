import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { TIPOS_VEICULO } from '../utils'
import SeedButton from './SeedButton.jsx'

export default function VeiculosStatus() {
  const [veiculos, setVeiculos] = useState(null)
  const [colaboradores, setColaboradores] = useState({})

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

  if (veiculos === null) return <div className="empty-state">Carregando…</div>

  if (veiculos.length === 0) {
    return (
      <div className="empty-state">
        Nenhum veículo cadastrado ainda.
        <div style={{ marginTop: 16 }}>
          <SeedButton />
        </div>
      </div>
    )
  }

  const emUso = veiculos.filter((v) => v.emUsoPor).length

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{veiculos.length}</div>
          <div className="meta">Total</div>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#C0392B' }}>{emUso}</div>
          <div className="meta">Em uso</div>
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1F8A57' }}>{veiculos.length - emUso}</div>
          <div className="meta">Disponíveis</div>
        </div>
      </div>

      {TIPOS_VEICULO.map((tipo) => {
        const lista = veiculos.filter((v) => v.tipo === tipo.id)
        if (lista.length === 0) return null
        return (
          <div key={tipo.id}>
            <div className="section-title">{tipo.label}</div>
            {lista.map((v) => (
              <div key={v.id} className="list-item" style={{ cursor: 'default' }}>
                <div>
                  <div className="title">{v.marca} / {v.modelo}</div>
                  <div className="meta">Placa {v.placa}</div>
                </div>
                {v.emUsoPor ? (
                  <span className="badge badge-uso">{colaboradores[v.emUsoPor] || '...'}</span>
                ) : (
                  <span className="badge badge-livre">Disponível</span>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
