import { UserLogin, UserCreate, Token, User, Item } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function login(credentials: UserLogin): Promise<Token> {
  return apiRequest<Token>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function signup(userData: UserCreate): Promise<User> {
  return apiRequest<User>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/api/auth/me')
}

export interface ItemSearchParams {
  search?: string
  category?: string
  condition?: string
  min_price?: number
  max_price?: number
  status?: string
}

export async function getItems(): Promise<Item[]> {
  return apiRequest<Item[]>('/api/items/')
}

export async function searchItems(params: ItemSearchParams): Promise<Item[]> {
  const queryParams = new URLSearchParams()
  
  if (params.search) queryParams.append('search', params.search)
  if (params.category) queryParams.append('category', params.category)
  if (params.condition) queryParams.append('condition', params.condition)
  if (params.min_price !== undefined) queryParams.append('min_price', params.min_price.toString())
  if (params.max_price !== undefined) queryParams.append('max_price', params.max_price.toString())
  if (params.status) queryParams.append('status', params.status)

  const queryString = queryParams.toString()
  const endpoint = queryString ? `/api/items/?${queryString}` : '/api/items/'
  
  return apiRequest<Item[]>(endpoint)
}

export async function getItem(itemId: number): Promise<Item> {
  return apiRequest<Item>(`/api/items/${itemId}`)
}

export async function getMyItems(): Promise<Item[]> {
  return apiRequest<Item[]>('/api/items/my-items')
}

export interface ItemCreate {
  title: string
  description: string
  price: number
  condition: string
  category: string
  location?: string
  is_negotiable?: boolean
  item_url?: string
}

export async function createItem(itemData: ItemCreate): Promise<Item> {
  return apiRequest<Item>('/api/items/', {
    method: 'POST',
    body: JSON.stringify(itemData),
  })
}

export async function uploadFile(file: File, folder: string = 'uploads'): Promise<string> {
  const token = localStorage.getItem('access_token')
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || `Upload error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data.s3_url
}

