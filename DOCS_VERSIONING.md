Controlar version.json en CI / local

El proyecto incluye `scripts/write-version.cjs` (ejecutado como `prebuild`) que ahora admite las variables de entorno `VERSION` y `BUILD_NUMBER`.

PowerShell (local):

```powershell
$env:BUILD_NUMBER = "42"
npm run build
```

Forzar `VERSION` y `BUILD_NUMBER`:

```powershell
$env:VERSION = "1.2.3"
$env:BUILD_NUMBER = "42"
npm run build
```

Linux / macOS:

```bash
BUILD_NUMBER=42 npm run build
VERSION=1.2.3 BUILD_NUMBER=42 npm run build
```

GitHub Actions (ejemplo):

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set version from tag (optional)
        run: |
          TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          echo "VERSION=$TAG" >> $GITHUB_ENV
      - name: Build
        env:
          BUILD_NUMBER: ${{ github.run_number }}
          VERSION: ${{ env.VERSION }}
        run: |
          npm ci
          npm run build
```

Con esto puedes controlar con precisión la versión pública (`version`) y el contador público (`buildNumber`) desde CI o localmente.
