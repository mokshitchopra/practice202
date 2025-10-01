export enum UserRole {
  USER = "user",
  ADMIN = "admin"
}

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  phone?: string
  student_id: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at?: string
}

export interface TokenUserInfo {
  user_id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  is_verified: boolean
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: TokenUserInfo
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserCreate {
  email: string
  username: string
  password: string
  full_name: string
  phone?: string
  student_id: string
  role?: UserRole
}

export interface AuthState {
  user: TokenUserInfo | null
  token: string | null
  isAuthenticated: boolean
}

