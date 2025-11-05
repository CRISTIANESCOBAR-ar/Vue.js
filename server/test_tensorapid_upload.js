/* eslint-env node */
/**
 * Test script to validate TensoRapid upload with clean schema
 */
import dotenv from 'dotenv'
dotenv.config()

const backendUrl = 'http://localhost:3001'

// Sample payload matching the .PAR structure from TensoRapid.vue
const testPayload = {
  par: {
    TESTNR: 'TEST001',
    USTER_TESTNR: '05410', // Must exist in USTER_PAR
    CATALOG: 'SAMPLE_CATALOG',
    TIME: '2024-01-15 10:30:00',
    SORTIMENT: 'SORT_A',
    ARTICLE: 'ART_123',
    MASCHNR: 'MACH_456',
    MATCLASS: 'CLASS_1',
    NOMCOUNT: 30,
    NOMTWIST: 15,
    USCODE: 'USC_001',
    LABORANT: 'John Doe',
    COMMENT: 'Test comment',
    LOTE: 'LOTE_001',
    TUNAME: 'TU_NAME_1',
    GROUPS: 5,
    WITHIN: 10,
    TOTAL: 50,
    UNSPOOLGROUPS: 2,
    LENGTH: 500,
    EXTSPEED: 300,
    PRETENSION: 10,
    CLAMPPRESSURE: 20,
    CYCLEFORCELL: 100,
    CYCLEFORCEUL: 200,
    NMBOFFORCECYCLES: 5,
    CYCLELONGLL: 50,
    CYCLELONGUL: 100,
    NMBOFELONGCYCLES: 3,
    FORCEF1REL: 150,
    ELONGATIONE1REL: 25,
    EVALTIMEREL: 60,
    PRELOADCYCLESREL: 2,
    FORCEF1RET: 140,
    ELONGATIONE1RET: 23,
    EVALTIMERET: 55,
    PRELOADCYCLESRET: 2
  },
  tbl: [
    {
      TESTNR: 'TEST001',
      HUSO_ENSAYOS: '62/5',
      HUSO_NUMBER: 62,
      TIEMPO_ROTURA: 1.23,
      FUERZA_B: 45.6,
      ELONGACION: 12.3,
      TENACIDAD: 89.4,
      TRABAJO: 234.5
    },
    {
      TESTNR: 'TEST001',
      HUSO_ENSAYOS: '320/5',
      HUSO_NUMBER: 320,
      TIEMPO_ROTURA: 1.45,
      FUERZA_B: 46.2,
      ELONGACION: 13.1,
      TENACIDAD: 91.2,
      TRABAJO: 241.3
    }
  ]
}

async function testUpload() {
  try {
    console.log('🧪 Testing TensoRapid upload with clean schema...')
    console.log('\n📤 Sending payload:')
    console.log('  TESTNR:', testPayload.par.TESTNR)
    console.log('  USTER_TESTNR:', testPayload.par.USTER_TESTNR)
    console.log('  TBL rows:', testPayload.tbl.length)

    const response = await fetch(`${backendUrl}/api/tensorapid/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })

    console.log('\n📥 Response:')
    console.log('  Status:', response.status, response.statusText)

    const data = await response.json()
    console.log('  Body:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ Upload successful!')
      console.log('   Inserted TBL rows:', data.inserted)

      // Query to verify
      console.log('\n🔍 Verifying data in database...')
      const verifyResponse = await fetch(`${backendUrl}/api/tensorapid/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testnrs: [testPayload.par.TESTNR] })
      })

      const verifyData = await verifyResponse.json()
      console.log('   Status check:', JSON.stringify(verifyData, null, 2))

      if (verifyData.existing && verifyData.existing.includes(testPayload.par.TESTNR)) {
        console.log('\n🎉 Test PASSED! Data was saved correctly.')
      } else {
        console.log('\n⚠️  Warning: Data not found in status check')
      }
    } else {
      console.log('\n❌ Upload failed!')
      console.log('   Error:', data.error || 'Unknown error')
    }
  } catch (err) {
    console.error('\n💥 Test failed with exception:', err)
  }
}

testUpload()
