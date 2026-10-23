import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.CAPTURE_BASE || 'https://klagon.org'
const OUT = process.env.OUT_DIR || path.resolve('docs/screenshots')

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about/' },
  { name: 'learning', path: '/learning/' },
  { name: 'dashboard', path: '/dashboard/' },
  { name: 'events', path: '/events/' },
  { name: 'blog', path: '/blog/' },
  { name: 'donate', path: '/donate/' },
  { name: 'culture', path: '/culture/' },
  { name: 'map', path: '/map/' },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const page = await ctx.newPage()

for (const p of PAGES) {
  const url = BASE + p.path
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const file = path.join(OUT, `${p.name}.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality: 82, fullPage: false })
    console.log(`ok  ${p.name}  ${url}`)
  } catch (e) {
    console.warn(`ERR ${p.name}  ${url}  ${e.message}`)
  }
}

await browser.close()
console.log(`\nSaved to ${OUT}`)
