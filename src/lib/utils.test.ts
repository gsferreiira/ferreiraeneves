import { describe, it, expect } from 'vitest'
import { formatCurrency, slugify, getYouTubeEmbedUrl, generateCodigo } from './utils'

describe('formatCurrency', () => {
  it('formats integer BRL without decimals', () => {
    expect(formatCurrency(1500)).toMatch(/R\$\s*1\.500/)
  })
  it('handles zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0/)
  })
})

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Olá Mundo')).toBe('ola-mundo')
  })
  it('strips multiple specials', () => {
    expect(slugify('Casa & Apto -- 3 Quartos')).toBe('casa-apto-3-quartos')
  })
})

describe('getYouTubeEmbedUrl', () => {
  it('handles watch?v= URL', () => {
    expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })
  it('handles youtu.be short URL', () => {
    expect(getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })
  it('handles shorts URL', () => {
    expect(getYouTubeEmbedUrl('https://youtube.com/shorts/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })
  it('returns null for invalid input', () => {
    expect(getYouTubeEmbedUrl('https://example.com')).toBeNull()
    expect(getYouTubeEmbedUrl('')).toBeNull()
  })
})

describe('generateCodigo', () => {
  it('starts with FN- prefix', () => {
    expect(generateCodigo()).toMatch(/^FN-/)
  })
  it('produces different codes on consecutive calls', () => {
    const a = generateCodigo()
    const b = generateCodigo()
    expect(typeof a).toBe('string')
    expect(b.length).toBeGreaterThan(3)
  })
})
