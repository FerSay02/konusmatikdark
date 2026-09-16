import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SiteLoader from './components/SiteLoader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <App />
      <SiteLoader />
    </>
  </StrictMode>,
)
