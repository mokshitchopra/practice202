import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import ItemDetail from './pages/ItemDetail'
import CreateItem from './pages/CreateItem'
import MyItems from './pages/MyItems'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/items/:id" element={<Layout><ItemDetail /></Layout>} />
          <Route path="/create-item" element={<Layout><CreateItem /></Layout>} />
          <Route path="/my-items" element={<Layout><MyItems /></Layout>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

