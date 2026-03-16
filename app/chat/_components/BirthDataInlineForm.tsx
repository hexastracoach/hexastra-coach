'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { BirthData } from '../_lib/chat'
import { EMPTY_BIRTH_DATA } from '../_lib/chat'

type CityResult = {
  displayName: string
  city: string
  country: string
  countryCode: string
  lat: string
  lng: string
}

type Props = {
  data: BirthData
  onSave: (data: BirthData) => void
}

async function searchCities(query: string): Promise<CityResult[]> {
  if (query.trim().length < 2) return []
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=8&addressdetails=1` +
    `&featuretype=city&accept-language=fr`
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'fr', 'User-Agent': 'HexAstra-Coach/1.0' },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data as any[])
      .filter((r: any) => r.address)
      .map((r: any): CityResult => {
        const addr = r.address
        const city =
          addr.city || addr.town || addr.village || addr.municipality || addr.county || query
        return {
          displayName: r.display_name,
          city,
          country: addr.country ?? '',
          countryCode: (addr.country_code ?? '').toUpperCase(),
          lat: parseFloat(r.lat).toFixed(4),
          lng: parseFloat(r.lon).toFixed(4),
        }
      })
      .filter((r, i, arr) =>
        arr.findIndex((x) => x.city === r.city && x.countryCode === r.countryCode) === i
      )
  } catch {
    return []
  }
}

export default function BirthDataInlineForm({ data, onSave }: Props) {
  const initialTimeKnown = data.birthTimeKnown ?? Boolean(data.birthTime)
  const [form, setForm] = useState<BirthData>({
    ...EMPTY_BIRTH_DATA,
    ...data,
    birthTimeKnown: initialTimeKnown,
  })
  const [timeKnown, setTimeKnown] = useState<boolean>(initialTimeKnown)
  const [showErrors, setShowErrors] = useState(false)

  // City autocomplete state
  const [cityQuery, setCityQuery] = useState(data.birthCity ?? '')
  const [suggestions, setSuggestions] = useState<CityResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [citySelected, setCitySelected] = useState(!!data.birthCity)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const triggerSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchCities(q)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
      setIsSearching(false)
    }, 320)
  }, [])

  function handleCityInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setCityQuery(q)
    setCitySelected(false)
    setForm((prev) => ({
      ...prev,
      birthCity: q,
      birthLat: '',
      birthLng: '',
      birthCountryCode: '',
      birthCountryName: '',
    }))
    triggerSearch(q)
  }

  function handleSelectCity(r: CityResult) {
    setCityQuery(r.city)
    setCitySelected(true)
    setShowDropdown(false)
    setSuggestions([])
    setForm((prev) => ({
      ...prev,
      birthCity: r.city,
      birthCountryName: r.country,
      birthCountryCode: r.countryCode,
      birthLat: r.lat,
      birthLng: r.lng,
    }))
  }

  function handleTimeKnown(checked: boolean) {
    setTimeKnown(checked)
    setForm((prev) => ({ ...prev, birthTimeKnown: checked }))
    if (!checked) setForm((prev) => ({ ...prev, birthTime: '' }))
  }

  function set(field: keyof BirthData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) {
      setShowErrors(true)
      return
    }

    const birthTimeValue = timeKnown ? form.birthTime.trim() : ''

    const trimmed: BirthData = {
      ...form,
      firstName: form.firstName.trim(),
      birthDate: form.birthDate.trim(),
      birthCity: form.birthCity.trim(),
      birthTime: birthTimeValue,
      birthTimeKnown: timeKnown,
    }
    onSave(trimmed)
  }

  const isValid =
    form.firstName.trim().length > 0 &&
    form.birthDate.trim().length > 0 &&
    form.birthCountryName.trim().length > 0 &&
    form.birthCity.trim().length > 0 &&
    (timeKnown ? form.birthTime.trim().length > 0 : true)

  const fieldError = (condition: boolean, message: string) => (showErrors && !condition ? message : '')

  return (
    <form
      className="hx-birth-inline-form"
      onSubmit={handleSubmit}
      aria-label="Données de naissance"
    >
      <div className="hx-birth-inline-grid">

        {/* Prénom */}
        <label className="hx-birth-inline-field">
          <span className="hx-birth-inline-label">Prénom <span aria-hidden="true">*</span></span>
          <input
            className="hx-birth-inline-input"
            type="text"
            placeholder="Prénom"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            required
            autoComplete="given-name"
            aria-invalid={showErrors && !form.firstName.trim()}
          />
          {fieldError(!!form.firstName.trim(), 'Prénom requis.') && (
            <p className="hx-birth-time-unknown-note">{fieldError(!!form.firstName.trim(), 'Prénom requis.')}</p>
          )}
        </label>

        {/* Genre */}
        <label className="hx-birth-inline-field">
          <span className="hx-birth-inline-label">Genre (optionnel)</span>
          <select
            className="hx-birth-inline-input"
            value={form.gender ?? ''}
            onChange={(e) => set('gender', e.target.value)}
          >
            <option value="">Préciser si utile</option>
            <option value="feminin">Féminin</option>
            <option value="masculin">Masculin</option>
            <option value="autre">Autre / préfère ne pas dire</option>
          </select>
        </label>

        {/* Date */}
        <label className="hx-birth-inline-field">
          <span className="hx-birth-inline-label">Date de naissance <span aria-hidden="true">*</span></span>
          <input
            className="hx-birth-inline-input"
            type="date"
            value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
            required
            aria-invalid={showErrors && !form.birthDate.trim()}
          />
          {fieldError(!!form.birthDate.trim(), 'Date requise.') && (
            <p className="hx-birth-time-unknown-note">{fieldError(!!form.birthDate.trim(), 'Date requise.')}</p>
          )}
        </label>

        {/* Heure */}
        <div className="hx-birth-inline-field">
          <span className="hx-birth-inline-label">
            Heure de naissance {timeKnown && <span aria-hidden="true">*</span>}
          </span>
          {timeKnown ? (
            <input
              className="hx-birth-inline-input"
              type="time"
              placeholder="HH:MM"
              value={form.birthTime}
              onChange={(e) => set('birthTime', e.target.value)}
              required={timeKnown}
              aria-invalid={showErrors && timeKnown && !form.birthTime.trim()}
            />
          ) : (
            <input
              className="hx-birth-inline-input"
              type="text"
              value="Heure non renseignée — 12:00 sera utilisée par défaut."
              readOnly
              tabIndex={-1}
            />
          )}
          <label className="hx-birth-inline-unknown">
            <input
              type="checkbox"
              checked={timeKnown}
              onChange={(e) => handleTimeKnown(e.target.checked)}
            />
            <span>Je connais mon heure de naissance</span>
          </label>
          {!timeKnown && (
            <p className="hx-birth-time-unknown-note">
              Une heure exacte améliore la précision du scan.
            </p>
          )}
          {fieldError(!timeKnown || !!form.birthTime.trim(), 'Heure requise ou désactive la case.') && (
            <p className="hx-birth-time-unknown-note">
              {fieldError(!timeKnown || !!form.birthTime.trim(), 'Heure requise ou désactive la case.')}
            </p>
          )}
        </div>

        {/* Pays — occupe toute la largeur, auto-rempli par la ville */}
        <div className="hx-birth-inline-field hx-birth-inline-field--full">
          <span className="hx-birth-inline-label">
            Pays de naissance <span aria-hidden="true">*</span>
          </span>
          <input
            className={`hx-birth-inline-input${form.birthCountryName ? ' hx-birth-city-confirmed' : ''}`}
            type="text"
            placeholder="Sera rempli automatiquement lors du choix de la ville…"
            value={form.birthCountryName}
            onChange={(e) => set('birthCountryName', e.target.value)}
            autoComplete="country-name"
            required
            aria-invalid={showErrors && !form.birthCountryName.trim()}
          />
          {fieldError(!!form.birthCountryName.trim(), 'Pays requis.') && (
            <p className="hx-birth-time-unknown-note">{fieldError(!!form.birthCountryName.trim(), 'Pays requis.')}</p>
          )}
        </div>

        {/* Ville avec autocomplete — occupe toute la largeur */}
        <div className="hx-birth-inline-field hx-birth-city-wrapper" ref={wrapperRef}>
          <span className="hx-birth-inline-label">
            Ville de naissance <span aria-hidden="true">*</span>
          </span>
          <div className="hx-birth-city-input-row">
            <input
              className={`hx-birth-inline-input${citySelected && form.birthLat ? ' hx-birth-city-confirmed' : ''}`}
              type="text"
              placeholder="Rechercher une ville dans le monde…"
              value={cityQuery}
              onChange={handleCityInput}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              autoComplete="off"
              spellCheck={false}
              required
              aria-invalid={showErrors && !form.birthCity.trim()}
            />
            {isSearching && <span className="hx-birth-city-spinner" aria-hidden="true" />}
          </div>

          {showDropdown && (
            <ul className="hx-birth-city-dropdown" role="listbox" aria-label="Suggestions de villes">
              {suggestions.map((r, i) => (
                <li
                  key={i}
                  role="option"
                  className="hx-birth-city-option"
                  onMouseDown={(e) => { e.preventDefault(); handleSelectCity(r) }}
                >
                  <span className="hx-birth-city-name">{r.city}</span>
                  <span className="hx-birth-city-meta">
                    {r.country}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {fieldError(!!form.birthCity.trim(), 'Ville requise.') && (
            <p className="hx-birth-time-unknown-note">{fieldError(!!form.birthCity.trim(), 'Ville requise.')}</p>
          )}
        </div>

      </div>

      <button
        type="submit"
        className="hx-birth-inline-submit"
        disabled={!isValid}
      >
        Commencer ma lecture →
      </button>

      <p className="hx-birth-time-unknown-note" style={{ marginTop: 10 }}>
        HexAstra utilise vos données de naissance pour générer une analyse personnalisée. Une heure de naissance précise améliore la qualité du résultat.
      </p>
    </form>
  )
}
