import { Routes, Route } from 'react-router';
import './App.css'
import { LoginPage } from './pages/login/LoginPage'
import { HomePage } from './pages/home/HomePage'

function App() {

  return (
    <>
      <Routes>
        <Route index element={<LoginPage />} />
        <Route path="homepage" element={<HomePage />} />
        <Route path="" element={<></>} />
      </Routes>
    </>
  )
}

export default App
