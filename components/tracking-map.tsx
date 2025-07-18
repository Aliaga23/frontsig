"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Crosshair, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TrackingMapProps {
  distribuidorUbicacion?: string
  destinoUbicacion: string
  distribuidorNombre: string
  entregaEstado: string
}

declare global {
  interface Window {
    google: any
    initTrackingMap: () => void
  }
}

export function TrackingMap({
  distribuidorUbicacion,
  destinoUbicacion,
  distribuidorNombre,
  entregaEstado,
}: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const distribuidorMarkerRef = useRef<any>(null)
  const destinoMarkerRef = useRef<any>(null)
  const routeRendererRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState(false)
  const { toast } = useToast()

  const GOOGLE_MAPS_API_KEY = "AIzaSyDgf7HvH-3Ay8UKFx2FabB2Ym8xN1QMRAQ"

  const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      window.initTrackingMap = () => {
        resolve()
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initTrackingMap`
      script.async = true
      script.defer = true
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const parseCoordinates = (coordString: string) => {
    const coords = coordString.split(",").map((c) => Number.parseFloat(c.trim()))
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return { lat: coords[0], lng: coords[1] }
    }
    return null
  }

  const initializeMap = async () => {
    if (!mapRef.current || !window.google) return

    try {
      // Parse coordinates
      const destino = parseCoordinates(destinoUbicacion)
      const distribuidor = distribuidorUbicacion ? parseCoordinates(distribuidorUbicacion) : null

      if (!destino) {
        setMapError(true)
        return
      }

      // Initialize map centered on destination
      const map = new window.google.maps.Map(mapRef.current, {
        center: destino,
        zoom: 13,
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

      mapInstanceRef.current = map

      // Add destination marker (customer location)
      const destinoMarker = new window.google.maps.Marker({
        position: destino,
        map: map,
        title: "Destino de Entrega",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" strokeWidth="3"/>
              <path d="M16 8L20 14H12L16 8Z" fill="white"/>
              <circle cx="16" cy="20" r="2" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        },
        animation: window.google.maps.Animation.DROP,
      })

      destinoMarkerRef.current = destinoMarker

      // Add info window for destination
      const destinoInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #10B981; font-size: 14px; font-weight: 600;">
              🏠 Destino de Entrega
            </h3>
            <p style="margin: 0; font-size: 12px; color: #6B7280;">
              ${destino.lat.toFixed(6)}, ${destino.lng.toFixed(6)}
            </p>
          </div>
        `,
      })

      destinoMarker.addListener("click", () => {
        destinoInfoWindow.open(map, destinoMarker)
      })

      // Add distributor marker if available and delivery is pending
      if (distribuidor && entregaEstado === "pendiente") {
        const distribuidorMarker = new window.google.maps.Marker({
          position: distribuidor,
          map: map,
          title: `Distribuidor: ${distribuidorNombre}`,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" strokeWidth="3"/>
                <path d="M12 12H20V16H18V20H14V16H12V12Z" fill="white"/>
                <circle cx="16" cy="8" r="2" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32),
          },
          animation: window.google.maps.Animation.BOUNCE,
        })

        distribuidorMarkerRef.current = distribuidorMarker

        // Add info window for distributor
        const distribuidorInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #3B82F6; font-size: 14px; font-weight: 600;">
                🚚 ${distribuidorNombre}
              </h3>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280;">
                Ubicación actual
              </p>
              <p style="margin: 0; font-size: 12px; color: #6B7280;">
                ${distribuidor.lat.toFixed(6)}, ${distribuidor.lng.toFixed(6)}
              </p>
            </div>
          `,
        })

        distribuidorMarker.addListener("click", () => {
          distribuidorInfoWindow.open(map, distribuidorMarker)
        })

        // Calculate and display route
        const directionsService = new window.google.maps.DirectionsService()
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true, // We use custom markers
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        })

        directionsRenderer.setMap(map)
        routeRendererRef.current = directionsRenderer

        directionsService.route(
          {
            origin: distribuidor,
            destination: destino,
            travelMode: window.google.maps.TravelMode.DRIVING,
            avoidHighways: false,
            avoidTolls: false,
          },
          (result: any, status: any) => {
            if (status === "OK") {
              directionsRenderer.setDirections(result)

              // Show route info
              const route = result.routes[0]
              const leg = route.legs[0]

              toast({
                title: "Ruta calculada",
                description: `Distancia: ${leg.distance.text}, Tiempo estimado: ${leg.duration.text}`,
              })
            } else {
              console.error("Error calculating route:", status)
            }
          },
        )

        // Adjust map bounds to show both markers
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(distribuidor)
        bounds.extend(destino)
        map.fitBounds(bounds)

        // Add some padding
        setTimeout(() => {
          map.panToBounds(bounds)
        }, 100)
      } else {
        // If no distributor location or delivery completed, center on destination
        map.setCenter(destino)
        map.setZoom(15)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error initializing tracking map:", error)
      setMapError(true)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript()
        await initializeMap()
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setMapError(true)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        // Cleanup markers and renderers
        if (distribuidorMarkerRef.current) {
          distribuidorMarkerRef.current.setMap(null)
        }
        if (destinoMarkerRef.current) {
          destinoMarkerRef.current.setMap(null)
        }
        if (routeRendererRef.current) {
          routeRendererRef.current.setMap(null)
        }
      }
    }
  }, [distribuidorUbicacion, destinoUbicacion, distribuidorNombre, entregaEstado])

  const centerOnDistributor = () => {
    if (distribuidorUbicacion && mapInstanceRef.current) {
      const coords = parseCoordinates(distribuidorUbicacion)
      if (coords) {
        mapInstanceRef.current.setCenter(coords)
        mapInstanceRef.current.setZoom(16)

        if (distribuidorMarkerRef.current) {
          distribuidorMarkerRef.current.setAnimation(window.google.maps.Animation.BOUNCE)
          setTimeout(() => {
            distribuidorMarkerRef.current.setAnimation(null)
          }, 2000)
        }
      }
    }
  }

  const centerOnDestination = () => {
    if (mapInstanceRef.current) {
      const coords = parseCoordinates(destinoUbicacion)
      if (coords) {
        mapInstanceRef.current.setCenter(coords)
        mapInstanceRef.current.setZoom(16)

        if (destinoMarkerRef.current) {
          destinoMarkerRef.current.setAnimation(window.google.maps.Animation.BOUNCE)
          setTimeout(() => {
            destinoMarkerRef.current.setAnimation(null)
          }, 2000)
        }
      }
    }
  }

  const showFullRoute = () => {
    if (distribuidorUbicacion && mapInstanceRef.current) {
      const distribuidor = parseCoordinates(distribuidorUbicacion)
      const destino = parseCoordinates(destinoUbicacion)

      if (distribuidor && destino) {
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(distribuidor)
        bounds.extend(destino)
        mapInstanceRef.current.fitBounds(bounds)
      }
    }
  }

  if (mapError) {
    return (
      <Card className="border border-red-200 bg-red-50">
        <CardContent className="text-center py-8 sm:py-12">
          <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-red-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-red-600 font-medium mb-2">Error al cargar el mapa</p>
          <p className="text-xs sm:text-sm text-red-500">
            No se pudo cargar Google Maps o las coordenadas son inválidas
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
          <CardTitle className="flex items-center text-gray-900 text-lg sm:text-xl">
            <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Mapa de Seguimiento
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {distribuidorUbicacion && entregaEstado === "pendiente" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={centerOnDistributor}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent text-xs sm:text-sm"
                >
                  <Crosshair className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Ver </span>Distribuidor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showFullRoute}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-transparent text-xs sm:text-sm"
                >
                  <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Ver </span>Ruta
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={centerOnDestination}
              className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent text-xs sm:text-sm"
            >
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ver </span>Destino
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-2 sm:mb-4" />
                <p className="text-sm sm:text-base font-medium text-gray-700">Cargando mapa...</p>
                <p className="text-xs sm:text-sm text-gray-500">Preparando seguimiento en tiempo real</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="h-64 sm:h-80 lg:h-96 w-full bg-gray-100" />
        </div>

        {/* Map Legend */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
              <span className="text-gray-700">🏠 Tu ubicación (destino)</span>
            </div>
            {distribuidorUbicacion && entregaEstado === "pendiente" && (
              <>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">🚚 Distribuidor (ubicación actual)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-blue-500 mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">📍 Ruta de entrega</span>
                </div>
              </>
            )}
          </div>

          {entregaEstado === "entregado" && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-100 rounded-lg border border-green-200">
              <div className="flex items-center text-green-800 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span className="font-medium">¡Entrega completada en esta ubicación!</span>
              </div>
            </div>
          )}

          {entregaEstado === "pendiente" && !distribuidorUbicacion && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-yellow-100 rounded-lg border border-yellow-200">
              <div className="flex items-center text-yellow-800 text-xs sm:text-sm">
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                <span>El distribuidor aún no ha comenzado la ruta hacia tu ubicación</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
