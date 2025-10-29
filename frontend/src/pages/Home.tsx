import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { searchItems, ItemSearchParams } from '../lib/api'
import { Item, ItemCategory, ItemCondition } from '../types'
import { Link } from 'react-router-dom'

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCondition, setSelectedCondition] = useState<string>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const searchParams: ItemSearchParams = {}
  if (searchTerm) searchParams.search = searchTerm
  if (selectedCategory) searchParams.category = selectedCategory
  if (selectedCondition) searchParams.condition = selectedCondition
  if (minPrice && !isNaN(parseFloat(minPrice))) searchParams.min_price = parseFloat(minPrice)
  if (maxPrice && !isNaN(parseFloat(maxPrice))) searchParams.max_price = parseFloat(maxPrice)

  const { data: items, isLoading, error } = useQuery<Item[]>({
    queryKey: ['items', searchParams],
    queryFn: () => searchItems(searchParams),
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedCondition('')
    setMinPrice('')
    setMaxPrice('')
  }

  const hasActiveFilters = searchTerm || selectedCategory || selectedCondition || minPrice || maxPrice

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
      <h1 style={{ marginBottom: '1rem' }}>Browse Marketplace</h1>

      {/* Search and Filter UI */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '1rem'
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showFilters ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #dee2e6'
          }}>
            <div>
              <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
              >
                <option value="">All Categories</option>
                <option value={ItemCategory.TEXTBOOKS}>Textbooks</option>
                <option value={ItemCategory.ELECTRONICS}>Electronics</option>
                <option value={ItemCategory.FURNITURE}>Furniture</option>
                <option value={ItemCategory.CLOTHING}>Clothing</option>
                <option value={ItemCategory.SPORTS_FITNESS}>Sports & Fitness</option>
                <option value={ItemCategory.OTHER}>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="condition" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Condition
              </label>
              <select
                id="condition"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
              >
                <option value="">All Conditions</option>
                <option value={ItemCondition.NEW}>New</option>
                <option value={ItemCondition.LIKE_NEW}>Like New</option>
                <option value={ItemCondition.GOOD}>Good</option>
                <option value={ItemCondition.FAIR}>Fair</option>
                <option value={ItemCondition.POOR}>Poor</option>
              </select>
            </div>

            <div>
              <label htmlFor="minPrice" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Min Price ($)
              </label>
              <input
                id="minPrice"
                type="number"
                step="0.01"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
              />
            </div>

            <div>
              <label htmlFor="maxPrice" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Max Price ($)
              </label>
              <input
                id="maxPrice"
                type="number"
                step="0.01"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {items && (
        <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
          {items.length} {items.length === 1 ? 'item' : 'items'} found
          {hasActiveFilters && ' (filtered)'}
        </p>
      )}

      {/* Items Grid */}
      {items && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No items found matching your search criteria.</p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
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
                <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </div>
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

