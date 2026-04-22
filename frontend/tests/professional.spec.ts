import { test, expect } from '@playwright/test';

test.describe('Professional Portal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as professional
    await page.goto('/login');
    await page.click('text=Soy Profesional');
    await page.fill('input[name="email"]', 'juanperez@turnos.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Check we are in professional dashboard
    await expect(page).toHaveURL(/\/professional\/dashboard/);
  });

  test('should navigate to agenda and check structure', async ({ page }) => {
    await page.click('text=Turnos Asignados');
    await expect(page).toHaveURL(/\/professional\/agenda/);

    // Verify Title
    await expect(page.locator('h1')).toContainText('Agenda Médica');

    // Verify presence of "Nuevo Turno" button
    await expect(page.locator('button:has-text("Nuevo Turno")')).toBeVisible();

    // Verify week navigation buttons
    const navButtons = page.locator('button > svg.lucide-chevron-left, button > svg.lucide-chevron-right');
    await expect(navButtons).toHaveCount(2);
  });

  test('should navigate to clinical history', async ({ page }) => {
    await page.goto('/professional/dashboard');
    await page.click('text=Historias Clínicas');
    await expect(page).toHaveURL(/\/professional\/history/);
    
    await expect(page.locator('h1')).toContainText('Historias Clínicas');
    await expect(page.locator('placeholder="DNI, Apellido o Nombre..."')).toBeVisible();
  });

  test('should open profile and check structure', async ({ page }) => {
    // Click on profile picture in dashboard
    const profilePic = page.locator('.w-24.h-24.bg-slate-100');
    await profilePic.click();
    
    await expect(page).toHaveURL(/\/professional\/profile/);
    await expect(page.locator('h1')).toContainText('Profesional');
    await expect(page.locator('button:has-text("Editar Perfil")')).toBeVisible();
  });
});
