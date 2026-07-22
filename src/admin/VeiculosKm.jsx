import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { formatDateTime, TIPOS_VEICULO } from '../utils'

export default function VeiculosKm() {
  const [veiculos, setVeiculos] = useState(null)
  const [colaboradores, setColaboradores] = useState({})
  const [selecionado, setSelecionado] = useState(null)

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

  return (
    <div>
      {TIPOS_VEICULO.map((tipo) => {
        const lista = veiculos.filter((v) => v.tipo === tipo.id)
        if (lista.length === 0) return null
        return (
          <div key={tipo.id}>
            <div className="section-title">{tipo.label}</div>
            {lista.map((v) => (
              <div key={v.id} className="list-item" onClick={() => setSelecionado(v)}>
                <div>
                  <div className="title">{v.marca} / {v.modelo}</div>
                  <div className="meta">Placa {v.placa}</div>
                </div>
                <span className="badge badge-livre">Ver registros</span>
              </div>
            ))}
          </div>
        )
      })}

      {selecionado && (
        <RegistrosVeiculo veiculo={selecionado} colaboradores={colaboradores} onClose={() => setSelecionado(null)} />
      )}
    </div>
  )
}

function RegistrosVeiculo({ veiculo, colaboradores, onClose }) {
  const [registros, setRegistros] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'registrosUso'), where('veiculoId', '==', veiculo.id))
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      lista.sort((a, b) => (b.horaInicio?.seconds || 0) - (a.horaInicio?.seconds || 0))
      setRegistros(lista)
    })
    return () => unsub()
  }, [veiculo.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 style={{ marginBottom: 4 }}>{veiculo.marca} / {veiculo.modelo}</h2>
        <p style={{ color: '#8a8a8a', fontSize: 13, marginBottom: 16 }}>Placa {veiculo.placa}</p>

        {registros === null && <div className="empty-state">Carregando…</div>}
        {registros?.length === 0 && <div className="empty-state">Nenhum registro ainda.</div>}
        {registros?.map((r) => (
          <div key={r.id} className="card" style={{ marginBottom: 8 }}>
            <div className="title" style={{ fontSize: 14 }}>{colaboradores[r.colaboradorId] || '...'}</div>
            <div className="meta">{formatDateTime(r.horaInicio)} → {r.horaFim ? formatDateTime(r.horaFim) : 'em andamento'}</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>
              KM inicial: <strong>{r.kmInicial ?? '—'}</strong> · KM final: <strong>{r.kmFinal ?? '—'}</strong>
              {r.kmInicial != null && r.kmFinal != null && (
                <> · Rodado: <strong>{r.kmFinal - r.kmInicial} km</strong></>
              )}
            </div>
          </div>
        ))}

        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  )
}
