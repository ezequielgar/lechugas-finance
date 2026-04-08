import sharp from 'sharp'
import { randomBytes } from 'crypto'
import { unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Absolute path to the uploads/products folder (relative to this file: ../../uploads/products)
export const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads', 'products')

/** Ensure the upload directory exists */
export async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

/**
 * Process an incoming image buffer with sharp:
 *  - Resize to max 800×800 (keeping aspect ratio, no upscaling)
 *  - Convert to WebP quality 78
 * Returns the saved filename and its full disk path.
 */
export async function saveProductImage(inputBuffer: Buffer): Promise<{ filename: string; filepath: string }> {
  await ensureUploadsDir()

  const filename = `${randomBytes(12).toString('hex')}.webp`
  const filepath = join(UPLOADS_DIR, filename)

  await sharp(inputBuffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(filepath)

  return { filename, filepath }
}

/**
 * Delete a product image from disk.
 * @param imagenUrl  The stored URL, e.g. "/uploads/products/abc123.webp"
 */
export async function deleteProductImage(imagenUrl: string | null | undefined): Promise<void> {
  if (!imagenUrl) return
  // Extract just the filename from the URL path
  const filename = imagenUrl.split('/').pop()
  if (!filename) return
  const filepath = join(UPLOADS_DIR, filename)
  try {
    await unlink(filepath)
  } catch {
    // File may not exist – ignore
  }
}
