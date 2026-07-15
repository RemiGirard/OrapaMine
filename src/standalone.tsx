import { createRoot } from 'react-dom/client'
import { CooperativeMineGame } from './modules/orapa-mine/presentation/CooperativeMineGame'
import './styles.css'

const app = document.getElementById('app')

if (!app) {
  throw new Error('Missing standalone application root')
}

createRoot(app).render(<CooperativeMineGame />)
