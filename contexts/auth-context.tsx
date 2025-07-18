"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiService, type ClienteInfo, type RegisterRequest } from "@/lib/api"

interface AuthContextType {
  isAuthenticated: boolean
  cliente: ClienteInfo | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [cliente, setCliente] = useState<ClienteInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("access_token")
    if (token) {
      try {
        const clienteInfo = await apiService.verifyCliente()
        setCliente(clienteInfo)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem("access_token")
        setIsAuthenticated(false)
        setCliente(null)
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password })
      localStorage.setItem("access_token", response.access_token)

      const clienteInfo = await apiService.verifyCliente()
      setCliente(clienteInfo)
      setIsAuthenticated(true)
    } catch (error) {
      throw new Error("Credenciales inválidas")
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      await apiService.register(userData)
      // After successful registration, automatically log in
      await login(userData.email, userData.password)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error en el registro")
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    setIsAuthenticated(false)
    setCliente(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, cliente, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
