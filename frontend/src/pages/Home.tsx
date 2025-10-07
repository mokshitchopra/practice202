import { useQuery } from '@tanstack/react-query'
import { getItems } from '../lib/api'
import { Item } from '../types'
import { Link } from 'react-router-dom'

export default function Home() {
  const { data: items, isLoading, error } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: getItems,
  })

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading items...</div>
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
      Error loading items: {error instanceof Error ? error.message : 'Unknown error'}
    </div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Browse Marketplace</h1>
      {items && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No items available at the moment.</p>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: '#6c757d',
                    textTransform: 'capitalize'
                  }}>
                    {item.category.replace('_', ' ')}
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

