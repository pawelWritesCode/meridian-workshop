export const NAV_LINKS = {
  dashboard:  { href: '/',            label: /overview/i },
  inventory:  { href: '/inventory',   label: /inventory/i },
  orders:     { href: '/orders',      label: /orders/i },
  spending:   { href: '/spending',    label: /finance/i },
  demand:     { href: '/demand',      label: /demand/i },
  reports:    { href: '/reports',     label: /reports/i },
  restocking: { href: '/restocking',  label: /restocking/i },
}

// Waits for the page data to finish loading.
// First ensures Vue has mounted (.top-nav visible), then waits for .loading
// to appear and subsequently disappear. The two-step approach closes the race
// where waitForSelector('.loading', 'detached') returns immediately if called
// before Vue has rendered the loading div.
export async function waitForPageData(page) {
  await page.waitForSelector('.top-nav', { timeout: 10_000 })
  const loading = page.locator('.loading')
  try {
    await loading.waitFor({ state: 'visible', timeout: 2_000 })
  } catch {
    // Data loaded before loading div appeared — nothing to wait for.
  }
  await loading.waitFor({ state: 'hidden', timeout: 10_000 })
}

// After a filter selection, Vue needs one reactivity tick before loading=true.
// Call this instead of waitForPageData when reloading after filter changes.
export async function waitForFilterReload(page) {
  await page.waitForTimeout(150)
  await waitForPageData(page)
}

// Resets FilterBar selects to defaults if any filter is active.
// The reset button has disabled attribute when no filters are active.
export async function resetFilters(page) {
  const resetBtn = page.locator('.reset-filters-btn')
  const isDisabled = await resetBtn.getAttribute('disabled')
  if (isDisabled === null) {
    await resetBtn.click()
    await page.waitForTimeout(300)
  }
}
