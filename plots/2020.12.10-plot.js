const random = require('canvas-sketch-util/random')
const vec2 = require('gl-vec2')

const MM_PER_INCH = 25.4
const PIXELS_PER_INCH = 200
const WIDTH = 5 * PIXELS_PER_INCH
const HEIGHT = 3.5 * PIXELS_PER_INCH
const PIXELS_PER_MM = PIXELS_PER_INCH / MM_PER_INCH
const PIXELS_PER_CM = PIXELS_PER_MM * 10

const settings = {
  seed: 88880,
  lines: 1000,
  minCanvasMargin: 0.3,
  radsOffset: 0.3,
  radsNoiseFreq: 0.04,
  circleNoiseFreq: 0.85,
  circleNoiseMag: 0.1,
  lineWidthMM: 0.1,
  gridCellSize: 300,
  gridCellSpacing: 0.5
}

const lines = []
const width = WIDTH
const height = HEIGHT

const rand = random.createRandom(settings.seed)
const circleSize = settings.gridCellSize

const cellPlusSpacing = (1 + settings.gridCellSpacing) * settings.gridCellSize

const columnCount = Math.floor((1 - settings.minCanvasMargin) * width / cellPlusSpacing)
const rowCount = Math.floor((1 - settings.minCanvasMargin) * height / cellPlusSpacing)

const xOffset = (width - (columnCount * settings.gridCellSize + (columnCount - 1) * settings.gridCellSize * settings.gridCellSpacing)) / 2
const yOffset = (height - (rowCount * settings.gridCellSize + (rowCount - 1) * settings.gridCellSize * settings.gridCellSpacing)) / 2

function perturbPt (pt, xPerc, yPerc) {
  const mag = rand.noise2D(pt[0], pt[1], settings.circleNoiseFreq, settings.circleNoiseMag)
  return [
    pt[0] * (1 + mag * xPerc),
    pt[1] * (1 + mag * yPerc)
  ]
}

function positionPt (pt, offset) {
  return vec2.add([], vec2.scale([], pt, circleSize / 2), offset)
}

for (let x = 0; x < columnCount; x++) {
  for (let y = 0; y < rowCount; y++) {
    const center = [
      x * cellPlusSpacing + xOffset + circleSize / 2,
      y * cellPlusSpacing + yOffset + circleSize / 2
    ]
    const xPerc = columnCount === 1 ? 1 : x / (columnCount - 1)
    const yPerc = rowCount === 1 ? 1 : y / (rowCount - 1)
    const line = [positionPt(perturbPt(rand.onCircle(), xPerc, yPerc), center)]
    lines.push(line)
    let n = settings.lines
    while (n--) {
      const lastPt = line[line.length - 1]
      const rads = ((rand.noise2D(lastPt[0], lastPt[1], settings.radsNoiseFreq) + 1) * (Math.PI + settings.radsOffset)) % (Math.PI * 2)
      const pt = [Math.cos(rads), Math.sin(rads)]
      line.push(positionPt(perturbPt(pt, xPerc, yPerc), center))
    }
  }
}

// stolen from penplot by mattdesl (couldn't require it because it uses import/export)
const TO_PX = 35.43307
const DEFAULT_SVG_LINE_WIDTH = 0.03

function polylinesToSVG (polylines, opt = {}) {
  const dimensions = opt.dimensions
  if (!dimensions) throw new TypeError('must specify dimensions currently')
  const decimalPlaces = 5

  const commands = []
  polylines.forEach(line => {
    line.forEach((point, j) => {
      const type = (j === 0) ? 'M' : 'L'
      const x = (TO_PX * point[0]).toFixed(decimalPlaces)
      const y = (TO_PX * point[1]).toFixed(decimalPlaces)
      commands.push(`${type} ${x} ${y}`)
    })
  })

  const svgPath = commands.join(' ')
  const viewWidth = (dimensions[0] * TO_PX).toFixed(decimalPlaces)
  const viewHeight = (dimensions[1] * TO_PX).toFixed(decimalPlaces)
  const fillStyle = opt.fillStyle || 'none'
  const strokeStyle = opt.strokeStyle || 'black'
  const lineWidth = opt.lineWidth || DEFAULT_SVG_LINE_WIDTH

  return `<?xml version="1.0" standalone="no"?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <svg width="${dimensions[0]}cm" height="${dimensions[1]}cm"
       xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${viewWidth} ${viewHeight}">
   <g>
     <path d="${svgPath}" fill="${fillStyle}" stroke="${strokeStyle}" stroke-width="${lineWidth}cm" />
   </g>
</svg>`
}

const svg = polylinesToSVG(lines.map(line => {
  return line.map(pt => pt.map(v => v / PIXELS_PER_CM))
}), {
  dimensions: [WIDTH / PIXELS_PER_CM, HEIGHT / PIXELS_PER_CM], // in cm
  lineWidth: settings.lineWidthMM / 10 // in cm
})

process.stdout.write(svg)
process.stdout.write('\n')
