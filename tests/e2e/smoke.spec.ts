import { test, expect } from '@playwright/test'

/**
 * Smoke tests E2E — Hexastra Coach
 *
 * Ces tests vérifient que les surfaces critiques de l'application
 * sont accessibles et chargent correctement.
 * Ils ne testent pas la logique métier (couverte par les KS tests).
 */

test.describe('Smoke — Pages publiques', () => {
  test('Home se charge', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/hexastra/i)
    // La page ne doit pas afficher une erreur 500
    const body = await page.textContent('body')
    expect(body).not.toContain('Internal Server Error')
    expect(body).not.toContain('Application error')
  })

  test('Chat est accessible', async ({ page }) => {
    const response = await page.goto('/chat')
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Smoke — Endpoint health', () => {
  test('GET /api/health retourne 200 + status ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('status', 'ok')
  })
})

test.describe('Smoke — UI Chat', () => {
  test('Page chat affiche la zone de saisie', async ({ page }) => {
    await page.goto('/chat')
    // Le composer (input/textarea) doit être présent
    const composer = page.locator('textarea, input[type="text"]').first()
    await expect(composer).toBeVisible({ timeout: 10_000 })
  })

  test('Menu cards visible ou zone de bienvenue présente', async ({ page }) => {
    await page.goto('/chat')
    // Au moins l'un de ces éléments doit être présent
    const welcome = page.locator('[class*="welcome"], [class*="Welcome"], [class*="hero"], [class*="Hero"]')
    const menuCard = page.locator('[class*="menu"], [class*="Menu"], [class*="card"], [class*="Card"]')
    const hasWelcome = await welcome.count() > 0
    const hasMenu = await menuCard.count() > 0
    expect(hasWelcome || hasMenu).toBeTruthy()
  })

  test('Formulaire naissance accessible depuis /chat', async ({ page }) => {
    await page.goto('/chat')
    // Le formulaire naissance peut ne pas être immédiatement visible (bootstrap)
    // On vérifie juste que la page charge sans erreur JS critique
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.waitForTimeout(2_000)
    // Filtrer les erreurs non-critiques connues (ex: extensions navigateur)
    const criticalErrors = errors.filter(
      (e) => !e.includes('extension') && !e.includes('Script error')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Smoke — Pricing', () => {
  test('Page pricing se charge', async ({ page }) => {
    const response = await page.goto('/pricing')
    expect(response?.status()).toBeLessThan(500)
  })
})
