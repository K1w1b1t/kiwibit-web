import { expect, test } from '@playwright/test'

test('blog list and post navigation', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.getByRole('heading', { name: /KIWI BIT Blog/i })).toBeVisible()
  const firstPost = page.locator('a[href^="/blog/"]').first()
  await firstPost.click()
  await expect(page.locator('main')).toContainText(/min read/i)
})

test('newsletter subscribe flow', async ({ page }) => {
  await page.goto('/blog')
  await page.getByPlaceholder('you@company.com').fill('qa+blog@kiwibit.com')
  await page.getByRole('button', { name: /Subscribe/i }).click()
  await expect(page.locator('text=Check confirmation link')).toBeVisible()
})

test('admin content panel opens', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('EMAIL_ADDRESS').fill('gustavo@kiwibit.com')
  await page.getByPlaceholder('********').fill('kiwi1234')
  await page.getByRole('button', { name: /Authorize Access/i }).click()
  await page.waitForURL('**/member/manage')
  await page.goto('/admin/content')
  await expect(page.getByRole('heading', { name: /Content Admin/i })).toBeVisible()
})
