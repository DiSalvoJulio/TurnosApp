# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: professional.spec.ts >> Professional Portal Flow >> should navigate to clinical history
- Location: tests\professional.spec.ts:31:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="email"]')

```

# Page snapshot

```yaml
- generic [ref=e7]:
  - generic [ref=e8]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - img [ref=e13]
        - generic [ref=e15]: TurnosApp
      - heading "Tu salud, organizada." [level=2] [ref=e16]:
        - text: Tu salud,
        - text: organizada.
      - paragraph [ref=e17]: Gestioná tus citas médicas con la plataforma más avanzada y sencilla del mercado.
    - generic [ref=e18]:
      - generic [ref=e19]:
        - img [ref=e21]
        - img [ref=e25]
        - img [ref=e29]
        - img [ref=e33]
        - generic [ref=e36]: +2k
      - paragraph [ref=e37]: Confiado por profesionales
  - generic [ref=e39]:
    - button "Volver atrás" [ref=e40]:
      - img [ref=e41]
      - text: Volver atrás
    - generic [ref=e43]:
      - img [ref=e45]
      - heading "Acceso Profesional" [level=3] [ref=e47]
      - paragraph [ref=e48]: Ingresá tus credenciales para continuar
    - generic [ref=e49]:
      - generic [ref=e50]:
        - text: Correo o DNI
        - generic [ref=e51]:
          - img [ref=e52]
          - textbox "ejemplo@correo.com" [ref=e55]: juanperez@turnos.com
      - generic [ref=e56]:
        - text: Contraseña
        - generic [ref=e57]:
          - img [ref=e58]
          - textbox "••••••••" [ref=e61]: "123"
      - button "Iniciar Sesión" [ref=e62]
    - generic [ref=e63]:
      - paragraph [ref=e64]:
        - text: ¿Aún no tenés cuenta?
        - button "Registrate ahora" [ref=e65]
      - button "¿Olvidaste tu contraseña? Recuperar ahora" [ref=e67]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Professional Portal Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Login as professional
  6  |     await page.goto('/login');
  7  |     await page.click('text=Soy Profesional');
> 8  |     await page.fill('input[name="email"]', 'juanperez@turnos.com');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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