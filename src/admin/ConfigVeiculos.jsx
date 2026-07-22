import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { TIPOS_VEICULO } from '../utils'
import SeedButton from './SeedButton.jsx'

export default function ConfigVeiculos() {
  const [veiculos, setVeiculos] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'veiculos'), (snap) => {
      setVeiculos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  async function excluir(id) {
    if (!confirm('Excluir esse veículo? O histórico de uso dele será mantido.')) return
    await deleteDoc(doc(db, 'veiculos', id))
  }

  if (veiculos === null) return <div className="empty-state">Carregando…</div>

  return (
    <div>
      {veiculos.length === 0 && (
        <div className="empty-state">
          Nenhum veículo cadastrado.
          <div style={{ marginTop: 16 }}><SeedButton /></div>
        </div>
      )}

      {!mostrarForm && !editando && (
        <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => setMostrarForm(true)}>
          + Adicionar veículo
        </button>
      )}

      {mostrarForm && (
        <FormVeiculo onSalvar={() => setMostrarForm(false)} onCancelar={() => setMostrarForm(false)} />
      )}

      {veiculos.map((v) =>
        editando === v.id ? (
          <FormVeiculo
            key={v.id}
            veiculo={v}
            onSalvar={() => setEditando(null)}
            onCancelar={() => setEditando(null)}
          />
        ) : (
          <div key={v.id} className="list-item" style={{ cursor: 'default' }}>
            <div>
              <div className="title">{v.marca} / {v.modelo}</div>
              <div className="meta">{TIPOS_VEICULO.find((t) => t.id === v.tipo)?.label} · Placa {v.placa}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-small" onClick={() => setEditando(v.id)}>Editar</button>
              <button className="btn btn-danger btn-small" onClick={() => excluir(v.id)}>Excluir</button>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function FormVeiculo({ veiculo, onSalvar, onCancelar }) {
  const [tipo, setTipo] = useState(veiculo?.tipo || 'carro')
  const [marca, setMarca] = useState(veiculo?.marca || '')
  const [modelo, setModelo] = useState(veiculo?.modelo || '')
  const [placa, setPlaca] = useState(veiculo?.placa || '')

  async function salvar() {
    if (!marca.trim() || !modelo.trim() || !placa.trim()) return
    if (veiculo) {
      await updateDoc(doc(db, 'veiculos', veiculo.id), { tipo, marca, modelo, placa })
    } else {
      await addDoc(collection(db, 'veiculos'), { tipo, marca, modelo, placa, emUsoPor: null })
    }
    onSalvar()
  }

  return (
    <div className="card">
      <div className="field">
        <label>Tipo</label>
        <div className="pill-row" style={{ marginBottom: 0 }}>
          {TIPOS_VEICULO.map((t) => (
            <button key={t.id} type="button" className={`pill ${tipo === t.id ? 'active' : ''}`} onClick={() => setTipo(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Marca</label>
        <input className="input" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: Honda" />
      </div>
      <div className="field">
        <label>Modelo</label>
        <input className="input" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: CG160" />
      </div>
      <div className="field">
        <label>Placa</label>
        <input className="input" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="Ex: ENN-6110" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar}>Salvar</button>
      </div>
    </div>
  )
}
