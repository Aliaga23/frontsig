"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"

interface CartItem {
  id: string
  nombre: string
  precio: number
  quantity: number
  stock: number
}

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  updateQuantity: (id: string, quantity: number) => void
  totalPrice: number
  onCheckout: () => void
}

export function CartSheet({ isOpen, onClose, cart, updateQuantity, totalPrice, onCheckout }: CartSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg sm:text-xl text-gray-900">Carrito de Compras</SheetTitle>
          <SheetDescription className="text-sm sm:text-base">
            {cart.length === 0 ? "Tu carrito está vacío" : `${cart.length} producto(s) en tu carrito`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2 sm:py-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-sm sm:text-base">No hay productos en tu carrito</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg"
                >
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.nombre}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{item.nombre}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">${item.precio.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 border-gray-300"
                    >
                      <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 border-gray-300"
                    >
                      <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 0)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 border-gray-300 ml-1 sm:ml-2"
                    >
                      <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <SheetFooter className="border-t pt-4 sm:pt-6">
            <div className="w-full space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base font-medium text-gray-900">Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
              <Button
                onClick={onCheckout}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm sm:text-base py-3 sm:py-4"
                size="lg"
              >
                Proceder al Pago
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
