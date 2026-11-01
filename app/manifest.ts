import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'sprint_ai',
    short_name: 'sprint_ai',
    description: 'dump → structure → practice → evidence',
    start_url: '/dump',
    display: 'standalone',
    background_color: '#0b0c10',
    theme_color: '#0b0c10',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
