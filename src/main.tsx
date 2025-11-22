import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import './index.css'
import App from './App.tsx'
import Store from "./store/store.ts"

interface State {
  store: Store,
}

const store = new Store();

export const Context = createContext<State>({
  store,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Context.Provider value = {{
        store
      }}>
        <App />
      </Context.Provider>
    </BrowserRouter>
  </StrictMode>,
)
