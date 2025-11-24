import { UserLogin, UserCreate, Token, User, Item } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'

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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    // Handle network errors (connection refused, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend server is running.`
      )
    }
    // Re-throw other errors
    throw error
  }
}

export interface LoginResponse {
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  user?: TokenUserInfo
  temp_token?: string
  security_question?: string
  message?: string
  requires_security?: boolean
}

export async function login(credentials: UserLogin): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export interface AdminLoginStep1 {
  username: string
  password: string
}

export interface AdminLoginStep1Response {
  temp_token: string
  security_question: string
  message: string
}

export interface AdminSecurityAnswer {
  answer: string
}

export async function adminLoginStep1(credentials: AdminLoginStep1): Promise<AdminLoginStep1Response> {
  return apiRequest<AdminLoginStep1Response>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function adminLoginStep2(answer: AdminSecurityAnswer, tempToken: string): Promise<Token> {
  // Create headers without the default Authorization from localStorage
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tempToken.trim()}`
  }

  return apiRequest<Token>('/api/auth/admin/verify-security', {
    method: 'POST',
    headers,
    body: JSON.stringify(answer),
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

export interface UserUpdate {
  full_name?: string
  phone?: string
}

export async function getProfile(): Promise<User> {
  return apiRequest<User>('/api/users/profile')
}

export async function updateProfile(userData: UserUpdate): Promise<User> {
  return apiRequest<User>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  })
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

export interface ItemUpdate {
  title?: string
  description?: string
  price?: number
  condition?: string
  category?: string
  location?: string
  is_negotiable?: boolean
  status?: string
  item_url?: string
}

export async function updateItem(itemId: number, itemData: ItemUpdate): Promise<Item> {
  return apiRequest<Item>(`/api/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  })
}

export async function deleteItem(itemId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/items/${itemId}`, {
    method: 'DELETE',
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
  // Support both s3_url (S3) and file_url (local storage)
  return result.data.file_url || result.data.s3_url
}

// Admin API functions
export interface AdminStats {
  users: {
    total: number
    active: number
    sellers: number
    recent_registrations: number
  }
  listings: {
    total: number
    active: number
    sold: number
    reserved: number
    recent: number
  }
  category_breakdown: Record<string, number>
  status_breakdown: Record<string, number>
}

export interface Seller extends User {
  listing_count: number
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/api/admin/stats')
}

export async function getAllUsers(): Promise<User[]> {
  return apiRequest<User[]>('/api/admin/users')
}

export async function getSellers(): Promise<Seller[]> {
  return apiRequest<Seller[]>('/api/admin/sellers')
}

export async function deleteUser(userId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function getAllItemsAdmin(status?: string): Promise<Item[]> {
  const params = new URLSearchParams()
  if (status) {
    params.append('status', status)
  }
  const queryString = params.toString()
  return apiRequest<Item[]>(`/api/items/admin/all${queryString ? `?${queryString}` : ''}`)
}

export interface AdminPasswordReset {
  new_password: string
  confirm_password: string
}

export async function resetUserPassword(userId: number, passwordData: AdminPasswordReset): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  })
}

export interface AdminSecurityAnswerVerify {
  answer: string
}

export async function verifyAdminSecurityAnswer(userId: number, answer: AdminSecurityAnswerVerify): Promise<{ message: string; verified: boolean }> {
  return apiRequest<{ message: string; verified: boolean }>(`/api/admin/users/${userId}/verify-security`, {
    method: 'POST',
    body: JSON.stringify(answer),
  })
}

export interface AdminSecurityAnswerUpdate {
  new_answer: string
  confirm_answer: string
}

export async function updateAdminSecurityAnswer(userId: number, securityData: AdminSecurityAnswerUpdate): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/users/${userId}/update-security-answer`, {
    method: 'PUT',
    body: JSON.stringify(securityData),
  })
}

