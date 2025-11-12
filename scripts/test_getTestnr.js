/* eslint-env node */
/* global console */
// Quick test harness for the getTestnrFromName logic
function getTestnrFromName(name) {
  if (!name) return null
  const s = String(name)
  // First, prefer patterns like STCxx_00260
  let m = s.match(/STC\d{2}[_-]?(\d{5})/i)
  if (m && m[1]) return m[1]
  // Next, prefer an underscore-delimited 5-digit block: _00260_ or _00260.
  m = s.match(/_(\d{5})(?:[_.]|$)/)
  if (m && m[1]) return m[1]
  // Fallback: any first sequence of 5 digits
  m = s.match(/(\d{5})/)
  return m ? m[1] : null
}

const samples = [
  'STC09_00260_A.TBL',
  'STC05_12345_A.TBL',
  'prefix_00260.TBL',
  'file00260.tbl',
  'STC0900260_A.TBL',
  'OTHER-STC09-00260.TBL',
  'XXX_00001.YYY',
  'no-digits.TBL'
]

for (const s of samples) {
  console.log(s, '->', getTestnrFromName(s))
}
