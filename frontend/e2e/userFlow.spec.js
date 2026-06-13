import { test, expect, request } from '@playwright/test';

const BASE_URL = process.env.CI
  ? 'https://robinhoot-frontend.onrender.com'
  : 'http://localhost:3000';

const API_URL = 'https://robinhoot-backend.onrender.com';

test.describe('Flujo de Usuario Completo', () => {

  test('Debería navegar a la landing, fallar validación, hacer login exitoso y luego logout', async ({ page, context }) => {
    
    // 1. Navegación Landing
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Robin/i);

    // 2. Ir a página de login
    await page.goto(`${BASE_URL}/login`);

    // 3. Validación de formularios con errores (intento de login vacío)
    await page.locator('form button[type="submit"]').click();

    // Validación de errores del formulario
    await expect(page.getByText('El email es requerido')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('La contraseña es requerida')).toBeVisible({ timeout: 5000 });

    // 4. Login via API directamente para obtener cookie
    const apiContext = await request.newContext({ baseURL: API_URL });
    const loginResponse = await apiContext.post('/api/usuarios/auth/login', {
      data: {
        email: 'test_e2e@robinhoot.com',
        password: 'TestCI2026'
      }
    });

    // Extraer cookies de la respuesta del login
    const cookies = loginResponse.headers()['set-cookie'];
    if (cookies) {
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      for (const cookie of cookieArray) {
        const parts = cookie.split(';')[0].split('=');
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        await context.addCookies([{
          name,
          value,
          domain: process.env.CI ? 'robinhoot-frontend.onrender.com' : 'localhost',
          path: '/',
        }]);
      }
    }

    // 5. Navegar al dashboard con la cookie seteada
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // Confirmar que el Dashboard renderizó
    await expect(page.getByText('Panel de Desafios')).toBeVisible({ timeout: 10000 });

    // 6. Logout
    await page.locator('.navbar-links button').last().click();

    // Verifica que fuimos expulsados de vuelta a la página principal
    await expect(page).toHaveURL(/.*\//, { timeout: 10000 });
  });

});
