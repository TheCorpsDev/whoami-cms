// Regenerates the images in docs/screenshots from a running instance.
//
//   1. start the stack with the demo data (see README.technical.md) and set a
//      known admin password: the hash goes in backend/.env;
//   2. npm i --no-save playwright sharp     (any folder, e.g. /tmp/shots)
//   3. BASE_URL=http://localhost:5174 ADMIN_PASSWORD='...' node scripts/screenshots.mjs
//
// Without ADMIN_PASSWORD only the public site is captured.
import { chromium } from 'playwright'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE_URL ?? 'http://localhost:5174'
const OUT = process.env.OUT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots')
const PASSWORD = process.env.ADMIN_PASSWORD

let sharp = null
try {
  sharp = (await import('sharp')).default
} catch {
  console.log('sharp not installed: saving PNG files instead of WebP')
}

await mkdir(OUT, { recursive: true })

async function save(page, name, options = {}) {
  const png = await (options.locator ?? page).screenshot(options.locator ? {} : { fullPage: false })
  if (sharp) {
    await sharp(png).webp({ quality: 84 }).toFile(path.join(OUT, `${name}.webp`))
  } else {
    await writeFile(path.join(OUT, `${name}.png`), png)
  }
  console.log('saved', name)
}

// Smooth scrolling would leave half-revealed sections in the images.
async function reveal(page) {
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important }' })
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await page.waitForTimeout(80)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(500)
}

async function goToSection(page, id) {
  await page.evaluate((selector) => {
    const el = document.querySelector(selector)
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'instant' })
  }, `#${id}`)
  await page.waitForTimeout(500)
}

const browser = await chromium.launch()

// ---------- public site, desktop ----------
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'en-US' })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('locale', 'en'))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await reveal(page)
  await save(page, 'site-desktop-home')
  for (const [id, name] of [['stack', 'site-desktop-stack'], ['esperienza', 'site-desktop-experience'], ['progetti', 'site-desktop-projects']]) {
    await goToSection(page, id)
    await save(page, name)
  }
  await context.close()
}

// ---------- public site, phone ----------
{
  const context = await browser.newContext({
    viewport: { width: 402, height: 874 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'it-IT',
  })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('locale', 'it'))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await reveal(page)
  await save(page, 'site-mobile-home')
  await page.locator('button[aria-controls="mobile-menu"]').click()
  await page.waitForTimeout(400)
  await save(page, 'site-mobile-menu')
  await page.locator('button[aria-controls="mobile-menu"]').click()
  await goToSection(page, 'progetti')
  await save(page, 'site-mobile-projects')
  await context.close()
}

// ---------- admin ----------
if (PASSWORD) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await save(page, 'admin-login')
  await page.locator('input[type=password]').fill(PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForTimeout(1500)
  await save(page, 'admin-profile')
  for (const [route, name] of [['progetti', 'admin-projects'], ['competenze', 'admin-stack'], ['backup', 'admin-backup']]) {
    await page.goto(`${BASE}/admin/${route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await save(page, name)
  }
  await context.close()
} else {
  console.log('ADMIN_PASSWORD not set: admin screenshots skipped')
}

await browser.close()
