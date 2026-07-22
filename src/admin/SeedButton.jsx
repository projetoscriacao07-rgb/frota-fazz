import { useState } from 'react'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const COLABORADORES_INICIAIS = [
  'Interno',
  'Eduardo Vicente',
  'Samuel Silva',
  'Luciano Castro',
  'Jime Hendraz',
]

const VEICULOS_INICIAIS = [
  { tipo: 'moto', marca: 'Honda', modelo: 'CG160', placa: 'ENN-6110' },
  { tipo: 'carro', marca: 'Chevrolet', modelo: 'Montana', placa: 'FMA-4C53' },
  { tipo: 'caminhao', marca: 'Iveco', modelo: 'Daily 35S14', placa: 'FQZ-8G47' },
  { tipo: 'caminhao', marca: 'Mercedes Benz', modelo: '311CDi Streeto', placa: 'FSY-0676' },
  { tipo: 'caminhao', marca: 'Iveco', modelo: 'Daily 35S14', placa: 'IXN-9G24' },
  { tipo: 'caminhao', marca: 'Iveco', modelo: 'Daily 35S14', placa: 'QIA-9I16' },
]

export default function SeedButton() {
  const [carregando, setCarregando] = useState(false)
  const [feito, setFeito] = useState(false)

  async function carregarDados() {
    setCarregando(true)
    const colabSnap = await getDocs(collection(db, 'colaboradores'))
    if (colabSnap.empty) {
      for (const nome of COLABORADORES_INICIAIS) {
        await addDoc(collection(db, 'colaboradores'), { nome, uid: null })
      }
    }
    const veicSnap = await getDocs(collection(db, 'veiculos'))
    if (veicSnap.empty) {
      for (const v of VEICULOS_INICIAIS) {
        await addDoc(collection(db, 'veiculos'), { ...v, emUsoPor: null })
      }
    }
    setCarregando(false)
    setFeito(true)
  }

  if (feito) return <div className="meta">Dados carregados! ✅</div>

  return (
    <button className="btn btn-orange" disabled={carregando} onClick={carregarDados}>
      {carregando ? 'Carregando…' : 'Carregar dados iniciais (colaboradores + veículos)'}
    </button>
  )
}
