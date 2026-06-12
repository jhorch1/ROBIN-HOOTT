import { test, expect } from '@playwright/test';

test.describe('Flujo de Usuario Completo', () => {

  test('Debería navegar a la landing, fallar validación, hacer login exitoso y luego logout', async ({ page }) => {
    // 1. Navegación Landing
    await page.goto('/');
    await expect(page).toHaveTitle(/Robin/i); 
    
    // 2. Ir a página de login navegando por URL
    await page.goto('/login');

    // 3. Validación de formularios con errores (intento de login vacío)
    await page.locator('form button[type="submit"]').click();
    
    // Validación exacta de los textos que arroja nuestro Zod schema en español
    await expect(page.getByText('El email es requerido')).toBeVisible(); 
    await expect(page.getByText('La contraseña es requerida')).toBeVisible(); 

    // 4. Login exitoso (usando una cuenta de pruebas de Uniputumayo)
    await page.fill('input[type="email"]', 'stiven@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.locator('form button[type="submit"]').click();

    // 5. Manipulación de datos (Verificar que entramos al Dashboard)
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Confirmar que el Dashboard renderizó el panel de desafíos
    await expect(page.getByText('Panel de Desafios')).toBeVisible();

    // 6. Logout 
    // Ahora en el Dashboard sí existe la Navbar. Le damos clic al último botón de la barra (el del ícono LogOut)
    await page.locator('.navbar-links button').last().click();
    
    // Verifica que fuimos expulsados de vuelta a la página principal
    await expect(page).toHaveURL(/.*\//);
  });

});
