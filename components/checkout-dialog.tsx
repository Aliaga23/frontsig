"use client"

import { useState, useEffect, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle,
  ExternalLink,
  Loader2,
  QrCode,
  Copy,
  Smartphone,
  Package,
  DollarSign,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { apiService, type PagoQRResponse } from "@/lib/api"
import { QRCodeGenerator } from "@/components/qr-code-generator"

interface CartItem {
  id: string
  nombre: string
  precio: number
  quantity: number
}

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  totalPrice: number
  onOrderComplete: () => void
}

export function CheckoutDialog({ isOpen, onClose, cart, totalPrice, onOrderComplete }: CheckoutDialogProps) {
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("qr")
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [qrPaymentData, setQrPaymentData] = useState<PagoQRResponse | null>(null)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const { toast } = useToast()
  const { cliente } = useAuth()

  const [isPollingPayment, setIsPollingPayment] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setCustomerData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step === 1) {
      // Validate customer data
      if (!customerData.name || !customerData.phone || !customerData.address) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        })
        return
      }
    }
    setStep(step + 1)
  }

  const handleProcessPayment = async () => {
    setIsProcessing(true)

    try {
      // Create order
      const pedidoRequest = {
        instrucciones_entrega: customerData.notes || customerData.address,
        cliente_id: cliente?.cliente_id || "",
        detalles: cart.map((item) => ({
          producto_id: item.id,
          cantidad: item.quantity,
        })),
      }

      const pedido = await apiService.createPedido(pedidoRequest)

      if (paymentMethod === "qr") {
        // Generate QR payment
        const qrResponse = await apiService.generateQRPayment(pedido.id)
        setQrPaymentData(qrResponse)
        setStep(3) // Go to QR payment step

        toast({
          title: "Pago QR generado",
          description: `Pedido #${qrResponse.pedido_id.substring(0, 8)}... creado exitosamente`,
        })
      } else {
        // Create traditional payment
        const pagoRequest = {
          metodo_pago: paymentMethod.toUpperCase() as "QR" | "Transferencia" | "Efectivo",
          monto: totalPrice,
          pedido_id: pedido.id,
        }

        await apiService.createPago(pagoRequest)
        setOrderCompleted(true)

        toast({
          title: "¡Pedido confirmado!",
          description: "Tu pedido ha sido procesado exitosamente",
        })

        setTimeout(() => {
          onOrderComplete()
          resetForm()
        }, 3000)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const checkPaymentStatus = async (isAutoCheck = false) => {
    if (!qrPaymentData) return

    if (!isAutoCheck) {
      setIsCheckingPayment(true)
    }

    try {
      const statusResponse = await apiService.checkPaymentStatus(qrPaymentData.pedido_id)

      if (statusResponse.estado === "pagado") {
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        setIsPollingPayment(false)

        setOrderCompleted(true)
        toast({
          title: "¡Pago confirmado!",
          description: "Tu pago ha sido procesado exitosamente",
        })

        setTimeout(() => {
          onOrderComplete()
          resetForm()
        }, 3000)
      } else if (!isAutoCheck) {
        toast({
          title: "Pago pendiente",
          description: `Estado actual: ${statusResponse.estado}. Se verificará automáticamente.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      if (!isAutoCheck) {
        toast({
          title: "Error",
          description: "No se pudo verificar el estado del pago",
          variant: "destructive",
        })
      }
      console.error("Error checking payment status:", error)
    } finally {
      if (!isAutoCheck) {
        setIsCheckingPayment(false)
      }
    }
  }

  const startPaymentPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setIsPollingPayment(true)

    // Check immediately
    checkPaymentStatus(true)

    // Then check every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus(true)
    }, 5000)

    toast({
      title: "Verificación automática activada",
      description: "Se verificará el pago cada 5 segundos automáticamente",
    })
  }

  const stopPaymentPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPollingPayment(false)
  }

  // Auto-start polling when QR payment is shown
  useEffect(() => {
    if (step === 3 && qrPaymentData && !orderCompleted) {
      // Start polling after 10 seconds to give user time to scan
      const startTimer = setTimeout(() => {
        startPaymentPolling()
      }, 10000)

      return () => {
        clearTimeout(startTimer)
        stopPaymentPolling()
      }
    }
  }, [step, qrPaymentData, orderCompleted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPaymentPolling()
    }
  }, [])

  const copyPaymentLink = async () => {
    if (!qrPaymentData?.qr_url) return

    try {
      await navigator.clipboard.writeText(qrPaymentData.qr_url)
      toast({
        title: "Enlace copiado",
        description: "El enlace de pago ha sido copiado al portapapeles",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    stopPaymentPolling()
    setStep(1)
    setOrderCompleted(false)
    setQrPaymentData(null)
    setCustomerData({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      notes: "",
    })
  }

  const getStatusBadgeColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pagado":
        return "bg-green-100 text-green-800 border-green-200"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200"
      case "procesando":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            value={customerData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            value={customerData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+1 234 567 8900"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={customerData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="juan@ejemplo.com"
        />
      </div>
      <div>
        <Label htmlFor="address">Dirección de entrega *</Label>
        <Input
          id="address"
          value={customerData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="Calle Principal 123, Colonia Centro"
        />
      </div>
      <div>
        <Label htmlFor="city">Ciudad</Label>
        <Input
          id="city"
          value={customerData.city}
          onChange={(e) => handleInputChange("city", e.target.value)}
          placeholder="Ciudad de México"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          value={customerData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Instrucciones especiales para la entrega..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Resumen del Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{item.nombre}</p>
                <div className="flex space-x-2">
                  <span className="text-sm text-gray-500">x{item.quantity}</span>
                </div>
              </div>
              <span className="font-medium text-gray-900">${(item.precio * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between items-center font-bold text-lg">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center text-gray-900">
            <MapPin className="h-5 w-5 mr-2" />
            Información de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Nombre:</strong> {customerData.name}
            </p>
            <p>
              <strong>Teléfono:</strong> {customerData.phone}
            </p>
            <p>
              <strong>Dirección:</strong> {customerData.address}
            </p>
            {customerData.city && (
              <p>
                <strong>Ciudad:</strong> {customerData.city}
              </p>
            )}
            {customerData.notes && (
              <p>
                <strong>Notas:</strong> {customerData.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Método de Pago</CardTitle>
          <CardDescription>Selecciona tu método de pago preferido</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
              <RadioGroupItem value="qr" id="qr" />
              <Label htmlFor="qr" className="flex items-center cursor-pointer">
                <QrCode className="h-5 w-5 mr-2" />
                Pago con QR (Stripe)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
              <RadioGroupItem value="Transferencia" id="Transferencia" />
              <Label htmlFor="Transferencia" className="flex items-center cursor-pointer">
                <CreditCard className="h-5 w-5 mr-2" />
                Transferencia Bancaria
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
              <RadioGroupItem value="Efectivo" id="Efectivo" />
              <Label htmlFor="Efectivo" className="flex items-center cursor-pointer">
                <Banknote className="h-5 w-5 mr-2" />
                Efectivo (Pago contra entrega)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )

  const renderQRPayment = () => (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Pago con Código QR</h3>
        <p className="text-gray-600 mb-6">Escanea el código QR con tu teléfono o haz clic en el enlace</p>
      </div>

      {/* Payment Details Card */}
      {qrPaymentData && (
        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Pedido ID:</span>
              <Badge variant="outline" className="font-mono text-xs">
                #{qrPaymentData.pedido_id.substring(0, 12)}...
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Total:</span>
              <span className="text-lg font-bold text-blue-900">${qrPaymentData.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Estado:</span>
              <Badge className={getStatusBadgeColor(qrPaymentData.estado_pago)}>
                {qrPaymentData.estado_pago.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-blue-800 mb-2">Productos:</p>
              <div className="space-y-1">
                {qrPaymentData.productos.map((producto, index) => (
                  <div key={index} className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    {producto}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-blue-900">Código QR</CardTitle>
            <CardDescription className="text-blue-700">Escanea con la cámara de tu teléfono</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRCodeGenerator
              value={qrPaymentData?.qr_url || ""}
              size={200}
              className="bg-white p-4 rounded-lg shadow-sm"
            />
          </CardContent>
        </Card>

        {/* Payment Actions */}
        <Card className="border border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-green-900 flex items-center justify-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Opciones de Pago
            </CardTitle>
            <CardDescription className="text-green-700">Elige tu método preferido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => window.open(qrPaymentData?.qr_url, "_blank")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Página de Pago
            </Button>

            <Button
              onClick={copyPaymentLink}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Enlace
            </Button>

            {qrPaymentData?.payment_link && qrPaymentData.payment_link !== qrPaymentData.qr_url && (
              <Button
                onClick={() => window.open(qrPaymentData.payment_link, "_blank")}
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Enlace Alternativo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Instrucciones de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Opción 1: Código QR</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Abre la cámara de tu teléfono</li>
                <li>Apunta al código QR</li>
                <li>Toca la notificación que aparece</li>
                <li>Completa el pago en Stripe</li>
                <li>El pago se verificará automáticamente</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Opción 2: Enlace Directo</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Haz clic en "Abrir Página de Pago"</li>
                <li>Se abrirá una nueva pestaña</li>
                <li>Completa el pago con tu tarjeta</li>
                <li>Regresa a esta página</li>
                <li>El pago se detectará automáticamente</li>
              </ol>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Verificación Automática</p>
                <p>
                  Una vez que completes el pago, esta página se actualizará automáticamente en unos segundos. No
                  necesitas hacer nada más.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card className="border border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-900">
                {isPollingPayment ? "Verificando automáticamente..." : "¿Ya completaste el pago?"}
              </p>
              <p className="text-sm text-yellow-700">
                {isPollingPayment
                  ? "Se está verificando el pago cada 5 segundos"
                  : "Haz clic para verificar el estado de tu pago"}
              </p>
              {qrPaymentData && (
                <p className="text-xs text-yellow-600 mt-1 font-mono">
                  Pedido: #{qrPaymentData.pedido_id.substring(0, 12)}...
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {isPollingPayment ? (
                <Button
                  onClick={stopPaymentPolling}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
                >
                  Detener Verificación
                </Button>
              ) : (
                <Button onClick={startPaymentPolling} className="bg-green-600 hover:bg-green-700 text-white mr-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verificar Automáticamente
                </Button>
              )}
              <Button
                onClick={() => checkPaymentStatus(false)}
                disabled={isCheckingPayment}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isCheckingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verificar Ahora
                  </>
                )}
              </Button>
            </div>
          </div>
          {isPollingPayment && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-yellow-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span>Próxima verificación en 5 segundos...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderOrderComplete = () => (
    <div className="text-center py-8">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h3>
      <p className="text-gray-600 mb-4">Tu pedido ha sido procesado exitosamente y será entregado pronto.</p>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          Número de pedido:{" "}
          <strong>
            #{qrPaymentData?.pedido_id.substring(0, 12) || Math.random().toString(36).substr(2, 9).toUpperCase()}...
          </strong>
        </p>
        <p className="text-sm text-gray-600 mt-1">Recibirás una llamada del distribuidor para coordinar la entrega.</p>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {orderCompleted
              ? "Pedido Confirmado"
              : step === 1
                ? "Información de Entrega"
                : step === 2
                  ? "Confirmar Pedido"
                  : "Pagar con QR"}
          </DialogTitle>
          <DialogDescription>
            {orderCompleted
              ? ""
              : step === 1
                ? "Completa tus datos para la entrega"
                : step === 2
                  ? "Revisa tu pedido y selecciona el método de pago"
                  : "Escanea el código QR o usa el enlace para completar tu pago"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {orderCompleted
            ? renderOrderComplete()
            : step === 1
              ? renderStep1()
              : step === 2
                ? renderStep2()
                : renderQRPayment()}
        </div>

        {!orderCompleted && step !== 3 && (
          <DialogFooter className="flex justify-between">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} className="border-gray-300">
                Atrás
              </Button>
            )}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} className="border-gray-300 bg-transparent">
                Cancelar
              </Button>
              {step === 1 ? (
                <Button onClick={handleNextStep} className="bg-gray-900 hover:bg-gray-800 text-white">
                  Continuar
                </Button>
              ) : (
                <Button
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Confirmar Pedido"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}

        {step === 3 && !orderCompleted && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="border-gray-300 bg-transparent">
              Cerrar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
