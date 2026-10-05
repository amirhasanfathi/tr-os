// Providers service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo providers.
//   * http           — GET /api/v1/providers, GET /api/v1/providers?category=.
//
// The trust score is computed server-side from real signals (verification +
// reviews) — never here and never hardcoded. The price *band* glyph ('₺'/'₺₺'/
// '₺₺₺') is a presentation rule, so it is derived in this mapper from the real
// numeric priceMin/priceMax rather than stored or fabricated. Shapes mirror
// @tr-life/shared.

import { useHttp } from '../config/runtime'
import { demoProviders } from '../data/mockData'
import { http } from './httpClient'
import { priceBand } from './providerTrust'
import type { Provider, ProviderCategory } from '../types'

export interface ProviderResponseDTO {
  id: string
  name: string
  category: ProviderCategory
  specialty: string
  location: string
  languages: string[]
  priceMin: number | null
  priceMax: number | null
  currency: string
  trustScore: number
  verified: boolean
  reviewCount: number
  averageRating: number | null
}

export function toProvider(p: ProviderResponseDTO): Provider {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    specialty: p.specialty,
    languages: p.languages,
    location: p.location,
    trustScore: p.trustScore,
    verified: p.verified,
    priceRange: priceBand(p.priceMin, p.priceMax, p.currency),
    sample: true,
  }
}

export async function getProviders(): Promise<Provider[]> {
  if (useHttp) {
    const res = await http.get<ProviderResponseDTO[]>('/providers')
    return res.map(toProvider)
  }
  return demoProviders
}

export async function getProvidersByCategory(category: ProviderCategory): Promise<Provider[]> {
  if (useHttp) {
    const res = await http.get<ProviderResponseDTO[]>(`/providers?category=${encodeURIComponent(category)}`)
    return res.map(toProvider)
  }
  return demoProviders.filter((p) => p.category === category)
}
