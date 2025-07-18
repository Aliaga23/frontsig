"use client"

import type React from "react"
import type { Product } from "@/lib/api"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  Plus,
  MapPin,
  Phone,
  Mail,
  User,
  LogOut,
  Star,
  Shield,
  Truck,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  UserPlus,
} from "lucide-react"
import Image from "next/image"
import { CartSheet } from "@/components/cart-sheet"
import { CheckoutDialog } from "@/components/checkout-dialog"
import { LoginDialog } from "@/components/login-dialog"
import { RegisterDialog } from "@/components/register-dialog"
import { ProfileDialog } from "@/components/profile-dialog"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CartItem extends Product {
  quantity: number
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showProducts, setShowProducts] = useState(false)

  const { isAuthenticated, cliente, logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const productsData = await apiService.getProducts()
      setProducts(productsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from products
  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.nombre.split(" ")[0])))]

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter((product) => product.nombre.toLowerCase().includes(selectedCategory.toLowerCase()))

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no está disponible",
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Stock limitado",
          description: `Solo hay ${product.stock} unidades disponibles`,
          variant: "destructive",
        })
        return
      }
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }

    toast({
      title: "Producto agregado",
      description: `${product.nombre} agregado al carrito`,
    })
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.id !== id))
    } else {
      const product = products.find((p) => p.id === id)
      if (product && newQuantity > product.stock) {
        toast({
          title: "Stock limitado",
          description: `Solo hay ${product.stock} unidades disponibles`,
          variant: "destructive",
        })
        return
      }
      setCart(cart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.precio * item.quantity, 0)
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true)
      return
    }
    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg sm:text-xl">Z</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">ZapaStore</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="font-medium">+1 234 567 8900</span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="hidden sm:block text-xs sm:text-sm text-gray-600 font-medium truncate max-w-24 sm:max-w-none">
                    Hola, {cliente?.nombre}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsProfileOpen(true)}
                    className="hover:bg-blue-50 hover:text-blue-600 border-gray-300 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Mi Perfil</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="hover:bg-red-50 hover:text-red-600 border-gray-300 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Salir</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLoginOpen(true)}
                    className="border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Iniciar Sesión</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRegisterOpen(true)}
                    className="border-gray-300 bg-gray-900 text-white hover:bg-gray-800 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Registrarse</span>
                    <span className="sm:hidden">Registro</span>
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative border-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Carrito</span>
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {!showProducts ? (
        // Landing Page
        <>
          {/* Hero Section */}
          <section className="relative py-24 bg-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="text-center animate-fadeInUp">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  Calzado Profesional
                  <span className="gradient-text block">de Alta Calidad</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto font-light">
                  Descubre nuestra selección premium de zapatos. Diseño, durabilidad y comodidad para profesionales
                  exigentes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setShowProducts(true)}
                  >
                    Ver Catálogo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  {!isAuthenticated && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                      onClick={() => setIsRegisterOpen(true)}
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Crear Cuenta
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 left-10 animate-float">
              <div className="w-20 h-20 bg-gray-200 rounded-full opacity-30"></div>
            </div>
            <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: "1s" }}>
              <div className="w-16 h-16 bg-blue-200 rounded-full opacity-30"></div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Por qué elegir ZapaStore?</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Comprometidos con la excelencia en cada producto que ofrecemos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard
                  icon={<Shield className="h-8 w-8 text-blue-600" />}
                  title="Calidad Garantizada"
                  description="Productos auténticos con garantía de calidad y durabilidad comprobada."
                />
                <FeatureCard
                  icon={<Truck className="h-8 w-8 text-green-600" />}
                  title="Entrega Rápida"
                  description="Envío express en 24-48 horas con seguimiento completo del pedido."
                />
                <FeatureCard
                  icon={<Award className="h-8 w-8 text-gray-700" />}
                  title="Precios Competitivos"
                  description="Los mejores precios del mercado sin comprometer la calidad."
                />
                <FeatureCard
                  icon={<CheckCircle className="h-8 w-8 text-blue-700" />}
                  title="Servicio Profesional"
                  description="Atención personalizada y asesoramiento especializado."
                />
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-20 bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">15K+</div>
                  <div className="text-gray-300">Clientes Satisfechos</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">800+</div>
                  <div className="text-gray-300">Productos</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">25+</div>
                  <div className="text-gray-300">Marcas Premium</div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">98%</div>
                  <div className="text-gray-300">Satisfacción</div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Testimonios de Clientes</h2>
                <p className="text-xl text-gray-600">La opinión de quienes confían en nosotros</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <TestimonialCard
                  name="María González"
                  role="Directora Ejecutiva"
                  content="Excelente calidad y servicio profesional. Los zapatos que compré mantienen su apariencia después de meses de uso intensivo."
                  rating={5}
                />
                <TestimonialCard
                  name="Carlos Rodríguez"
                  role="Gerente Comercial"
                  content="La variedad y calidad superaron mis expectativas. El proceso de compra es eficiente y la entrega muy puntual."
                  rating={5}
                />
                <TestimonialCard
                  name="Ana Martínez"
                  role="Consultora"
                  content="Encontré exactamente lo que necesitaba para mi trabajo. Precios justos y atención al cliente excepcional."
                  rating={5}
                />
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">¿Listo para encontrar tu calzado ideal?</h2>
              <p className="text-xl text-gray-600 mb-8">
                Únete a miles de profesionales que confían en nuestra calidad y servicio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="text-lg px-12 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  onClick={() => setShowProducts(true)}
                >
                  Explorar Productos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                {!isAuthenticated && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-12 py-6 border-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                    onClick={() => setIsRegisterOpen(true)}
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Crear Cuenta Gratis
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-gray-900 font-bold">Z</span>
                    </div>
                    <h3 className="text-2xl font-bold">ZapaStore</h3>
                  </div>
                  <p className="text-gray-400">
                    Especialistas en calzado profesional de alta calidad para clientes exigentes.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Productos</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>Zapatos Ejecutivos</li>
                    <li>Calzado Deportivo</li>
                    <li>Botas Profesionales</li>
                    <li>Calzado Casual</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Empresa</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li>Acerca de Nosotros</li>
                    <li>Contacto</li>
                    <li>Términos y Condiciones</li>
                    <li>Política de Privacidad</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Contacto</h4>
                  <div className="space-y-2 text-gray-400">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      +1 234 567 8900
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      info@zapastore.com
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Ciudad de México
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Lun-Vie 9:00-18:00
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                <p>&copy; 2024 ZapaStore. Todos los derechos reservados.</p>
              </div>
            </div>
          </footer>
        </>
      ) : (
        // Products Section
        <>
          {/* Back to Landing Button */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Button variant="outline" onClick={() => setShowProducts(false)} className="mb-4 border-gray-300">
              ← Volver al Inicio
            </Button>
          </div>

          {/* Products Hero */}
          <section className="bg-gray-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-5xl font-bold mb-4">Catálogo de Productos</h2>
              <p className="text-xl mb-8">Calzado profesional para cada necesidad y ocasión</p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Entrega a domicilio</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Garantía de calidad</span>
                </div>
              </div>
            </div>
          </section>

          {/* Category Filter */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={`mb-2 font-medium ${
                    selectedCategory === category ? "bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </section>

          {/* Products Grid */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        totalPrice={getTotalPrice()}
        onCheckout={handleCheckout}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        totalPrice={getTotalPrice()}
        onOrderComplete={() => {
          setCart([])
          setIsCheckoutOpen(false)
        }}
      />

      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      {/* Register Dialog */}
      <RegisterDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* Profile Dialog */}
      <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}

interface TestimonialCardProps {
  name: string
  role: string
  content: string
  rating: number
}

function TestimonialCard({ name, role, content, rating }: TestimonialCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex mb-4">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
          ))}
        </div>
        <p className="text-gray-600 mb-4 italic">"{content}"</p>
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200">
      <CardHeader className="p-0">
        <div className="aspect-square relative group">
          <Image
            src="/placeholder.svg?height=300&width=300"
            alt={product.nombre}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 text-gray-700 border border-gray-200 text-xs">
            Stock: {product.stock}
          </Badge>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-base sm:text-lg lg:text-xl mb-2 font-semibold text-gray-900 line-clamp-2">
          {product.nombre}
        </CardTitle>
        <CardDescription className="mb-3 sm:mb-4 text-gray-600 text-sm line-clamp-2">
          {product.descripcion}
        </CardDescription>
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">${product.precio}</div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-start gap-2">
            <div className="flex items-center">
              <span className="text-xs sm:text-sm font-medium text-gray-500 mr-1">Talla:</span>
              <Badge variant="secondary" className="font-medium bg-gray-100 text-gray-700 text-xs">
                {product.talla}
              </Badge>
            </div>
            <div className="flex items-center">
              <span className="text-xs sm:text-sm font-medium text-gray-500 mr-1">Color:</span>
              <Badge variant="secondary" className="font-medium bg-gray-100 text-gray-700 text-xs">
                {product.color}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 lg:p-6 pt-0">
        <Button
          className="w-full font-medium py-3 sm:py-4 lg:py-6 bg-gray-900 hover:bg-gray-800 text-white transition-all duration-300 text-sm sm:text-base"
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          {product.stock === 0 ? "Sin Stock" : "Agregar al Carrito"}
        </Button>
      </CardFooter>
    </Card>
  )
}
