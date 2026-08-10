import { test, expect } from '@playwright/test';

test.describe('Local Test Checkout QA Flow', () => {
  test('renders QA checkout page and handles mock successful payment', async ({ page }) => {
    await page.goto('http://localhost:3000/test-checkout?scenario=success');

    await expect(page.locator('h2')).toHaveText('Complete Payment Test');

    // Fill form using test card data
    await page.fill('#card-number', '4242424242424242');
    await page.fill('#expiry', '12/28');
    await page.fill('#cvc', '123');
    await page.fill('#cardholder', 'Playwright QA Tester');

    // Click pay button
    await page.click('#pay-btn');

    // Assert status outcome
    const statusBox = page.locator('#status-box');
    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText('Payment Successful! Order Confirmed');
  });

  test('renders QA checkout page and handles expected decline', async ({ page }) => {
    await page.goto('http://localhost:3000/test-checkout?scenario=declined');

    await page.fill('#card-number', '4000000000000002');
    await page.fill('#expiry', '06/28');
    await page.fill('#cvc', '394');
    await page.fill('#cardholder', 'Declined Tester');

    await page.click('#pay-btn');

    const statusBox = page.locator('#status-box');
    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText('Card Declined: Insufficient Funds');
  });
});
