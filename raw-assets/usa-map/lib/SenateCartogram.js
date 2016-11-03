'use strict'

const dims = require('./dims')
const fs = require('fs')

const AsciiMap = [
  '                                 ME',
  '                           VT NH MA',
  '   WA MT ND SD MN WI MI    NY CT RI',
  '   OR ID WY NE IA IL IN OH PA NJ   ',
  'CA NV UT CO KS MO KY WV MD DE      ',
  '      AZ NM OK AR TN VA NC         ',
  '         TX LA MS AL GA SC         ',
  'AK HI                FL            '
]

const StateCodeToAbbreviation = fs.readFileSync(`${__dirname}/../../../app/google-sheets/regions.tsv`, 'utf8')
  .split(/\r?\n/)
  .slice(1)
  .map(s => s.split(/\t/))
  .filter(s => s.length === 4) // nix last row
  .reduce(((s, row) => { s[row[0]] = row[2]; return s }), {})

const Seats = fs.readFileSync(`${__dirname}/../../../app/google-sheets/senateSeats.tsv`, 'utf8')
  .split(/\r?\n/)
  .slice(1)                      // ignore header
  .map(s => s.split(/\t/))       // convert to arrays
  .filter(arr => arr.length > 5) // ignore trailing line
  .map(arr => {
    return {
      stateId: arr[0],
      id: `${arr[0]}S${arr[1]}`
    }
  })

function findSeats(stateId) {
  const ret = Seats
    .filter(seat => seat.stateId === stateId)
    .sort((a, b) => a.id.localeCompare(b.id)) // class 1 seats before class 2, 3
  if (ret.length !== 2) throw new Error(`Found ${ret.length} Senate seats for "${stateId}"; expected 2`)
  return ret
}

const NStatesWide = Math.ceil(AsciiMap[0].length / 3)
const NStatesTall = AsciiMap.length

const StateSize = Math.min(Math.floor(dims.Height / NStatesTall), Math.floor(dims.Width / NStatesWide))
const X0 = Math.round(0.5 * (dims.Width - NStatesWide * StateSize))
const Y0 = Math.round(0.5 * (dims.Height - NStatesTall * StateSize))

// stylistic parameter. 0 and StateSize make triangles; between them makes trapezoids
const Slant = Math.floor(StateSize * 0)
const OffSlant = StateSize - Slant

const Features = []
const Labels = []
for (let i = 0; i < NStatesWide; i++) {
  const x = X0 + i * StateSize;
  for (let j = 0; j < NStatesTall; j++) {
    const y = Y0 + j * StateSize;

    const stateId = AsciiMap[j].slice(i * 3, i * 3 + 2)
    if (stateId == '  ') continue

    const seats = findSeats(stateId)

    // Push first seat:
    // +------+-+
    // |*****/  |
    // |****/   |
    // |***/    |
    // |**/     |
    // +-+------+
    Features.push({
      id: seats[0].id,
      d: `M${x},${y}h${Slant}l${OffSlant - Slant},${StateSize}h${-OffSlant}Z`
    })

    // Push second seat:
    // +------+-+
    // |     /**|
    // |    /***|
    // |   /****|
    // |  /*****|
    // +-+------+
    Features.push({
      id: seats[1].id,
      d: `M${x + Slant},${y}h${OffSlant}v${StateSize}h${-Slant}Z`
    })

    // Push label
    Labels.push({
      x: Math.round(x + StateSize / 2),
      y: Math.round(y + StateSize / 2),
      text: StateCodeToAbbreviation[seats[0].stateId]
    })
  }
}

const Mesh = []
for (let x = X0; x < dims.Width; x += StateSize) {
  Mesh.push(`M${x},0v${dims.Height}`)
}
for (let y = Y0; y < dims.Height; y += StateSize) {
  Mesh.push(`M0,${y}h${dims.Width}`)
}

module.exports = {
  features: Features,
  labels: Labels,
  meshD: Mesh.join('')
}
