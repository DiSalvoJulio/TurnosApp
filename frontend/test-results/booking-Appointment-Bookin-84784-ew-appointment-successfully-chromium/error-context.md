# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Appointment Booking Flow >> should book a new appointment successfully
- Location: tests\booking.spec.ts:18:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { format, addDays } from 'date-fns';
  3  | 
  4  | test.describe('Appointment Booking Flow', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // 1. Login as patient
> 7  |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  8  |     // Role selection is needed!
  9  |     await page.click('text=Soy Paciente');
  10 |     await page.fill('input[name="email"]', 'paciente@turnos.com');
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
  40 |     await page.fill('input[name="appointmentDate"]', format(tomorrow, 'yyyy-MM-dd'));
  41 |     const dateStr = format(tomorrow, 'yyyy-MM-dd');
  42 | 
  43 |     const dateInput = page.locator('input[type="date"]');
  44 |     await dateInput.fill(dateStr);
  45 | 
  46 |     // 6. Select Slot
  47 |     // Wait for slots to load
  48 |     const slotButton = page.locator('button:has-text(":")').first();
  49 |     await expect(slotButton).toBeVisible({ timeout: 10000 });
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