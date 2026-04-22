# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Appointment Booking Flow >> should book a new appointment successfully
- Location: tests\booking.spec.ts:18:3

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
  2  | import { format, addDays } from 'date-fns';
  3  | 
  4  | test.describe('Appointment Booking Flow', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // 1. Login as patient
  7  |     await page.goto('/login');
  8  |     // Role selection is needed!
  9  |     await page.click('text=Soy Paciente');
> 10 |     await page.fill('input[name="email"]', 'paciente@turnos.com');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  11 |     await page.fill('input[name="password"]', '123');
  12 |     await page.click('button[type="submit"]');
  13 |     
  14 |     // Check we are in dashboard
  15 |     await expect(page).toHaveURL(/\/patient\/dashboard/);
  16 |   });
  17 | 
  18 |   test('should book a new appointment successfully', async ({ page }) => {
  19 |     // 2. Navigate to booking
  20 |     await page.click('text=Reservar Turno');
  21 |     await expect(page).toHaveURL(/\/patient\/book/);
  22 | 
  23 |     // 3. Select Specialty
  24 |     // We wait for the select to be filled with data from the API
  25 |     const specialtySelect = page.locator('select').first();
  26 |     await expect(specialtySelect).not.toBeDisabled();
  27 |     
  28 |     // Select "Osteopatía" (from seeder)
  29 |     await specialtySelect.selectOption({ label: 'Osteopatía' });
  30 | 
  31 |     // 4. Select Professional
  32 |     const professionalSelect = page.locator('select').nth(1);
  33 |     await expect(professionalSelect).not.toBeDisabled();
  34 |     await professionalSelect.selectOption({ label: 'Juan Pérez' });
  35 | 
  36 |     // 5. Select Date (Tomorrow)
  37 |     const tomorrow = addDays(new Date(), 1);
  38 |     // If tomorrow is Sunday, use Monday
  39 |     if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
  40 |     const dateStr = format(tomorrow, 'yyyy-MM-dd');
  41 |     
  42 |     const dateInput = page.locator('input[type="date"]');
  43 |     await dateInput.fill(dateStr);
  44 | 
  45 |     // 6. Select Slot
  46 |     // Wait for slots to load
  47 |     const slotButton = page.locator('button:has-text(":")').first();
  48 |     await expect(slotButton).toBeVisible({ timeout: 10000 });
  49 |     const slotText = await slotButton.innerText();
  50 |     await slotButton.click();
  51 | 
  52 |     // 7. Confirm
  53 |     const confirmButton = page.locator('button:has-text("Confirmar mi Cita")');
  54 |     await expect(confirmButton).toBeVisible();
  55 |     await confirmButton.click();
  56 | 
  57 |     // 8. Verify Success
  58 |     await expect(page.locator('h2')).toContainText('¡Turno Confirmado!', { timeout: 10000 });
  59 |     await expect(page.locator('text=Su cita ha sido registrada exitosamente')).toBeVisible();
  60 |   });
  61 | });
  62 | 
```