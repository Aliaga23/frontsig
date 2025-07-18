"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Crosshair, X } from "lucide-react"

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialCoordinates?: string
  isOpen: boolean
  onClose: () => void
}

export function MapSelector({ onLocationSelect, initialCoordinates, isOpen, onClose }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!isOpen || !mapRef.current) return

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import("leaflet")).default

        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Parse initial coordinates or use default (Mexico City)
        let initialLat = 19.4326
        let initialLng = -99.1332

        if (initialCoordinates && initialCoordinates.trim()) {
          const coords = initialCoordinates.split(",").map((c) => Number.parseFloat(c.trim()))
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            initialLat = coords[0]
            initialLng = coords[1]
          }
        }

        // Initialize map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        const map = L.map(mapRef.current).setView([initialLat, initialLng], 13)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        // Add initial marker if coordinates exist
        if (initialCoordinates && initialCoordinates.trim()) {
          const marker = L.marker([initialLat, initialLng]).addTo(map)
          markerRef.current = marker
          setSelectedCoords({ lat: initialLat, lng: initialLng })
        }

        // Handle map clicks
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current)
          }

          // Add new marker
          const marker = L.marker([lat, lng]).addTo(map)
          markerRef.current = marker

          setSelectedCoords({ lat, lng })
        })

        mapInstanceRef.current = map
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing map:", error)
        setIsLoading(false)
      }
    }

    initializeMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, initialCoordinates])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada en este navegador")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        if (mapInstanceRef.current) {
          // Center map on current location
          mapInstanceRef.current.setView([latitude, longitude], 15)

          // Remove existing marker
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current)
          }

          // Add marker at current location
          const L = require("leaflet")
          const marker = L.marker([latitude, longitude]).addTo(mapInstanceRef.current)
          markerRef.current = marker

          setSelectedCoords({ lat: latitude, lng: longitude })
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("No se pudo obtener tu ubicación actual")
      },
    )
  }

  const handleConfirmLocation = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Seleccionar Ubicación</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Haz clic en el mapa para seleccionar tu ubicación</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                className="border-gray-300 bg-white"
              >
                <Crosshair className="h-4 w-4 mr-2" />
                Mi Ubicación
              </Button>
            </div>
            {selectedCoords && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Ubicación seleccionada:</p>
                <p className="text-sm text-blue-700">
                  Latitud: {selectedCoords.lat.toFixed(6)}, Longitud: {selectedCoords.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="h-96 w-full" />
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} className="border-gray-300 bg-white">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmLocation}
              disabled={!selectedCoords}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Confirmar Ubicación
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
