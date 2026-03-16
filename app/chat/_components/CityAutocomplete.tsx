'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import type { NormalizedPlace } from '@/lib/location/normalizeOpenCageResult'

type Props = {
  value: string
  countryCode: string
  onSelect: (city: string, lat: string, lng: string) => void
}

export default function CityAutocomplete({ value, countryCode, onSelect }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NormalizedPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function handleInput(v: string) {
    setQuery(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (v.trim().length < 3) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const cc = countryCode ? `&country=${countryCode}` : ''
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(v)}${cc}`)
        const json = await res.json() as { results: NormalizedPlace[] }
        const filtered = json.results.slice(0, 8)
        setResults(filtered)
        setOpen(filtered.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 320)
  }

  function handleSelect(r: NormalizedPlace) {
    setQuery(r.label || r.city)
    setOpen(false)
    onSelect(r.city, String(r.lat ?? ''), String(r.lng ?? ''))
  }

  return (
    <div className="hx-city-wrap" ref={wrapRef}>
      <div className="hx-city-input-row">
        <input
          type="text"
          className="hx-modal-input"
          placeholder={countryCode ? t('chat.citySearch') : t('chat.citySelectCountryFirst')}
          value={query}
          disabled={!countryCode}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          autoComplete="off"
        />
        {loading && <span className="hx-city-spinner" aria-hidden="true" />}
      </div>
      {open && results.length > 0 && (
        <ul className="hx-city-dropdown" role="listbox">
          {results.map((r) => (
            <li key={r.label} role="option" aria-selected={false}>
              <button type="button" className="hx-city-option" onMouseDown={() => handleSelect(r)}>
                <span className="hx-city-option-name">{r.label || r.city}</span>
                {r.region && <span className="hx-city-option-region">{r.region}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
