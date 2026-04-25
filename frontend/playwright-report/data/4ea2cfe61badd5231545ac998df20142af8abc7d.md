# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login Flow >> should show login form
- Location: tests\login.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login Flow', () => {
  4  |   test('should show login form', async ({ page }) => {
  5  |     // Note: This expects the dev server to be running on 5173
> 6  |     await page.goto('http://localhost:5173/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  7  |     
  8  |     await expect(page.locator('h3')).toContainText('Bienvenido de nuevo');
  9  |     await expect(page.locator('button:has-text("Soy Paciente")')).toBeVisible();
  10 |   });
  11 | 
  12 |   test('should show error on invalid credentials', async ({ page }) => {
  13 |     await page.goto('http://localhost:5173/login');
  14 |     await page.click('text=Soy Paciente');
  15 |     
  16 |     await page.fill('input[name="email"]', 'wrong@user.com');
  17 |     await page.fill('input[name="password"]', 'wrongpassword');
  18 |     await page.click('button[type="submit"]');
  19 |     
  20 |     // Check for error message in the UI
  21 |     await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
  22 |   });
  23 | });
  24 | 
```