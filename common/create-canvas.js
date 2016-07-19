export default function createCanvas (container, border = 0) {
  if (!container) {
    throw new Error('Ya gotta pass in a container to `createCanvas`')
  }

  container.style.height = `calc(100vh - ${border * 2}px)`
  container.style.width = `calc(100vw - ${border * 2}px)`
  container.style.margin = `${border}px auto`
  container.style.overflow = 'hidden'

  const { height, width } = container.getBoundingClientRect()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.position = 'absolute'

  container.appendChild(canvas)

  return canvas
}
