import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import Project from './Project'


 import './index.css'

import { Provider } from 'react-redux'
import { store } from './Redux/store'
import ToastHost from "./ui/ToastHost";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <Project />
      <ToastHost />
    </Provider>
  </StrictMode>,
)
