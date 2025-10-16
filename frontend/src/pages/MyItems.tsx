import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getMyItems } from '../lib/api'
import { authStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function MyItems() {
  const navigate = useNavigate()
  
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['myItems'],
    queryFn: getMyItems,
    enabled: authStore.isAuthenticated,
  })

  if (!authStore.isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Please log in to view your items.</p>
        <Link to="/login">Login</Link>
      </div>
    )
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading your items...</div>
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
      Error loading items: {error instanceof Error ? error.message : 'Unknown error'}
    </div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Items</h1>
        <button
          onClick={() => navigate('/create-item')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          + Create New Listing
        </button>
      </div>

      {items && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>You haven't created any listings yet.</p>
          <button
            onClick={() => navigate('/create-item')}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {items?.map((item) => (
            <Link 
              key={item.id} 
              to={`/items/${item.id}`}
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block'
              }}
            >
              <div style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: '8px', 
                padding: '1rem',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                {item.item_url && (
                  <img 
                    src={item.item_url} 
                    alt={item.title}
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '1rem'
                    }}
                  />
                )}
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{item.title}</h3>
                <p style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#6c757d', 
                  fontSize: '0.9rem',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    padding: '0.25rem 0.5rem',
                    backgroundColor: item.status === 'available' ? '#d4edda' : '#f8d7da',
                    borderRadius: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {item.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

