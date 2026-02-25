import { expect, test } from '@playwright/test'

test('member critical flow: login, draft save, publish/submit, revert', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('EMAIL_ADDRESS').fill('gustavo@kiwibit.com')
  await page.getByPlaceholder('********').fill('kiwi1234')
  await page.getByRole('button', { name: /Authorize Access/i }).click()

  await page.waitForURL('**/member/manage')
  await expect(page.getByText('Manage Your Profile')).toBeVisible()

  const bio = page.locator('textarea').first()
  await bio.fill('Updated bio from automated test. This should be enough characters for validation checks.')
  await page.getByRole('button', { name: /Save Draft/i }).click()

  await expect(page.getByText(/Rascunho salvo|saved/i)).toBeVisible()
  await page.getByRole('button', { name: /Revert/i }).first().click()
  await page.getByRole('button', { name: /Submit Review|Publish/i }).click()
})

test('member upload avatar flow', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('EMAIL_ADDRESS').fill('gustavo@kiwibit.com')
  await page.getByPlaceholder('********').fill('kiwi1234')
  await page.getByRole('button', { name: /Authorize Access/i }).click()
  await page.waitForURL('**/member/manage')

  const filePath = `${process.cwd()}\\public\\Kiwi.png`
  await page.locator('input[type="file"]').first().setInputFiles(filePath)
  await page.getByRole('button', { name: /Upload/i }).click()
})
