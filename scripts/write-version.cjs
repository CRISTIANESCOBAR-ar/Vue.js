/* eslint-env node */
/* global __dirname, process, console */
const fs = require('fs')
const path = require('path')

const pkgPath = path.resolve(__dirname, '..', 'package.json')
const outPath = path.resolve(__dirname, '..', 'public', 'version.json')

try {
  // VERSION: prefer env var, otherwise package.json.version, otherwise fallback
  let version =
    typeof process.env.VERSION === 'string' && process.env.VERSION.trim()
      ? process.env.VERSION.trim()
      : null
  if (!version) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      version = pkg.version || '0.0.0'
    } catch {
      version = '0.0.0'
    }
  }

  // buildTime: always now
  const buildTime = new Date().toISOString()

  // commitSha: try to read from git
  let commitSha = null
  try {
    const { execSync } = require('child_process')
    commitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    commitSha = null
  }

  // buildNumber: prefer env BUILD_NUMBER (if valid number), otherwise read existing and increment
  let buildNumber = null
  if (typeof process.env.BUILD_NUMBER === 'string' && process.env.BUILD_NUMBER.trim()) {
    const parsed = Number(process.env.BUILD_NUMBER.trim())
    if (Number.isFinite(parsed) && parsed >= 0) buildNumber = parsed
  }

  if (buildNumber == null) {
    try {
      if (fs.existsSync(outPath)) {
        const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'))
        if (prev && typeof prev.buildNumber === 'number') buildNumber = prev.buildNumber
      }
    } catch {
      buildNumber = 0
    }
    buildNumber = (typeof buildNumber === 'number' ? buildNumber : 0) + 1
  }

  const data = { version, buildTime, commitSha, buildNumber }
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8')
  console.log('Wrote', outPath, data)
} catch (err) {
  console.error('Failed to write version.json', err)
  process.exit(1)
}
