import chromium from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://127.0.0.1:5275'

async function test() {
  const browser = await chromium.launch()
  const context = await browser.createContext()
  const page = await context.newPage()

  console.log('Loading campus...')
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })

  // Wait for the scene to load
  await page.waitForFunction(() => window.__campus?.engine?.scene)
  await page.waitForTimeout(2000)

  console.log('Taking overview screenshot...')
  await page.screenshot({ path: 'test-overview.png', fullPage: false })

  console.log('Testing badge moment...')
  // Click a badge kiosk
  const kiosks = await page.evaluate(() => {
    const campus = window.__campus
    const kiosk = campus.campus.kiosks.entries().next().value?.[1]
    if (kiosk) {
      console.log('Clicking kiosk at', kiosk.x, kiosk.z)
      return { x: kiosk.x, z: kiosk.z }
    }
    return null
  })

  if (kiosks) {
    await page.evaluate(({ x, z }) => {
      window.__campus.playBadge([...window.__campus.campus.kiosks.entries()].find(([, k]) => k.x === x && k.z === z)?.[0])
    }, kiosks)
    await page.waitForTimeout(2000)
    console.log('Taking badge moment screenshot...')
    await page.screenshot({ path: 'test-badge.png', fullPage: false })
  }

  console.log('Testing night mode and fireworks...')
  await page.evaluate(() => {
    window.__campus.sky.setTime(0.92)
  })
  await page.waitForTimeout(3000)
  console.log('Taking night screenshot with fireworks...')
  await page.screenshot({ path: 'test-night.png', fullPage: false })

  console.log('Testing VR lite detection...')
  const lite = await page.evaluate(() => window.__campus.LITE)
  console.log('VR Lite mode:', lite)

  await browser.close()
  console.log('Done!')
}

test().catch(console.error)
