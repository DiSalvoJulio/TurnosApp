# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: professional.spec.ts >> Professional Portal Flow >> should navigate to agenda and check structure
- Location: tests\professional.spec.ts:16:3

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
  3  | test.describe('Professional Portal Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Login as professional
> 6  |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  7  |     await page.click('text=Soy Profesional');
  8  |     await page.fill('input[name="email"]', 'juanperez@turnos.com');
  9  |     await page.fill('input[name="password"]', '123');
  10 |     await page.click('button[type="submit"]');
  11 |     
  12 |     // Check we are in professional dashboard
  13 |     await expect(page).toHaveURL(/\/professional\/dashboard/);
  14 |   });
  15 | 
  16 |   test('should navigate to agenda and check structure', async ({ page }) => {
  17 |     await page.click('text=Turnos Asignados');
  18 |     await expect(page).toHaveURL(/\/professional\/agenda/);
  19 | 
  20 |     // Verify Title
  21 |     await expect(page.locator('h1')).toContainText('Agenda Médica');
  22 | 
  23 |     // Verify presence of "Nuevo Turno" button
  24 |     await expect(page.locator('button:has-text("Nuevo Turno")')).toBeVisible();
  25 | 
  26 |     // Verify week navigation buttons
  27 |     const navButtons = page.locator('button > svg.lucide-chevron-left, button > svg.lucide-chevron-right');
  28 |     await expect(navButtons).toHaveCount(2);
  29 |   });
  30 | 
  31 |   test('should navigate to clinical history', async ({ page }) => {
  32 |     await page.goto('/professional/dashboard');
  33 |     await page.click('text=Historias Clínicas');
  34 |     await expect(page).toHaveURL(/\/professional\/history/);
  35 |     
  36 |     await expect(page.locator('h1')).toContainText('Historias Clínicas');
  37 |     await expect(page.locator('placeholder="DNI, Apellido o Nombre..."')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('should open profile and check structure', async ({ page }) => {
  41 |     // Click on profile picture in dashboard
  42 |     const profilePic = page.locator('.w-24.h-24.bg-slate-100');
  43 |     await profilePic.click();
  44 |     
  45 |     await expect(page).toHaveURL(/\/professional\/profile/);
  46 |     await expect(page.locator('h1')).toContainText('Profesional');
  47 |     await expect(page.locator('button:has-text("Editar Perfil")')).toBeVisible();
  48 |   });
  49 | });
  50 | 
```