/* eslint-env node */
/* global require, process, console, Buffer, __dirname */
const fs = require('fs')
const http = require('http')
const path = require('path')
const file = path.join(__dirname, 'test_payload.json')
const data = fs.readFileSync(file, 'utf8')

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/tensorapid/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}

const req = http.request(options, (res) => {
  let body = ''
  res.setEncoding('utf8')
  res.on('data', (chunk) => {
    body += chunk
  })
  res.on('end', () => {
    console.log('STATUS', res.statusCode)
    console.log('HEADERS', res.headers)
    console.log('BODY', body)
  })
})

req.on('error', (e) => {
  console.error('problem with request:', e.message)
})

req.write(data)
req.end()
