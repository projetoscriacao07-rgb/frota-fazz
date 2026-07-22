import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, doc, runTransaction,
  addDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { todayStr, TIPOS_VEICULO } from '../utils'

export default function Veiculos({ colaboradorId, fluxo, setFluxo }) {
  const [veiculos, setVeiculos] = useState(null)
  const [colaboradores, setColaboradores] = useState({})
  const [erro, setErro] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [salvando, setSalvando] = useState(false)

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

  async function selecionarVeiculo(veiculo) {
    setErro('')
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'veiculos', veiculo.id)
        const snap = await tx.get(ref)
        if (!snap.exists() || snap.data().emUsoPor) {
          throw new Error('Esse veículo acabou de ficar indisponível.')
        }
        tx.update(ref, { emUsoPor: colaboradorId })
      })
      const registroRef = await addDoc(collection(db, 'registrosUso'), {
        veiculoId: veiculo.id,
        colaboradorId,
        data: todayStr(),
        horaInicio: serverTimestamp(),
        kmInicial: null,
        kmFinal: null,
        horaFim: null,
      })
      setValorInput('')
      setFluxo({ veiculoId: veiculo.id, registroId: registroRef.id, etapa: 'km_inicial', veiculoLabel: labelVeiculo(veiculo) })
    } catch (e) {
      setErro(e.message)
    }
  }

  async function confirmarKmInicial() {
    if (valorInput === '') return
    setSalvando(true)
    await updateDoc(doc(db, 'registrosUso', fluxo.registroId), {
      kmInicial: Number(valorInput),
    })
    setSalvando(false)
    setValorInput('')
    setFluxo({ ...fluxo, etapa: 'km_final' })
  }

  async function finalizar() {
    if (valorInput === '') return
    setSalvando(true)
    await updateDoc(doc(db, 'registrosUso', fluxo.registroId), {
      kmFinal: Number(valorInput),
      horaFim: serverTimestamp(),
    })
    await updateDoc(doc(db, 'veiculos', fluxo.veiculoId), { emUsoPor: null })
    setSalvando(false)
    setValorInput('')
    setFluxo(null)
  }

  function labelVeiculo(v) {
    return `${v.marca} / ${v.modelo}`
  }

  if (veiculos === null) return <div className="empty-state">Carregando…</div>

  return (
    <div>
      {erro && <div className="error-msg">{erro}</div>}

      {TIPOS_VEICULO.map((tipo) => {
        const lista = veiculos.filter((v) => v.tipo === tipo.id)
        if (lista.length === 0) return null
        return (
          <div key={tipo.id}>
            <div className="section-title">{tipo.label}</div>
            {lista.map((v) => {
              const emUso = !!v.emUsoPor
              const meuVeiculo = v.emUsoPor === colaboradorId
              return (
                <div
                  key={v.id}
                  className={`list-item ${emUso && !meuVeiculo ? 'disabled' : ''}`}
                  onClick={() => !emUso && selecionarVeiculo(v)}
                >
                  <div>
                    <div className="title">{v.marca} / {v.modelo}</div>
                    <div className="meta">Placa {v.placa}</div>
                  </div>
                  {emUso ? (
                    <span className="badge badge-uso">
                      {meuVeiculo ? 'Com você' : `Em uso · ${colaboradores[v.emUsoPor] || '...'}`}
                    </span>
                  ) : (
                    <span className="badge badge-livre">Disponível</span>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {fluxo && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-handle" />
            <h2 style={{ marginBottom: 4 }}>{fluxo.veiculoLabel}</h2>
            <p style={{ color: '#8a8a8a', fontSize: 13, marginBottom: 20 }}>
              {fluxo.etapa === 'km_inicial' ? 'Informe o KM inicial' : 'Informe o KM final'}
            </p>
            <div className="field">
              <label>{fluxo.etapa === 'km_inicial' ? 'KM inicial' : 'KM final'}</label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                autoFocus
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                placeholder="Ex: 45210"
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={valorInput === '' || salvando}
              onClick={fluxo.etapa === 'km_inicial' ? confirmarKmInicial : finalizar}
            >
              {fluxo.etapa === 'km_inicial' ? 'Concluir' : 'Finalizar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
