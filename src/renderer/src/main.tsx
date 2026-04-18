import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import WidgetView from './WidgetView'

const mode = new URLSearchParams(window.location.search).get('mode')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {mode === 'widget' ? <WidgetView /> : <App mode={mode === 'desktop' ? 'desktop' : 'popup'} />}
  </StrictMode>
)
