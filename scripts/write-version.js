/* eslint-disable no-undef */
/* eslint-env node */
/* global __dirname, process, console */
const fs = require('fs')
const path = require('path')

const pkgPath = path.resolve(__dirname, '..', 'package.json')
const outPath = path.resolve(__dirname, '..', 'public', 'version.json')

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const version = pkg.version || '0.0.0'
  const buildTime = new Date().toISOString()
  const data = { version, buildTime }
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8')
  console.log('Wrote', outPath, data)
} catch (err) {
  console.error('Failed to write version.json', err)
  process.exit(1)
}
