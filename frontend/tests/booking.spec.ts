import { test, expect } from '@playwright/test';
import { format, addDays } from 'date-fns';

test.describe('Appointment Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login as patient
    await page.goto('/login');
    // Role selection is needed!
    await page.click('text=Soy Paciente');
    await page.fill('input[name="email"]', 'paciente@turnos.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');

    // Check we are in dashboard
    await expect(page).toHaveURL(/\/patient\/dashboard/);
  });

  test('should book a new appointment successfully', async ({ page }) => {
    // 2. Navigate to booking
    await page.click('text=Reservar Turno');
    await expect(page).toHaveURL(/\/patient\/book/);

    // 3. Select Specialty
    // We wait for the select to be filled with data from the API
    const specialtySelect = page.locator('select').first();
    await expect(specialtySelect).not.toBeDisabled();

    // Select "Osteopatía" (from seeder)
    await specialtySelect.selectOption({ label: 'Osteopatía' });

    // 4. Select Professional
    const professionalSelect = page.locator('select').nth(1);
    await expect(professionalSelect).not.toBeDisabled();
    await professionalSelect.selectOption({ label: 'Juan Pérez' });

    // 5. Select Date (Tomorrow)
    const tomorrow = addDays(new Date(), 1);
    // If tomorrow is Sunday, use Monday
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[name="appointmentDate"]', format(tomorrow, 'yyyy-MM-dd'));
    const dateStr = format(tomorrow, 'yyyy-MM-dd');

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(dateStr);

    // 6. Select Slot
    // Wait for slots to load
    const slotButton = page.locator('button:has-text(":")').first();
    await expect(slotButton).toBeVisible({ timeout: 10000 });
    await slotButton.click();

    // 7. Confirm
    const confirmButton = page.locator('button:has-text("Confirmar mi Cita")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 8. Verify Success
    await expect(page.locator('h2')).toContainText('¡Turno Confirmado!', { timeout: 10000 });
    await expect(page.locator('text=Su cita ha sido registrada exitosamente')).toBeVisible();
  });
});
