"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Eye,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  apiService,
  type ClientePerfil,
  type MisPedidosResponse,
  type MisEntregasResponse,
  type SeguimientoEntregaResponse,
} from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrackingMap } from "@/components/tracking-map"

interface ProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const [activeTab, setActiveTab] = useState("perfil")
  const [perfil, setPerfil] = useState<ClientePerfil | null>(null)
  const [pedidos, setPedidos] = useState<MisPedidosResponse | null>(null)
  const [entregas, setEntregas] = useState<MisEntregasResponse | null>(null)
  const [seguimiento, setSeguimiento] = useState<SeguimientoEntregaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [seguimientoLoading, setSeguimientoLoading] = useState(false)
  const { toast } = useToast()
  const { cliente } = useAuth()

  useEffect(() => {
    if (isOpen) {
      loadProfileData()
    }
  }, [isOpen])

  const loadProfileData = async () => {
    setLoading(true)
    try {
      const [perfilData, pedidosData, entregasData] = await Promise.all([
        apiService.getClientePerfil(),
        apiService.getMisPedidos(),
        apiService.getMisEntregas(),
      ])

      setPerfil(perfilData)
      setPedidos(pedidosData)
      setEntregas(entregasData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerSeguimiento = async (entregaId: string) => {
    setSeguimientoLoading(true)
    try {
      const seguimientoData = await apiService.getSeguimientoEntrega(entregaId)
      setSeguimiento(seguimientoData)
      setActiveTab("seguimiento")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el seguimiento de la entrega",
        variant: "destructive",
      })
    } finally {
      setSeguimientoLoading(false)
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pagado":
      case "entregado":
      case "completado":
        return "bg-green-100 text-green-800 border-green-200"
      case "pendiente":
      case "en_proceso":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelado":
      case "fallido":
        return "bg-red-100 text-red-800 border-red-200"
      case "procesando":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderPerfil = () => (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center text-gray-900 text-lg sm:text-xl">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {perfil && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium text-gray-500">Nombre Completo</label>
                <p className="text-sm sm:text-base text-gray-900 font-medium break-words">
                  {perfil.nombre} {perfil.apellido}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm sm:text-base text-gray-900 flex items-center break-all">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{perfil.email}</span>
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium text-gray-500">Teléfono</label>
                <p className="text-sm sm:text-base text-gray-900 flex items-center">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  {perfil.telefono}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-500">Dirección</label>
                <p className="text-sm sm:text-base text-gray-900 flex items-start">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{perfil.direccion}</span>
                </p>
              </div>
              {perfil.coordenadas && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Coordenadas</label>
                  <p className="text-xs sm:text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                    {perfil.coordenadas}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl text-gray-900">Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{pedidos?.total_pedidos || 0}</div>
              <div className="text-xs sm:text-sm text-blue-700 mt-1">Pedidos Totales</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{entregas?.entregas_completadas || 0}</div>
              <div className="text-xs sm:text-sm text-green-700 mt-1">Entregas Completadas</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{entregas?.entregas_pendientes || 0}</div>
              <div className="text-xs sm:text-sm text-yellow-700 mt-1">Entregas Pendientes</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-xl sm:text-2xl font-bold text-gray-600">{entregas?.total_entregas || 0}</div>
              <div className="text-xs sm:text-sm text-gray-700 mt-1">Total Entregas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPedidos = () => (
    <div className="space-y-3 sm:space-y-4">
      {pedidos?.pedidos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">No tienes pedidos registrados</p>
          </CardContent>
        </Card>
      ) : (
        pedidos?.pedidos.map((pedido) => (
          <Card key={pedido.pedido_id} className="overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">
                    Pedido #{pedido.pedido_id.substring(0, 8)}...
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{formatDate(pedido.fecha_pedido)}</span>
                  </CardDescription>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                  <Badge className={`${getEstadoBadgeColor(pedido.estado)} text-xs whitespace-nowrap`}>
                    {pedido.estado.toUpperCase()}
                  </Badge>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">${pedido.total.toFixed(2)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Productos:</h4>
                <div className="space-y-2">
                  {pedido.productos.map((producto, index) => (
                    <div key={index} className="flex justify-between items-start gap-2 text-xs sm:text-sm">
                      <span className="text-gray-700 flex-1 min-w-0">
                        <span className="block sm:inline truncate">{producto.nombre}</span>
                        <span className="text-gray-500 block sm:inline sm:ml-2">x{producto.cantidad}</span>
                      </span>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        ${producto.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {pedido.pago && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <span className="text-gray-500">Método de pago:</span>
                    <span className="font-medium text-gray-900">{pedido.pago.metodo_pago}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <span className="text-gray-500">Estado del pago:</span>
                    <Badge className={`${getEstadoBadgeColor(pedido.pago.estado)} text-xs w-fit`} variant="outline">
                      {pedido.pago.estado}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const renderEntregas = () => (
    <div className="space-y-3 sm:space-y-4">
      {entregas?.entregas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Truck className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">No tienes entregas registradas</p>
          </CardContent>
        </Card>
      ) : (
        entregas?.entregas.map((entrega) => (
          <Card key={entrega.entrega_id} className="overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">
                    Entrega #{entrega.entrega_id.substring(0, 8)}...
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{formatDate(entrega.fecha_registro)}</span>
                  </CardDescription>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-2">
                  <Badge className={`${getEstadoBadgeColor(entrega.estado)} text-xs whitespace-nowrap`}>
                    {entrega.estado.toUpperCase()}
                  </Badge>
                  <div className="text-xs sm:text-sm text-gray-500">Orden: {entrega.orden_entrega}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {entrega.pedido && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Productos del pedido:</h4>
                  <div className="space-y-1">
                    {entrega.pedido.productos.map((producto, index) => (
                      <div key={index} className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        <span className="break-words">{producto.nombre}</span>
                        <span className="text-gray-500 ml-2">x{producto.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {entrega.distribuidor && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Distribuidor:</h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="break-words">{entrega.distribuidor.nombre}</span>
                    </div>
                    {entrega.distribuidor.telefono && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        <span>{entrega.distribuidor.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {entrega.observaciones && (
                <div className="pt-3 border-t">
                  <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Observaciones:</h4>
                  <p className="text-xs sm:text-sm text-gray-700 break-words bg-gray-50 p-2 rounded">
                    {entrega.observaciones}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t">
                <div className="flex items-start text-xs sm:text-sm text-gray-500 flex-1 min-w-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="break-all">Destino: {entrega.coordenadas_destino}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleVerSeguimiento(entrega.entrega_id)}
                  disabled={seguimientoLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-xs sm:text-sm"
                >
                  {seguimientoLoading ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  )}
                  Ver Seguimiento
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const renderSeguimiento = () => (
    <div className="space-y-4 sm:space-y-6">
      {seguimiento ? (
        <>
          {/* Mapa de Seguimiento */}
          <TrackingMap
            distribuidorUbicacion={seguimiento.distribuidor?.ubicacion_actual || undefined}
            destinoUbicacion={seguimiento.entrega.coordenadas_destino}
            distribuidorNombre={seguimiento.distribuidor?.nombre || "Distribuidor"}
            entregaEstado={seguimiento.entrega.estado}
          />

          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center text-gray-900 text-lg sm:text-xl">
                <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Detalles de la Entrega
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">
                Entrega #{seguimiento.entrega.entrega_id.substring(0, 8)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    <Badge className={`${getEstadoBadgeColor(seguimiento.entrega.estado)} text-xs`}>
                      {seguimiento.entrega.estado.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Orden de Entrega</label>
                  <p className="text-sm sm:text-base text-gray-900 font-medium">{seguimiento.entrega.orden_entrega}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Coordenadas de Destino</label>
                  <p className="text-xs sm:text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                    {seguimiento.entrega.coordenadas_destino}
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  {seguimiento.seguimiento.puede_rastrear ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 text-sm sm:text-base">Estado del Seguimiento</p>
                    <p className="text-blue-800 text-xs sm:text-sm break-words">{seguimiento.seguimiento.mensaje}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {seguimiento.distribuidor && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-gray-900 text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Información del Distribuidor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-sm sm:text-base text-gray-900 font-medium break-words">
                      {seguimiento.distribuidor.nombre}
                    </p>
                  </div>
                  {seguimiento.distribuidor.telefono && (
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Teléfono</label>
                      <p className="text-sm sm:text-base text-gray-900 flex items-center">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        {seguimiento.distribuidor.telefono}
                      </p>
                    </div>
                  )}
                </div>

                {seguimiento.distribuidor.ubicacion_actual && (
                  <div className="pt-3 border-t">
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Ubicación Actual</label>
                    <p className="text-xs sm:text-sm text-gray-900 font-mono flex items-start mt-1 bg-gray-50 p-2 rounded border">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="break-all">{seguimiento.distribuidor.ubicacion_actual}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {seguimiento.ruta && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-gray-900 text-lg sm:text-xl">
                  <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Información de la Ruta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {seguimiento.ruta.distancia && (
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Distancia</label>
                      <p className="text-sm sm:text-base text-gray-900 font-medium">
                        {seguimiento.ruta.distancia.toFixed(2)} km
                      </p>
                    </div>
                  )}
                  {seguimiento.ruta.tiempo_estimado && (
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Tiempo Estimado</label>
                      <p className="text-sm sm:text-base text-gray-900 flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        {seguimiento.ruta.tiempo_estimado}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setActiveTab("entregas")}
              className="border-gray-300 w-full sm:w-auto"
            >
              Volver a Entregas
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Navigation className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">Selecciona una entrega para ver su seguimiento</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b">
          <DialogTitle className="flex items-center text-gray-900 text-lg sm:text-xl">
            <User className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
            Mi Perfil
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Gestiona tu información personal, pedidos y entregas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-4">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-sm sm:text-base text-gray-600">Cargando información...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-4 sm:px-6 py-2 border-b bg-gray-50">
                <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
                  <TabsTrigger value="perfil" className="text-xs sm:text-sm px-1 sm:px-3">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Perfil</span>
                  </TabsTrigger>
                  <TabsTrigger value="pedidos" className="text-xs sm:text-sm px-1 sm:px-3">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Pedidos</span>
                  </TabsTrigger>
                  <TabsTrigger value="entregas" className="text-xs sm:text-sm px-1 sm:px-3">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Entregas</span>
                  </TabsTrigger>
                  <TabsTrigger value="seguimiento" className="text-xs sm:text-sm px-1 sm:px-3">
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Seguimiento</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 sm:p-6">
                    <TabsContent value="perfil" className="mt-0">
                      {renderPerfil()}
                    </TabsContent>

                    <TabsContent value="pedidos" className="mt-0">
                      {renderPedidos()}
                    </TabsContent>

                    <TabsContent value="entregas" className="mt-0">
                      {renderEntregas()}
                    </TabsContent>

                    <TabsContent value="seguimiento" className="mt-0">
                      {renderSeguimiento()}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
