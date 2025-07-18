const API_BASE_URL = "https://sigbackend.up.railway.app"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterRequest {
  nombre: string
  apellido: string
  telefono: string
  email: string
  direccion: string
  coordenadas: string
  password: string
}

export interface RegisterResponse {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  direccion: string
  coordenadas: string
}

export interface Product {
  id: string
  nombre: string
  descripcion: string
  precio: number
  talla: string
  color: string
  stock: number
}

export interface ClienteInfo {
  mensaje: string
  cliente_id: string
  email: string
  nombre: string
}

export interface ClientePerfil {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  direccion: string
  coordenadas: string
  fecha_registro?: string
}

export interface ProductoPedido {
  producto_id: string
  nombre: string
  precio: number
  cantidad: number
  subtotal: number
}

export interface InfoPago {
  pago_id: string
  estado: string
  metodo_pago: string
  fecha_pago: string
}

export interface PedidoHistorial {
  pedido_id: string
  fecha_pedido: string
  estado: string
  total: number
  productos: ProductoPedido[]
  pago: InfoPago | null
}

export interface MisPedidosResponse {
  pedidos: PedidoHistorial[]
  total_pedidos: number
  mensaje?: string
}

export interface Distribuidor {
  nombre: string
  telefono: string | null
  estado?: string
  ubicacion_actual?: string
}

export interface PedidoEntrega {
  pedido_id: string
  estado_pedido: string
  productos: Array<{
    nombre: string
    cantidad: number
  }>
}

export interface EntregaInfo {
  entrega_id: string
  fecha_registro: string
  estado: string
  orden_entrega: number
  coordenadas_destino: string
  observaciones: string | null
  pedido: PedidoEntrega | null
  distribuidor: Distribuidor | null
}

export interface MisEntregasResponse {
  entregas: EntregaInfo[]
  total_entregas: number
  entregas_pendientes: number
  entregas_completadas: number
  mensaje?: string
}

export interface RutaInfo {
  coordenadas_inicio: string | null
  coordenadas_fin: string | null
  distancia: number | null
  tiempo_estimado: string | null
}

export interface SeguimientoInfo {
  puede_rastrear: boolean
  mensaje: string
}

export interface SeguimientoEntregaResponse {
  entrega: {
    entrega_id: string
    estado: string
    orden_entrega: number
    coordenadas_destino: string
    fecha_registro: string
    observaciones: string | null
  }
  distribuidor: Distribuidor | null
  ruta: RutaInfo | null
  seguimiento: SeguimientoInfo
}

export interface PedidoRequest {
  instrucciones_entrega: string
  cliente_id: string
  detalles: Array<{
    producto_id: string
    cantidad: number
  }>
}

export interface PedidoResponse {
  id: string
  fecha_pedido: string
  estado: string
  total: number
  cliente_id: string
  instrucciones_entrega: string
  detalles: Array<{
    id: string
    producto_id: string
    cantidad: number
  }>
}

export interface PagoRequest {
  metodo_pago: "QR" | "Transferencia" | "Efectivo"
  monto: number
  pedido_id: string
}

export interface PagoResponse {
  id_pago: string
  metodo_pago: string
  monto: number
  pedido_id: string
  estado: string
  fecha_pago: string
  transaccion_id: string | null
}

export interface PagoQRResponse {
  success: boolean
  pedido_id: string
  pago_id: string
  payment_link: string
  qr_url: string
  total: number
  descripcion: string
  productos: string[]
  estado_pago: string
}

export interface EstadoPagoResponse {
  estado: string
  pedido_id: string
  monto?: number
  fecha_pago?: string
  metodo_pago?: string
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Error en el login")
    }

    return response.json()
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Error en el registro")
    }

    return response.json()
  }

  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener productos")
    }

    return response.json()
  }

  async verifyCliente(): Promise<ClienteInfo> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-cliente`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error en la verificación")
    }

    return response.json()
  }

  async getClientePerfil(): Promise<ClientePerfil> {
    const response = await fetch(`${API_BASE_URL}/clientes/perfil`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error al obtener perfil")
    }

    return response.json()
  }

  async getMisPedidos(): Promise<MisPedidosResponse> {
    const response = await fetch(`${API_BASE_URL}/clientes/mis-pedidos`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error al obtener pedidos")
    }

    return response.json()
  }

  async getMisEntregas(): Promise<MisEntregasResponse> {
    const response = await fetch(`${API_BASE_URL}/clientes/mis-entregas`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error al obtener entregas")
    }

    return response.json()
  }

  async getSeguimientoEntrega(entregaId: string): Promise<SeguimientoEntregaResponse> {
    const response = await fetch(`${API_BASE_URL}/clientes/seguimiento-entrega/${entregaId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error al obtener seguimiento")
    }

    return response.json()
  }

  async createPedido(pedido: PedidoRequest): Promise<PedidoResponse> {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(pedido),
    })

    if (!response.ok) {
      throw new Error("Error al crear pedido")
    }

    return response.json()
  }

  async createPago(pago: PagoRequest): Promise<PagoResponse> {
    const response = await fetch(`${API_BASE_URL}/pagos`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(pago),
    })

    if (!response.ok) {
      throw new Error("Error al procesar pago")
    }

    return response.json()
  }

  async generateQRPayment(pedidoId: string): Promise<PagoQRResponse> {
    const response = await fetch(`${API_BASE_URL}/pagos/generar_pago_qr_pedido/${pedidoId}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error al generar pago QR")
    }

    return response.json()
  }

  async checkPaymentStatus(pedidoId: string): Promise<EstadoPagoResponse> {
    const response = await fetch(`${API_BASE_URL}/pagos/estado_pago/${pedidoId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Error al verificar estado del pago")
    }

    return response.json()
  }
}

export const apiService = new ApiService()
