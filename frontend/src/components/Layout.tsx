import { Link, useNavigate } from 'react-router-dom'
import { authStore } from '../store/authStore'
import { logout } from '../lib/api'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const isAuthenticated = authStore.isAuthenticated
  const user = authStore.user

  const handleLogout = async () => {
    await logout()
    authStore.clearAuth()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        backgroundColor: '#333', 
        color: 'white', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Campus Marketplace
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          {isAuthenticated ? (
            <>
              <Link to="/my-items" style={{ color: 'white', textDecoration: 'none' }}>My Items</Link>
              <span style={{ fontSize: '0.9rem' }}>Hello, {user?.username}</span>
              <button 
                onClick={handleLogout}
                style={{ 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.5rem 1rem', 
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
              <Link to="/signup" style={{ color: 'white', textDecoration: 'none' }}>Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        {children}
      </main>
      <footer style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1rem 2rem', 
        textAlign: 'center',
        borderTop: '1px solid #dee2e6'
      }}>
        <p style={{ margin: 0, color: '#6c757d' }}>&copy; 2025 Campus Marketplace</p>
      </footer>
    </div>
  )
}

