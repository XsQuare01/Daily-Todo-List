import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import WidgetView from './WidgetView'

const isWidget = new URLSearchParams(window.location.search).get('mode') === 'widget'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWidget ? <WidgetView /> : <App />}
  </StrictMode>
)
