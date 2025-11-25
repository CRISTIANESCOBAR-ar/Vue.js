/**
 * Script para agregar columna ESTIRAJE a la tabla USTER_PAR
 * 
 * La columna ESTIRAJE almacenará el valor de estiraje ingresado manualmente por el usuario
 * Tipo: VARCHAR2(100) para permitir diferentes formatos de entrada
 * 
 * Uso: node server/add_estiraje_column.js
 */

import { initPool, getConnection, closePool } from './db.js'
import oracledb from 'oracledb'

async function addEstirajeColumn() {
  let conn
  try {
    console.log('🔧 Conectando a Oracle...')
    await initPool()
    conn = await getConnection()

    // Obtener el SCHEMA_PREFIX del entorno
    const SCHEMA_PREFIX = process.env.SCHEMA_PREFIX || ''
    const tableName = `${SCHEMA_PREFIX}USTER_PAR`

    console.log(`📋 Verificando si la columna ESTIRAJE ya existe en ${tableName}...`)

    // Verificar si la columna ya existe
    const checkSql = `
      SELECT COUNT(*) AS CNT
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USTER_PAR' AND COLUMN_NAME = 'ESTIRAJE'
    `
    const checkResult = await conn.execute(checkSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })
    const exists = checkResult.rows[0].CNT > 0

    if (exists) {
      console.log('✅ La columna ESTIRAJE ya existe en la tabla USTER_PAR.')
      return
    }

    console.log('➕ Agregando columna ESTIRAJE...')

    // Agregar columna ESTIRAJE
    const alterSql = `
      ALTER TABLE ${tableName}
      ADD (ESTIRAJE VARCHAR2(100))
    `
    await conn.execute(alterSql, [], { autoCommit: true })

    console.log('✅ Columna ESTIRAJE agregada exitosamente a USTER_PAR.')
    console.log('   Tipo: VARCHAR2(100)')
    console.log('   Permite valores NULL')

  } catch (err) {
    console.error('❌ Error al agregar columna ESTIRAJE:', err)
    throw err
  } finally {
    if (conn) {
      try {
        await conn.close()
        console.log('🔌 Conexión cerrada.')
      } catch (e) {
        console.error('Error cerrando conexión:', e)
      }
    }
    try {
      await closePool()
    } catch (e) {
      console.error('Error cerrando pool:', e)
    }
  }
}

// Ejecutar
addEstirajeColumn()
  .then(() => {
    console.log('🎉 Proceso completado.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Error fatal:', err)
    process.exit(1)
  })
