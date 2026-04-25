import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Upload, Trash2, ImageOff, Loader2 } from 'lucide-react'
import { trpc } from '../../../lib/trpc'
import { useAuthStore } from '../../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ── Canvas compression ────────────────────────────────────────────────────────
function compressImage(file: File, maxPx = 1000, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width: w, height: h } = img
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx }
        else { w = Math.round((w * maxPx) / h); h = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProductImageModalProps {
  isOpen: boolean
  productoId: string
  nombre: string
  currentImage?: string | null
  onClose: () => void
  onSuccess: (newUrl: string | null) => void
}

export function ProductImageModal({
  isOpen,
  productoId,
  nombre,
  currentImage,
  onClose,
  onSuccess,
}: ProductImageModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { accessToken } = useAuthStore()

  const removeMutation = trpc.supermercado.removeProductImage.useMutation({
    onSuccess: () => onSuccess(null),
    onError: (e) => setError(e.message),
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const blob = await compressImage(file)
      setCompressedBlob(blob)
      setPreview(URL.createObjectURL(blob))
    } catch {
      setError('No se pudo procesar la imagen. Intentá con otro archivo.')
    }
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  async function handleUpload() {
    if (!compressedBlob) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('image', compressedBlob, 'product.jpg')

      const res = await fetch(
        `${API_URL}/api/upload/product-image?productoId=${encodeURIComponent(productoId)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      )
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Error al subir la imagen')
      }
      onSuccess(json.url)
    } catch (e: any) {
      setError(e.message ?? 'Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  function handleClose() {
    setPreview(null)
    setCompressedBlob(null)
    setError(null)
    onClose()
  }

  const imageToShow = preview ?? (currentImage ? `${API_URL}${currentImage}` : null)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-sm bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Camera size={15} className="text-brand-400" />
                  Foto del producto
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{nombre}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Image preview area */}
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/40 bg-white/3 hover:bg-brand-500/5 transition-all cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {imageToShow ? (
                  <img
                    src={imageToShow}
                    alt={nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center space-y-2 text-slate-600">
                    <ImageOff size={36} className="mx-auto" />
                    <p className="text-xs">Tocá para elegir una foto</p>
                  </div>
                )}

                {/* Overlay hint on hover */}
                {imageToShow && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-center text-white/90 space-y-1">
                      <Upload size={24} className="mx-auto" />
                      <p className="text-xs font-medium">Cambiar foto</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <p className="text-[11px] text-slate-600 text-center">
                La imagen se comprime automáticamente antes de subirse.
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                {/* Remove image button — only when there's a saved image (not just a preview) */}
                {currentImage && !preview && (
                  <button
                    onClick={() => removeMutation.mutate({ productoId })}
                    disabled={removeMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Eliminar
                  </button>
                )}

                {/* Cancel preview */}
                {preview && (
                  <button
                    onClick={() => { setPreview(null); setCompressedBlob(null) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/5 transition-all"
                  >
                    <X size={13} />
                    Cancelar
                  </button>
                )}

                {/* Upload button */}
                <button
                  onClick={handleUpload}
                  disabled={!compressedBlob || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <><Loader2 size={15} className="animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload size={15} /> Guardar foto</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
