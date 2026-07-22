// ============================================================
// COLE AQUI AS CHAVES DO SEU PROJETO FIREBASE
// Veja no README.md como conseguir esses valores (é grátis).
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAF7TW1hcJ8N9h6UQc5qn8OCCpWgi0u4dc",
  authDomain: "frota-f.firebaseapp.com",
  projectId: "frota-f",
  storageBucket: "frota-f.firebasestorage.app",
  messagingSenderId: "895347602337",
  appId: "1:895347602337:web:7a59f8651cb1d69152d1e0",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
