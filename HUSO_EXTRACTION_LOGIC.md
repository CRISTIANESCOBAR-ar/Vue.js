# Lógica de Extracción del Número de Huso

## Formato de datos TBL de TensoRapid

El archivo `.TBL` de TensoRapid contiene en la columna 1 (segunda columna) el valor de Ne (título del hilo) en formato `X/Y`, donde:

- **X** = Número de huso (spindle number) que identifica la bobina/huso de prueba
- **Y** = Número de cabos o torsión

## Lógica implementada

### Función de extracción

```javascript
function extractHusoNumber(neValue) {
  if (!neValue || typeof neValue !== 'string') return ''
  const match = neValue.trim().match(/^(\d+)\//)
  return match && match[1] ? match[1] : ''
}
```

### Expresión regular: `/^(\d+)\//`

- `^` = Inicio de la cadena
- `(\d+)` = Captura uno o más dígitos (el número de huso)
- `\/` = Busca el carácter `/` literal
- Resultado: Captura solo los dígitos antes de la primera `/`

## Ejemplos de extracción

| Valor Ne en TBL | Número de Huso extraído | Uso en USTER |
| --------------- | ----------------------- | ------------ |
| `62/5`          | `62`                    | Bobina 62    |
| `320/5`         | `320`                   | Bobina 320   |
| `1/1`           | `1`                     | Bobina 1     |
| `125/2`         | `125`                   | Bobina 125   |
| `8/3`           | `8`                     | Bobina 8     |

## Casos especiales

| Valor Ne | Resultado  | Nota                                     |
| -------- | ---------- | ---------------------------------------- |
| `62`     | `` (vacío) | No tiene `/`, usa índice+1 como fallback |
| `62/`    | `62`       | Válido                                   |
| `/5`     | `` (vacío) | No tiene número antes de `/`             |
| `ABC/5`  | `` (vacío) | No numérico                              |
| `null`   | `` (vacío) | Valor nulo                               |

## Flujo en saveToOracle()

```javascript
const tblDataToSave = parsedTblData.value.map((row, index) => {
  // Extraer número de huso de la columna 1 (formato "62/5", "320/5", etc)
  let husoNumber = null
  if (row[1] && row[1].trim() !== '') {
    const match = row[1].trim().match(/^(\d+)\//)
    if (match && match[1]) {
      husoNumber = parseInt(match[1], 10)
    }
  }

  // Si no se puede extraer, usar índice+1 como fallback
  if (!husoNumber || isNaN(husoNumber)) {
    husoNumber = index + 1
  }

  return {
    TESTNR: row[0] || parDataToSave.TESTNR,
    NO: husoNumber // <- Número de huso extraído
    // ... otros campos
  }
})
```

## Visualización en la tabla

La tabla TBL ahora muestra:

1. **Columna "Ne"**: Valor original (`62/5`, `320/5`, etc.)
2. **Columna "Huso"** (destacada en azul): Número extraído (`62`, `320`, etc.)
3. Esto permite verificar visualmente que la extracción es correcta antes de guardar

## Beneficios

1. **Trazabilidad**: El número de huso vincula directamente con el ensayo USTER
2. **Validación visual**: Se puede verificar en la UI antes de guardar
3. **Fallback automático**: Si falla la extracción, usa índice secuencial
4. **Robusto**: Maneja casos especiales sin errores
