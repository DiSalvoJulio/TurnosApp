# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login Flow >> should show error on invalid credentials
- Location: tests\login.spec.ts:12:3

# Error details

```
Test timeout of 30000ms exceeded.
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
      - heading "Acceso Paciente" [level=3] [ref=e48]
      - paragraph [ref=e49]: Ingresá tus credenciales para continuar
    - generic [ref=e50]:
      - generic [ref=e51]:
        - text: Correo o DNI
        - generic [ref=e52]:
          - img [ref=e53]
          - textbox "ejemplo@correo.com" [ref=e56]: paciente@turnos.com
      - generic [ref=e57]:
        - text: Contraseña
        - generic [ref=e58]:
          - img [ref=e59]
          - textbox "••••••••" [ref=e62]: "123"
      - button "Iniciar Sesión" [ref=e63]
    - generic [ref=e64]:
      - paragraph [ref=e65]:
        - text: ¿Aún no tenés cuenta?
        - button "Registrate ahora" [ref=e66]
      - button "¿Olvidaste tu contraseña? Recuperar ahora" [ref=e68]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login Flow', () => {
  4  |   test('should show login form', async ({ page }) => {
  5  |     // Note: This expects the dev server to be running on 5173
  6  |     await page.goto('http://localhost:5173/login');
  7  |     
  8  |     await expect(page.locator('h3')).toContainText('Bienvenido de nuevo');
  9  |     await expect(page.locator('button:has-text("Soy Paciente")')).toBeVisible();
  10 |   });
  11 | 
  12 |   test('should show error on invalid credentials', async ({ page }) => {
  13 |     await page.goto('http://localhost:5173/login');
  14 |     await page.click('text=Soy Paciente');
  15 |     
> 16 |     await page.fill('input[name="email"]', 'wrong@user.com');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  17 |     await page.fill('input[name="password"]', 'wrongpassword');
  18 |     await page.click('button[type="submit"]');
  19 |     
  20 |     // Check for error message in the UI
  21 |     await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
  22 |   });
  23 | });
  24 | 
```