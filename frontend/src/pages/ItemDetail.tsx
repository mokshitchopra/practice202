import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getItem } from '../lib/api'
import { authStore } from '../store/authStore'

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const itemId = id ? parseInt(id) : 0

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => getItem(itemId),
    enabled: !!itemId,
  })

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading item...</div>
  }

  if (error || !item) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'red' }}>Error loading item: {error instanceof Error ? error.message : 'Item not found'}</p>
        <Link to="/">Back to Home</Link>
      </div>
    )
  }

  const isOwner = authStore.user && item.seller_id === authStore.user.user_id.toString()

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem', color: '#007bff', textDecoration: 'none' }}>
        ← Back to listings
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        <div>
          {item.item_url ? (
            <img 
              src={item.item_url} 
              alt={item.title}
              style={{ 
                width: '100%', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              aspectRatio: '1',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              color: '#6c757d'
            }}>
              No image available
            </div>
          )}
        </div>

        <div>
          <h1 style={{ marginTop: 0 }}>{item.title}</h1>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '1rem' }}>
            ${item.price.toFixed(2)}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Status:</strong> <span style={{ 
              textTransform: 'capitalize',
              padding: '0.25rem 0.5rem',
              backgroundColor: item.status === 'available' ? '#d4edda' : '#f8d7da',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>{item.status}</span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Category:</strong> {item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Condition:</strong> {item.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>

          {item.location && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Location:</strong> {item.location}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <strong>Negotiable:</strong> {item.is_negotiable ? 'Yes' : 'No'}
          </div>

          {isOwner && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <p style={{ margin: 0 }}>This is your listing. You can edit it from your "My Items" page.</p>
            </div>
          )}

          {!isOwner && authStore.isAuthenticated && (
            <button 
              style={{ 
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Contact Seller
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Description</h2>
        <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{item.description}</p>
      </div>
    </div>
  )
}

