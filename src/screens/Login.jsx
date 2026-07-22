import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase'

export default function Login() {
  const [modo, setModo] = useState('entrar') // 'entrar' | 'criar' | 'recuperar'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    try {
      if (modo === 'criar') {
        await createUserWithEmailAndPassword(auth, email, senha)
      } else {
        await signInWithEmailAndPassword(auth, email, senha)
      }
    } catch (e) {
      setErro(traduzErro(e.code))
    } finally {
      setCarregando(false)
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setAviso('Enviamos um e-mail com o link para redefinir sua senha. Confira sua caixa de entrada (e o spam).')
    } catch (e) {
      setErro(traduzErro(e.code))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="stripe-band" />
      <div className="login-screen">
        <img src="/logo.png" alt="Faz" style={{ width: 160, marginBottom: 18 }} />
        <div className="login-mark" style={{ fontSize: 28, marginBottom: 4 }}>FROTA</div>
        <div className="login-tag">Gestão de veículos &amp; tarefas</div>

        {erro && <div className="error-msg">{erro}</div>}
        {aviso && <div className="meta" style={{ background: '#E7F5EC', color: '#1F8A57', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{aviso}</div>}

        {modo === 'recuperar' ? (
          <form onSubmit={handleRecuperar} style={{ width: '100%' }}>
            <div className="field">
              <label>E-mail</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
              />
            </div>
            <button className="btn btn-primary" disabled={carregando}>
              Enviar link de recuperação
            </button>
            <button
              type="button"
              className="link-btn"
              style={{ marginTop: 16 }}
              onClick={() => { setModo('entrar'); setErro(''); setAviso('') }}
            >
              ← Voltar para o login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailSubmit} style={{ width: '100%' }}>
              <div className="field">
                <label>E-mail</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                />
              </div>
              <div className="field">
                <label>Senha</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button className="btn btn-primary" disabled={carregando}>
                {modo === 'criar' ? 'Criar conta' : 'Entrar'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button
                className="link-btn"
                onClick={() => { setModo(modo === 'criar' ? 'entrar' : 'criar'); setErro(''); setAviso('') }}
              >
                {modo === 'criar' ? 'Já tenho conta, entrar' : 'Não tenho conta, criar uma'}
              </button>
              {modo === 'entrar' && (
                <button className="link-btn" onClick={() => { setModo('recuperar'); setErro(''); setAviso('') }}>
                  Esqueci minha senha
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function traduzErro(code) {
  const mapa = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Conta não encontrada. Crie uma conta primeiro.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  }
  return mapa[code] || 'Algo deu errado. Tente novamente.'
}
