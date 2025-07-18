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
import { GoogleMapSelector } from "@/components/google-map-selector"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, MapPin, Navigation } from "lucide-react"

interface RegisterDialogProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export function RegisterDialog({ isOpen, onClose, onSwitchToLogin }: RegisterDialogProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    direccion: "",
    coordenadas: "",
    password: "",
    confirmPassword: "",
  })
  const [selectedAddress, setSelectedAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenMap = () => {
    setIsMapOpen(true)
  }

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    setFormData((prev) => ({ ...prev, coordenadas: coordinates }))

    if (address) {
      setSelectedAddress(address)
      // Auto-fill address field if it's empty
      if (!formData.direccion.trim()) {
        setFormData((prev) => ({ ...prev, direccion: address }))
      }
    }

    toast({
      title: "Ubicación seleccionada",
      description: address ? "Dirección y coordenadas actualizadas" : "Coordenadas actualizadas",
    })
  }

  const handleMapClose = () => {
    setIsMapOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error de validación",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const { confirmPassword, ...registerData } = formData
      await register(registerData)
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada y has iniciado sesión automáticamente",
      })
      onClose()
      setFormData({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        direccion: "",
        coordenadas: "",
        password: "",
        confirmPassword: "",
      })
      setSelectedAddress("")
    } catch (error) {
      toast({
        title: "Error en el registro",
        description: error instanceof Error ? error.message : "No se pudo crear la cuenta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen && !isMapOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900">
              <UserPlus className="h-5 w-5 mr-2" />
              Crear Cuenta
            </DialogTitle>
            <DialogDescription>Completa tus datos para crear una nueva cuenta</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  placeholder="Juan"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => handleInputChange("apellido", e.target.value)}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="juan@ejemplo.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="+52 55 1234 5678"
                required
              />
            </div>

            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                placeholder="Calle Principal 123, Colonia Centro"
                required
              />
              {selectedAddress && selectedAddress !== formData.direccion && (
                <p className="text-xs text-blue-600 mt-1">Dirección del mapa: {selectedAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="coordenadas">Ubicación Exacta</Label>
              <div className="flex space-x-2">
                <Input
                  id="coordenadas"
                  value={formData.coordenadas}
                  onChange={(e) => handleInputChange("coordenadas", e.target.value)}
                  placeholder="19.4326, -99.1332"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenMap}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 px-3 bg-transparent"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-start space-x-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">Selecciona tu ubicación exacta</p>
                  <p>Usa el mapa para una entrega más precisa y rápida</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
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
                  Crear Cuenta
                </Button>
              </div>
              <div className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Iniciar Sesión
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Google Map Selector */}
      <GoogleMapSelector
        isOpen={isMapOpen}
        onClose={handleMapClose}
        onLocationSelect={handleLocationSelect}
        initialCoordinates={formData.coordenadas}
      />
    </>
  )
}
