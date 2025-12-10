# Plan de Migración Access → SQLite → Supabase

## Tablas Prioritarias (540 MB aprox)

| Tabla | Filas | Tamaño Est. | Estrategia |
|-------|-------|-------------|------------|
| tb_PRODUCCION | 658k | 263 MB | Exportar por mes (2023, 2024, 2025...) |
| tb_CALIDAD | 675k | 235 MB | Exportar por mes |
| tb_PARADAS | 78k | 11 MB | Exportar por trimestre |
| tb_RESIDUOS_POR_SECTOR | 17k | 1.7 MB | Exportación completa |
| tb_TESTES | 18k | 3.2 MB | Exportación completa |
| tb_RESIDUOS_INDIGO | 2.9k | 426 KB | Exportación completa |
| tb_FICHAS | 1.7k | 919 KB | Exportación completa |

**Total estimado**: ~515 MB en CSV (comprimible a ~50-100 MB).

---

## Fase 1: Identificar Columnas de Fecha

Necesito que me confirmes el nombre exacto de la columna de fecha en cada tabla:

```vba
' Ejecuta esto en Excel/Access VBA para obtener los nombres:
Sub MostrarColumnasFecha()
  Dim cn As Object, rs As Object
  Set cn = CreateObject("ADODB.Connection")
  cn.Open "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=C:\STC\rptProdTec.accdb;"
  
  Dim tablas: tablas = Array("tb_PRODUCCION", "tb_CALIDAD", "tb_PARADAS", _
                             "tb_RESIDUOS_POR_SECTOR", "tb_TESTES", _
                             "tb_RESIDUOS_INDIGO", "tb_FICHAS")
  Dim t, i
  For Each t In tablas
    Set rs = cn.Execute("SELECT TOP 1 * FROM [" & t & "]")
    Debug.Print "=== " & t & " ==="
    For i = 0 To rs.Fields.Count - 1
      If InStr(1, LCase(rs.Fields(i).Name), "fecha") > 0 Or _
         InStr(1, LCase(rs.Fields(i).Name), "data") > 0 Or _
         rs.Fields(i).Type = 7 Then ' adDate
        Debug.Print "  - " & rs.Fields(i).Name & " (Tipo: " & rs.Fields(i).Type & ")"
      End If
    Next
    rs.Close
  Next
  cn.Close
End Sub
```

**Responde con formato:**
```
tb_PRODUCCION: Fecha
tb_CALIDAD: DataTeste
tb_PARADAS: FechaInicio
...
```

---

## Fase 2: Exportación Segmentada

**Macro VBA con:**
- Segmentación por mes para `tb_PRODUCCION`, `tb_CALIDAD`, `tb_PARADAS`.
- Exportación completa para tablas < 5 MB.
- Barra de progreso en StatusBar.
- Detención con Esc.
- Log de errores en `exports\log_exportacion.txt`.

**Estructura de archivos CSV:**
```
exports/
  tb_PRODUCCION_2023_01.csv
  tb_PRODUCCION_2023_02.csv
  ...
  tb_CALIDAD_2024_12.csv
  tb_PARADAS_2025_Q1.csv
  tb_FICHAS.csv
  tb_TESTES.csv
  ...
```

**Tiempo estimado:** 20-40 min (depende de disco, ~10-20 MB/s escritura).

---

## Fase 3: Validación

**Script PowerShell:**
- Leer inventario Access (filas totales).
- Contar filas en CSV (suma de todos los archivos por tabla).
- Comparar: Access vs CSV.
- Generar reporte `exports\validacion.txt`.

**Ejemplo:**
```
tb_PRODUCCION: 658264 (Access) vs 658264 (CSV) ✓
tb_CALIDAD: 675334 (Access) vs 675320 (CSV) ⚠️ -14 filas
```

---

## Fase 4: Importación a SQLite

**Script PowerShell mejorado:**
1. Crear DB: `exports\prodtec.db`.
2. Para cada tabla:
   - Detectar tipo de columnas (fecha, numérico, texto) vía primeras filas CSV.
   - `CREATE TABLE` con tipos correctos.
   - Importar CSV con `.mode csv` + `.import`.
   - Crear índices:
     - `CREATE INDEX idx_produccion_fecha ON tb_PRODUCCION(Fecha);`
     - `CREATE INDEX idx_calidad_fecha ON tb_CALIDAD(Fecha);`
     - Índices compuestos según joins comunes (definir después con tus consultas SQL).

**Tiempo estimado:** 10-15 min.

---

## Fase 5: Schema Definitivo SQLite/Postgres

**Sin IDs autoincrementales, usar PKs compuestas:**
```sql
-- Ejemplo tb_PRODUCCION
CREATE TABLE tb_PRODUCCION (
  Fecha DATE NOT NULL,
  Maquina TEXT,
  Turno TEXT,
  Articulo TEXT,
  Metros REAL,
  ... (resto de columnas),
  PRIMARY KEY (Fecha, Maquina, Turno, Articulo) -- ajustar según unicidad real
);

CREATE INDEX idx_prod_fecha ON tb_PRODUCCION(Fecha);
CREATE INDEX idx_prod_articulo ON tb_PRODUCCION(Articulo);
CREATE INDEX idx_prod_maq_fecha ON tb_PRODUCCION(Maquina, Fecha);
```

**Validar unicidad:**
- Consulta en Access: `SELECT Fecha, Maquina, Turno, Articulo, COUNT(*) FROM tb_PRODUCCION GROUP BY ... HAVING COUNT(*) > 1`
- Si hay duplicados, agregar columna sintética `row_number` o timestamp al importar.

---

## Fase 6: Migración Incremental

**Estrategia de actualización mensual:**
1. En Excel/VBA: exportar solo el mes nuevo (WHERE Fecha = '2025-12-01').
2. En SQLite:
   ```sql
   DELETE FROM tb_PRODUCCION WHERE Fecha BETWEEN '2025-12-01' AND '2025-12-31';
   -- luego importar CSV del mes
   ```
3. Script PowerShell parametrizable: `.\scripts\update-month.ps1 -Tabla tb_PRODUCCION -Mes 2025-12`.

**Ventaja:** solo reexportar ~20-50k filas/mes en lugar de 658k completos.

---

## Fase 7: Migración a Supabase (Postgres)

**Cuando estés listo para cloud:**
1. Exportar schema SQLite a DDL Postgres (ajustar sintaxis: `AUTOINCREMENT` → `SERIAL`, tipos fecha).
2. Subir CSV a Supabase Storage o usar `psql \COPY`:
   ```bash
   psql -h db.xxx.supabase.co -U postgres -d postgres \
     -c "\COPY tb_PRODUCCION FROM 'tb_PRODUCCION.csv' CSV HEADER"
   ```
3. Configurar RLS (Row Level Security) si hay restricciones de acceso por usuario/rol.
4. Crear vistas materializadas para informes pesados:
   ```sql
   CREATE MATERIALIZED VIEW mv_produccion_mensual AS
   SELECT DATE_TRUNC('month', Fecha) AS Mes, SUM(Metros) AS Total
   FROM tb_PRODUCCION GROUP BY Mes;
   ```

---

## Resumen de Entregables

1. **VBA**: `ExportarAccessSegmentado.vba` (con parámetros fecha inicio/fin).
2. **PowerShell**: 
   - `validate-exports.ps1` (validación filas).
   - `import-to-sqlite-enhanced.ps1` (con tipos e índices).
   - `update-month.ps1` (incremental).
3. **SQL**: `schema-sqlite.sql` y `schema-postgres.sql`.
4. **Docs**: Este plan + README de uso.

---

## Siguiente Paso Inmediato

**Ejecuta el snippet VBA arriba** (`MostrarColumnasFecha`) y pégame la salida. Con eso genero el macro de exportación completo listo para usar.

Alternativamente, si me pasas el nombre de una columna de fecha de cada tabla directamente, arranco ya con el código.
