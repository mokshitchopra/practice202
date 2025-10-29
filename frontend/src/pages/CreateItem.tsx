import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createItem, uploadFile } from '../lib/api'
import { ItemCategory, ItemCondition } from '../types'

export default function CreateItem() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: ItemCondition.GOOD,
    category: ItemCategory.OTHER,
    location: '',
    is_negotiable: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      navigate('/my-items')
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({ ...formData, [name]: checked })
    } else if (name === 'price') {
      setFormData({ ...formData, [name]: value })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title || !formData.description || !formData.price) {
      setError('Please fill in all required fields')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price')
      return
    }

    let imageUrl: string | undefined

    if (selectedFile) {
      setUploading(true)
      try {
        imageUrl = await uploadFile(selectedFile, 'items')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    mutation.mutate({
      title: formData.title,
      description: formData.description,
      price: price,
      condition: formData.condition,
      category: formData.category,
      location: formData.location || undefined,
      is_negotiable: formData.is_negotiable,
      item_url: imageUrl,
    })
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Listing</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="price" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Price ($) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          >
            <option value={ItemCategory.TEXTBOOKS}>Textbooks</option>
            <option value={ItemCategory.ELECTRONICS}>Electronics</option>
            <option value={ItemCategory.FURNITURE}>Furniture</option>
            <option value={ItemCategory.CLOTHING}>Clothing</option>
            <option value={ItemCategory.SPORTS_FITNESS}>Sports & Fitness</option>
            <option value={ItemCategory.OTHER}>Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="condition" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Condition *
          </label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          >
            <option value={ItemCondition.NEW}>New</option>
            <option value={ItemCondition.LIKE_NEW}>Like New</option>
            <option value={ItemCondition.GOOD}>Good</option>
            <option value={ItemCondition.FAIR}>Fair</option>
            <option value={ItemCondition.POOR}>Poor</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="location" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Location (optional)
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., San Jose State University"
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Item Image (optional)
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
          {imagePreview && (
            <div style={{ marginTop: '0.5rem' }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '200px', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }} 
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  setImagePreview(null)
                }}
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="is_negotiable"
              checked={formData.is_negotiable}
              onChange={handleChange}
            />
            <span>Price is negotiable</span>
          </label>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={mutation.isPending || uploading}
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (mutation.isPending || uploading) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: (mutation.isPending || uploading) ? 0.6 : 1
            }}
          >
            {(mutation.isPending || uploading) ? (uploading ? 'Uploading...' : 'Creating...') : 'Create Listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

