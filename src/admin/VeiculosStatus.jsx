import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, doc, updateDoc,
  query, where, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { TIPOS_VEICULO } from '../utils'
import SeedButton from './SeedButton.jsx'

export default function VeiculosStatus() {
  const [veiculos, setVeiculos] = useState(null)
  const [colaboradores, setColaboradores] = useState({})
  const [liberando, setLiberando] = useState(null)

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

  // Proteção extra: se um veículo ficar preso "em uso" (ex: colaborador
  // perdeu a conexão no meio do processo), o admin consegue liberar na mão
  // sem precisar mexer direto no banco de dados.
  async function liberarVeiculo(v) {
    if (!confirm(`Liberar o veículo ${v.marca} / ${v.modelo}? Use isso só se ele estiver preso "em uso" por engano — o colaborador não vai conseguir informar o KM final desse uso depois.`)) return
    setLiberando(v.id)
    try {
      await updateDoc(doc(db, 'veiculos', v.id), { emUsoPor: null })
      const q = query(
        collection(db, 'registrosUso'),
        where('veiculoId', '==', v.id),
        where('horaFim', '==', null),
      )
      const snap = await getDocs(q)
      await Promise.all(
        snap.docs.map((d) => updateDoc(d.ref, {
          horaFim: serverTimestamp(),
          liberadoPeloAdmin: true,
        }))
      )
    } finally {
      setLiberando(null)
    }
  }

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-uso">{colaboradores[v.emUsoPor] || '...'}</span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      disabled={liberando === v.id}
                      onClick={() => liberarVeiculo(v)}
                    >
                      {liberando === v.id ? 'Liberando…' : 'Liberar'}
                    </button>
                  </div>
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
