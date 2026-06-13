import { test, expect } from '@playwright/test';

test.describe('Flujo de Usuario Completo', () => {

  test('Debería navegar a la landing, fallar validación, hacer login exitoso y luego logout', async ({ page }) => {
    // 1. Navegación Landing
    await page.goto('/');
    await expect(page).toHaveTitle(/Robin/i);

    // 2. Ir a página de login
    await page.goto('/login');

    // 3. Validación de formularios con errores (intento de login vacío)
    await page.locator('form button[type="submit"]').click();

    // Validación de errores del formulario
    await expect(page.getByText('El email es requerido')).toBeVisible();
    await expect(page.getByText('La contraseña es requerida')).toBeVisible();

    // 4. Login exitoso con usuario de prueba
    await page.fill('input[type="email"]', 'test_e2e@robinhoot.com');
    await page.fill('input[type="password"]', 'TestCI2026');
    await page.locator('form button[type="submit"]').click();

    // 5. Verificar que entramos al Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Confirmar que el Dashboard renderizó
    await expect(page.getByText('Panel de Desafios')).toBeVisible({ timeout: 10000 });

    // 6. Logout
    await page.locator('.navbar-links button').last().click();

    // Verifica que fuimos expulsados de vuelta a la página principal
    await expect(page).toHaveURL(/.*\//, { timeout: 10000 });
  });

});
