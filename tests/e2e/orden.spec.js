/* eslint-env node, browser */
/* global localStorage, process */
import { test, expect } from '@playwright/test'

// Nota: el servidor dev debe estar corriendo en http://localhost:5173
const APP_URL = process.env.APP_URL || 'http://localhost:5173/'

// Helper para rellenar el formulario
async function addRegistro(page, { rolada, base, color, metros, observaciones }) {
  await page.fill('#rolada', String(rolada))
  await page.fill('#base', base)
  await page.fill('#color', color)
  await page.fill('#metros', String(metros))
  await page.fill('#observaciones', observaciones || '')
  await page.click('button:has-text("Guardar")')
  // esperar la notificación toast
  await page.waitForTimeout(600)
}

test.describe('Orden último-agregado-primero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL)
    // limpiar localStorage para partir de cero
    await page.evaluate(() => localStorage.removeItem('roladas'))
    await page.reload()
  })

  test('al agregar registros se muestra último agregado primero y persiste tras recarga', async ({
    page
  }) => {
    // agregar A, B, C
    await addRegistro(page, {
      rolada: '0001',
      base: 'A',
      color: 'X',
      metros: 10,
      observaciones: 'A'
    })
    await addRegistro(page, {
      rolada: '0002',
      base: 'B',
      color: 'Y',
      metros: 20,
      observaciones: 'B'
    })
    await addRegistro(page, {
      rolada: '0003',
      base: 'C',
      color: 'Z',
      metros: 30,
      observaciones: 'C'
    })

    // leer la primera fila en la tabla/lista: debería corresponder al último agregado (C)
    // seleccionamos el primer elemento visible del listado
    const firstText = await page.locator('table.registro-table tbody tr').first().innerText()
    expect(firstText).toContain('C')

    // recargar y comprobar de nuevo
    await page.reload()
    const firstText2 = await page.locator('table.registro-table tbody tr').first().innerText()
    expect(firstText2).toContain('C')
  })
})
