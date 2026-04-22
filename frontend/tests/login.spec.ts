import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should show login form', async ({ page }) => {
    // Note: This expects the dev server to be running on 5173
    await page.goto('http://localhost:5173/login');
    
    await expect(page.locator('h3')).toContainText('Bienvenido de nuevo');
    await expect(page.locator('button:has-text("Soy Paciente")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.click('text=Soy Paciente');
    
    await page.fill('input[name="email"]', 'wrong@user.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message in the UI
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
  });
});
