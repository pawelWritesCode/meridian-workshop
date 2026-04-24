export const NAV_LINKS = {
  dashboard:  { href: '/',            label: /overview/i },
  inventory:  { href: '/inventory',   label: /inventory/i },
  orders:     { href: '/orders',      label: /orders/i },
  spending:   { href: '/spending',    label: /finance/i },
  demand:     { href: '/demand',      label: /demand/i },
  reports:    { href: '/reports',     label: /reports/i },
  restocking: { href: '/restocking',  label: /restocking/i },
}

// Waits for the loading spinner to leave the DOM.
// Succeeds immediately if .loading is not present (data already loaded).
export async function waitForPageData(page) {
  await page.waitForSelector('.loading', { state: 'detached', timeout: 10_000 })
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
