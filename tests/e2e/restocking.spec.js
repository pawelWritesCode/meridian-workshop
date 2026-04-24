import { test, expect } from '@playwright/test'
import { waitForPageData, waitForFilterReload } from './helpers/navigation.js'

test.describe('Restocking page — budget input', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/restocking')
    await waitForPageData(page)
  })

  test('budget input is visible with default value of 50000', async ({ page }) => {
    const input = page.locator('#budget-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('50000')
  })

  test('lowering budget reduces items-within-budget count', async ({ page }) => {
    const withinBudgetStat = page.locator('.stat-card.success .stat-value')
    const before = parseInt(await withinBudgetStat.innerText(), 10)

    await page.locator('#budget-input').fill('1')
    await page.locator('#budget-input').press('Tab')
    await page.waitForTimeout(150)

    const after = parseInt(await withinBudgetStat.innerText(), 10)
    expect(after).toBeLessThan(before)
  })

  test('raising budget increases items-within-budget count', async ({ page }) => {
    const input = page.locator('#budget-input')
    const withinBudgetStat = page.locator('.stat-card.success .stat-value')

    await input.fill('1')
    await input.press('Tab')
    await page.waitForTimeout(150)
    const atLowBudget = parseInt(await withinBudgetStat.innerText(), 10)

    await input.fill('99999999')
    await input.press('Tab')
    await page.waitForTimeout(150)
    const atHighBudget = parseInt(await withinBudgetStat.innerText(), 10)

    expect(atHighBudget).toBeGreaterThanOrEqual(atLowBudget)
  })

  test('table shows both within-budget and over-budget badges with default budget', async ({ page }) => {
    await expect(page.locator('.badge.success').first()).toBeVisible()
    await expect(page.locator('.badge.over-budget').first()).toBeVisible()
  })

  test('total estimated spend stat is not zero', async ({ page }) => {
    const totalSpend = page.locator('.stats-grid .stat-card').nth(2).locator('.stat-value')
    const text = await totalSpend.innerText()
    expect(text).not.toBe('$0.00')
  })

})
