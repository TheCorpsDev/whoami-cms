/**
 * Round photo for the CV: the image cropped to a circle with a white ring, as a JPEG data URL
 * (pdfmake cannot clip images itself). The corners take the colour of the sidebar: JPEG has no
 * transparency, and pdfmake decodes PNG with a Web Worker that the site's CSP forbids.
 * Without a photo, the initials on a coloured disc.
 */
export async function circlePhoto(url: string | null, initials: string, background: string, size = 360): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponibile')

  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)

  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  let drawn = false
  if (url) {
    try {
      const response = await fetch(url, { credentials: 'same-origin' })
      if (response.ok) {
        const bitmap = await createImageBitmap(await response.blob())
        // "Cover" crop, a little above centre: portraits keep the face.
        const scale = Math.max(size / bitmap.width, size / bitmap.height)
        const w = bitmap.width * scale
        const h = bitmap.height * scale
        ctx.drawImage(bitmap, (size - w) / 2, (size - h) * 0.3, w, h)
        drawn = true
      }
    } catch {
      // Unreadable image: fall back to the initials.
    }
  }

  if (!drawn) {
    ctx.fillStyle = '#8b7cf6'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${size * 0.38}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, size / 2, size / 2 + size * 0.02)
  }

  ctx.restore()

  ctx.lineWidth = size * 0.045
  ctx.strokeStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - ctx.lineWidth / 2, 0, Math.PI * 2)
  ctx.stroke()

  return canvas.toDataURL('image/jpeg', 0.92)
}
