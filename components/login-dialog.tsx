"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User } from "lucide-react"

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginDialog({ isOpen, onClose, onSwitchToRegister }: LoginDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente",
      })
      onClose()
      setEmail("")
      setPassword("")
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: "Email o contraseña incorrectos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-gray-900">
            <User className="h-5 w-5 mr-2" />
            Iniciar Sesión
          </DialogTitle>
          <DialogDescription>Ingresa tus credenciales para acceder a tu cuenta</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <DialogFooter className="flex flex-col space-y-2">
            <div className="flex space-x-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-300 bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </div>
            <div className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Crear Cuenta
              </button>
            </div>
          </DialogFooter>
        </form>

        <div className="text-center text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-medium mb-2">Credenciales de prueba:</p>
          <p>Email: user@example.com</p>
          <p>Contraseña: string</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
