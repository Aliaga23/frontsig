"use client"

import { useEffect, useRef } from "react"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeGenerator({ value, size = 200, className = "" }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return

    const generateQR = async () => {
      try {
        // Dynamically import QR code library
        const QRCode = (await import("qrcode")).default

        const canvas = canvasRef.current
        if (!canvas) return

        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        })
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }

    generateQR()
  }, [value, size])

  if (!value) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">Sin QR</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
        style={{ maxWidth: size, maxHeight: size }}
      />
    </div>
  )
}
