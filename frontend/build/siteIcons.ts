import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Favicon and home-screen icons drawn from the site initials, so a deployment
 * can brand itself with the VITE_SITE_INITIALS variable alone. The PNGs are
 * rendered at build time with resvg and a bundled monospace font, so the result
 * does not depend on the fonts installed on the build machine.
 */

const ACCENT = '#A78BFA'
const INK = '#0E1018'
const FONT_FAMILY = 'DejaVu Sans Mono'
// Metrics of DejaVu Sans Mono Bold, in em: width of one letter and height of a capital.
const LETTER_WIDTH = 0.602
const CAP_HEIGHT = 0.729

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Largest font size that keeps the letters inside `room` pixels, capped at `max`. */
const fit = (letters: number, room: number, max: number) => Math.min(max, room / (LETTER_WIDTH * letters))

/** Square artwork on a 512 grid. `rounded` is for the icons shown as they are, full-bleed for the ones the OS masks. */
function artwork(initials: string, rounded: boolean) {
  const size = fit(initials.length, 340, 230)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">`
    + `<rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="${ACCENT}"/>`
    + `<text x="256" y="${(256 + (CAP_HEIGHT * size) / 2).toFixed(1)}" text-anchor="middle" font-family="${FONT_FAMILY}" font-size="${size.toFixed(1)}" font-weight="700" fill="${INK}">${escape(initials)}</text>`
    + `</svg>`
}

/** The favicon is drawn by the browser, which falls back to any monospace font. */
function favicon(initials: string) {
  const size = fit(initials.length, 46, 26)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
    + `<rect width="64" height="64" rx="14" fill="${ACCENT}"/>`
    + `<text x="32" y="${(32 + (CAP_HEIGHT * size) / 2).toFixed(1)}" text-anchor="middle" font-family="${FONT_FAMILY}, ui-monospace, Menlo, monospace" font-size="${size.toFixed(1)}" font-weight="700" fill="${INK}">${escape(initials)}</text>`
    + `</svg>`
}

/** Writes the favicon and the PWA icons into `outDir`, replacing the ones copied from public/. */
export async function writeSiteIcons(outDir: string, rawInitials: string) {
  const initials = rawInitials.trim().slice(0, 4)
  const { Resvg } = await import('@resvg/resvg-js')
  const fontFile = path.resolve(process.cwd(), 'node_modules/dejavu-fonts-ttf/ttf/DejaVuSansMono-Bold.ttf')
  const png = (svg: string, width: number) => new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: FONT_FAMILY },
  }).render().asPng()

  const rounded = artwork(initials, true)
  const bleed = artwork(initials, false)
  await mkdir(path.join(outDir, 'icons'), { recursive: true })
  await Promise.all([
    writeFile(path.join(outDir, 'favicon.svg'), favicon(initials)),
    writeFile(path.join(outDir, 'icons/icon-192.png'), png(rounded, 192)),
    writeFile(path.join(outDir, 'icons/icon-512.png'), png(rounded, 512)),
    writeFile(path.join(outDir, 'icons/maskable-512.png'), png(bleed, 512)),
    writeFile(path.join(outDir, 'icons/apple-touch-icon.png'), png(bleed, 180)),
  ])
}
