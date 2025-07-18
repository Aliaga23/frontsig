"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Crosshair, X, Search, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GoogleMapSelectorProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  initialCoordinates?: string
  isOpen: boolean
  onClose: () => void
}

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

export function GoogleMapSelector({ onLocationSelect, initialCoordinates, isOpen, onClose }: GoogleMapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; address?: string } | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const { toast } = useToast()

  const GOOGLE_MAPS_API_KEY = "AIzaSyDgf7HvH-3Ay8UKFx2FabB2Ym8xN1QMRAQ"

  const loadGoogleMapsScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      window.initGoogleMaps = () => {
        resolve()
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true
      script.onerror = reject
      document.head.appendChild(script)
    })
  }, [])

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return

    const geocoder = new window.google.maps.Geocoder()
    const latlng = { lat, lng }

    geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address
        setSelectedCoords({ lat, lng, address })
      } else {
        setSelectedCoords({ lat, lng })
      }
    })
  }, [])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

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
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    })

    // Add initial marker if coordinates exist
    if (initialCoordinates && initialCoordinates.trim()) {
      const marker = new window.google.maps.Marker({
        position: { lat: initialLat, lng: initialLng },
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      })

      markerRef.current = marker
      reverseGeocode(initialLat, initialLng)

      // Handle marker drag
      marker.addListener("dragend", () => {
        const position = marker.getPosition()
        const lat = position.lat()
        const lng = position.lng()
        reverseGeocode(lat, lng)
      })
    }

    // Handle map clicks
    map.addListener("click", (event: any) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      // Add new marker
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      })

      markerRef.current = marker
      reverseGeocode(lat, lng)

      // Handle marker drag
      marker.addListener("dragend", () => {
        const position = marker.getPosition()
        const newLat = position.lat()
        const newLng = position.lng()
        reverseGeocode(newLat, newLng)
      })
    })

    // Initialize Places Autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "mx" }, // Restrict to Mexico
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          // Center map on selected place
          map.setCenter({ lat, lng })
          map.setZoom(17)

          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.setMap(null)
          }

          // Add new marker
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
          })

          markerRef.current = marker
          setSelectedCoords({ lat, lng, address: place.formatted_address })

          // Handle marker drag
          marker.addListener("dragend", () => {
            const position = marker.getPosition()
            const newLat = position.lat()
            const newLng = position.lng()
            reverseGeocode(newLat, newLng)
          })
        }
      })

      autocompleteRef.current = autocomplete
    }

    mapInstanceRef.current = map
    setIsLoading(false)
  }, [initialCoordinates, reverseGeocode])

  useEffect(() => {
    if (!isOpen) return

    const initMap = async () => {
      try {
        await loadGoogleMapsScript()
        initializeMap()
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar Google Maps",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
    }
  }, [isOpen, loadGoogleMapsScript, initializeMap, toast])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "La geolocalización no está soportada en este navegador",
        variant: "destructive",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        if (mapInstanceRef.current) {
          // Center map on current location
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude })
          mapInstanceRef.current.setZoom(17)

          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.setMap(null)
          }

          // Add marker at current location
          const marker = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: mapInstanceRef.current,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
          })

          markerRef.current = marker
          reverseGeocode(latitude, longitude)

          // Handle marker drag
          marker.addListener("dragend", () => {
            const position = marker.getPosition()
            const lat = position.lat()
            const lng = position.lng()
            reverseGeocode(lat, lng)
          })

          toast({
            title: "Ubicación encontrada",
            description: "Se ha centrado el mapa en tu ubicación actual",
          })
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación actual",
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleConfirmLocation = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords.lat, selectedCoords.lng, selectedCoords.address)
      onClose()
      toast({
        title: "Ubicación confirmada",
        description: "La ubicación ha sido guardada exitosamente",
      })
    }
  }

  const handleSearchClear = () => {
    setSearchValue("")
    if (searchInputRef.current) {
      searchInputRef.current.value = ""
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-gray-50">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <MapPin className="h-6 w-6 mr-2 text-blue-600" />
            Seleccionar Ubicación
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Controls */}
          <div className="p-4 border-b bg-white space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar dirección
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    id="search"
                    placeholder="Escribe una dirección, lugar o código postal..."
                    className="pl-10 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  {searchValue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSearchClear}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 px-4 bg-transparent"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  Mi Ubicación
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Navigation className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Instrucciones:</p>
                <ul className="mt-1 space-y-1 text-blue-800">
                  <li>• Busca una dirección en el campo de arriba</li>
                  <li>• Haz clic en el mapa para colocar un marcador</li>
                  <li>• Arrastra el marcador para ajustar la posición</li>
                  <li>• Usa "Mi Ubicación" para centrar en tu posición actual</li>
                </ul>
              </div>
            </div>

            {selectedCoords && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 mb-1">Ubicación seleccionada:</p>
                    {selectedCoords.address && (
                      <p className="text-sm text-green-800 mb-2 font-medium">{selectedCoords.address}</p>
                    )}
                    <p className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1 rounded">
                      Lat: {selectedCoords.lat.toFixed(6)}, Lng: {selectedCoords.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-[10000]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700">Cargando Google Maps...</p>
                  <p className="text-sm text-gray-500">Preparando el mapa interactivo</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="h-96 w-full bg-gray-100" />
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Powered by Google Maps</span> • Datos precisos y actualizados
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="border-gray-300 bg-white hover:bg-gray-50">
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmLocation}
                disabled={!selectedCoords}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Confirmar Ubicación
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
