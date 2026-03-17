'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { BirthData } from '../_lib/chat'
import { EMPTY_BIRTH_DATA } from '../_lib/chat'
import type { NormalizedPlace } from '@/lib/location/normalizeOpenCageResult'

type Props = {
  data: BirthData
  partnerData: BirthData
  onSave: (data: BirthData, partner: BirthData) => void
}

async function searchCities(query: string): Promise<NormalizedPlace[]> {
  if (query.trim().length < 3) return []
  try {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json() as { results: NormalizedPlace[] }
    return data.results ?? []
  } catch {
    return []
  }
}

export default function BirthDataInlineForm({ data, partnerData, onSave }: Props) {
  const initialTimeKnown = data.birthTimeKnown ?? Boolean(data.birthTime)
  const partnerInitialTimeKnown = partnerData.birthTimeKnown ?? Boolean(partnerData.birthTime)
  const [form, setForm] = useState<BirthData>({
    ...EMPTY_BIRTH_DATA,
    ...data,
    birthTimeKnown: initialTimeKnown,
  })
  const [partnerForm, setPartnerForm] = useState<BirthData>({
    ...EMPTY_BIRTH_DATA,
    ...partnerData,
    birthTimeKnown: partnerInitialTimeKnown,
  })
  const [timeKnown, setTimeKnown] = useState<boolean>(initialTimeKnown)
  const [partnerTimeKnown, setPartnerTimeKnown] = useState<boolean>(partnerInitialTimeKnown)
  const [showErrors, setShowErrors] = useState(false)
  const [dualMode, setDualMode] = useState(
    Boolean(partnerData.firstName || partnerData.birthCity || partnerData.birthDate)
  )

  // City autocomplete state
  const [cityQuery, setCityQuery] = useState(data.birthCity ?? '')
  const [suggestions, setSuggestions] = useState<NormalizedPlace[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [citySelected, setCitySelected] = useState(!!data.birthCity)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [partnerCityQuery, setPartnerCityQuery] = useState(partnerData.birthCity ?? '')
  const [partnerSuggestions, setPartnerSuggestions] = useState<NormalizedPlace[]>([])
  const [partnerShowDropdown, setPartnerShowDropdown] = useState(false)
  const [partnerIsSearching, setPartnerIsSearching] = useState(false)
  const [partnerCitySelected, setPartnerCitySelected] = useState(false)
  const partnerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const partnerWrapperRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const freshKnown = data.birthTimeKnown ?? Boolean(data.birthTime)
    setForm({ ...EMPTY_BIRTH_DATA, ...data, birthTimeKnown: freshKnown })
    setTimeKnown(freshKnown)
    setCityQuery(data.birthCity ?? '')
    setCitySelected(!!data.birthCity)
  }, [data])

  useEffect(() => {
    const freshKnown = partnerData.birthTimeKnown ?? Boolean(partnerData.birthTime)
    setPartnerForm({ ...EMPTY_BIRTH_DATA, ...partnerData, birthTimeKnown: freshKnown })
    setPartnerTimeKnown(freshKnown)
    setPartnerCityQuery(partnerData.birthCity ?? '')
    setPartnerCitySelected(!!partnerData.birthCity)
    setDualMode(Boolean(partnerData.firstName || partnerData.birthCity || partnerData.birthDate))
  }, [partnerData])

  useEffect(() => {
    if (dualMode && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [dualMode])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (partnerWrapperRef.current && !partnerWrapperRef.current.contains(e.target as Node)) {
        setPartnerShowDropdown(false)
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

  const triggerPartnerSearch = useCallback((q: string) => {
    if (partnerDebounceRef.current) clearTimeout(partnerDebounceRef.current)
    if (q.trim().length < 2) {
      setPartnerSuggestions([])
      setPartnerShowDropdown(false)
      return
    }
    partnerDebounceRef.current = setTimeout(async () => {
      setPartnerIsSearching(true)
      const results = await searchCities(q)
      setPartnerSuggestions(results)
      setPartnerShowDropdown(results.length > 0)
      setPartnerIsSearching(false)
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

  function handleSelectCity(r: NormalizedPlace) {
    const cityLabel = r.label || r.city
    setCityQuery(cityLabel)
    setCitySelected(true)
    setShowDropdown(false)
    setSuggestions([])
    setForm((prev) => ({
      ...prev,
      birthCity: r.city,
      birthCountryName: r.country,
      birthLat: r.lat ? String(r.lat) : '',
      birthLng: r.lng ? String(r.lng) : '',
    }))
  }

  function handleTimeKnown(checked: boolean) {
    setTimeKnown(checked)
    setForm((prev) => ({ ...prev, birthTimeKnown: checked }))
    if (!checked) setForm((prev) => ({ ...prev, birthTime: '' }))
  }

  function handlePartnerCityInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setPartnerCityQuery(q)
    setPartnerCitySelected(false)
    setPartnerForm((prev) => ({
      ...prev,
      birthCity: q,
      birthLat: '',
      birthLng: '',
      birthCountryCode: '',
      birthCountryName: '',
    }))
    triggerPartnerSearch(q)
  }

  function handlePartnerSelectCity(r: NormalizedPlace) {
    const cityLabel = r.label || r.city
    setPartnerCityQuery(cityLabel)
    setPartnerCitySelected(true)
    setPartnerShowDropdown(false)
    setPartnerSuggestions([])
    setPartnerForm((prev) => ({
      ...prev,
      birthCity: r.city,
      birthCountryName: r.country,
      birthLat: r.lat ? String(r.lat) : '',
      birthLng: r.lng ? String(r.lng) : '',
    }))
  }

  function handlePartnerTimeKnown(checked: boolean) {
    setPartnerTimeKnown(checked)
    setPartnerForm((prev) => ({ ...prev, birthTimeKnown: checked }))
    if (!checked) setPartnerForm((prev) => ({ ...prev, birthTime: '' }))
  }

  function set(field: keyof BirthData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setPartner(field: keyof BirthData, value: string) {
    setPartnerForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !partnerIsValid) {
      setShowErrors(true)
      return
    }

    const birthTimeValue = timeKnown ? form.birthTime.trim() : ''
    const partnerBirthTimeValue = partnerTimeKnown ? partnerForm.birthTime.trim() : ''

    const trimmed: BirthData = {
      ...form,
      firstName: form.firstName.trim(),
      birthDate: form.birthDate.trim(),
      birthCity: form.birthCity.trim(),
      birthTime: birthTimeValue,
      birthTimeKnown: timeKnown,
    }

    const partnerTrimmed: BirthData = dualMode
      ? {
          ...partnerForm,
          firstName: partnerForm.firstName.trim(),
          birthDate: partnerForm.birthDate.trim(),
          birthCity: partnerForm.birthCity.trim(),
          birthTime: partnerBirthTimeValue,
          birthTimeKnown: partnerTimeKnown,
        }
      : EMPTY_BIRTH_DATA

    onSave(trimmed, partnerTrimmed)
  }

  const isValid =
    form.firstName.trim().length > 0 &&
    form.birthDate.trim().length > 0 &&
    form.birthCountryName.trim().length > 0 &&
    form.birthCity.trim().length > 0 &&
    (timeKnown ? form.birthTime.trim().length > 0 : true)

  const partnerIsValid =
    !dualMode ||
    (partnerForm.firstName.trim().length > 0 &&
      partnerForm.birthDate.trim().length > 0 &&
      partnerForm.birthCountryName.trim().length > 0 &&
      partnerForm.birthCity.trim().length > 0 &&
      (partnerTimeKnown ? partnerForm.birthTime.trim().length > 0 : true))

  const fieldError = (condition: boolean, message: string) => (showErrors && !condition ? message : '')

  return (
    <form
      ref={formRef}
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
                  <span className="hx-birth-city-name">{r.label || r.city}</span>
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

      <label className="hx-birth-inline-unknown" style={{ marginTop: -4 }}>
        <input
          type="checkbox"
          checked={dualMode}
          onChange={(e) => setDualMode(e.target.checked)}
        />
        <span>Lecture croisée : ajouter les données d'une autre personne (optionnel)</span>
      </label>

      {dualMode && (
        <div className="hx-birth-inline-grid" aria-label="Autre personne">
          <label className="hx-birth-inline-field">
            <span className="hx-birth-inline-label">Prénom (autre) <span aria-hidden="true">*</span></span>
            <input
              className="hx-birth-inline-input"
              type="text"
              placeholder="Prénom de l'autre personne"
              value={partnerForm.firstName}
              onChange={(e) => setPartner('firstName', e.target.value)}
              required={dualMode}
              aria-invalid={showErrors && dualMode && !partnerForm.firstName.trim()}
            />
            {fieldError(!dualMode || !!partnerForm.firstName.trim(), 'Prénom requis.') && (
              <p className="hx-birth-time-unknown-note">{fieldError(!dualMode || !!partnerForm.firstName.trim(), 'Prénom requis.')}</p>
            )}
          </label>

          <label className="hx-birth-inline-field">
            <span className="hx-birth-inline-label">Genre (optionnel)</span>
            <select
              className="hx-birth-inline-input"
              value={partnerForm.gender ?? ''}
              onChange={(e) => setPartner('gender', e.target.value)}
            >
              <option value="">Préciser si utile</option>
              <option value="feminin">Féminin</option>
              <option value="masculin">Masculin</option>
              <option value="autre">Autre / préfère ne pas dire</option>
            </select>
          </label>

          <label className="hx-birth-inline-field">
            <span className="hx-birth-inline-label">Date de naissance <span aria-hidden="true">*</span></span>
            <input
              className="hx-birth-inline-input"
              type="date"
              value={partnerForm.birthDate}
              onChange={(e) => setPartner('birthDate', e.target.value)}
              required={dualMode}
              aria-invalid={showErrors && dualMode && !partnerForm.birthDate.trim()}
            />
            {fieldError(!dualMode || !!partnerForm.birthDate.trim(), 'Date requise.') && (
              <p className="hx-birth-time-unknown-note">{fieldError(!dualMode || !!partnerForm.birthDate.trim(), 'Date requise.')}</p>
            )}
          </label>

          <div className="hx-birth-inline-field">
            <span className="hx-birth-inline-label">
              Heure de naissance {partnerTimeKnown && <span aria-hidden="true">*</span>}
            </span>
            {partnerTimeKnown ? (
              <input
                className="hx-birth-inline-input"
                type="time"
                placeholder="HH:MM"
                value={partnerForm.birthTime}
                onChange={(e) => setPartner('birthTime', e.target.value)}
                required={partnerTimeKnown}
                aria-invalid={showErrors && partnerTimeKnown && !partnerForm.birthTime.trim()}
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
                checked={partnerTimeKnown}
                onChange={(e) => handlePartnerTimeKnown(e.target.checked)}
              />
              <span>Je connais son heure de naissance</span>
            </label>
            {!partnerTimeKnown && (
              <p className="hx-birth-time-unknown-note">
                Une heure exacte améliore la précision de la lecture croisée.
              </p>
            )}
            {fieldError(!partnerTimeKnown || !!partnerForm.birthTime.trim(), 'Heure requise ou désactive la case.') && (
              <p className="hx-birth-time-unknown-note">
                {fieldError(!partnerTimeKnown || !!partnerForm.birthTime.trim(), 'Heure requise ou désactive la case.')}
              </p>
            )}
          </div>

          <div className="hx-birth-inline-field hx-birth-inline-field--full">
            <span className="hx-birth-inline-label">
              Pays de naissance <span aria-hidden="true">*</span>
            </span>
            <input
              className={`hx-birth-inline-input${partnerForm.birthCountryName ? ' hx-birth-city-confirmed' : ''}`}
              type="text"
              placeholder="Sera rempli automatiquement lors du choix de la ville…"
              value={partnerForm.birthCountryName}
              onChange={(e) => setPartner('birthCountryName', e.target.value)}
              autoComplete="country-name"
              required={dualMode}
              aria-invalid={showErrors && dualMode && !partnerForm.birthCountryName.trim()}
            />
            {fieldError(!dualMode || !!partnerForm.birthCountryName.trim(), 'Pays requis.') && (
              <p className="hx-birth-time-unknown-note">{fieldError(!dualMode || !!partnerForm.birthCountryName.trim(), 'Pays requis.')}</p>
            )}
          </div>

          <div className="hx-birth-inline-field hx-birth-city-wrapper" ref={partnerWrapperRef}>
            <span className="hx-birth-inline-label">
              Ville de naissance <span aria-hidden="true">*</span>
            </span>
            <div className="hx-birth-city-input-row">
              <input
                className={`hx-birth-inline-input${partnerCitySelected && partnerForm.birthLat ? ' hx-birth-city-confirmed' : ''}`}
                type="text"
                placeholder="Rechercher une ville dans le monde…"
                value={partnerCityQuery}
                onChange={handlePartnerCityInput}
                onFocus={() => partnerSuggestions.length > 0 && setPartnerShowDropdown(true)}
                autoComplete="off"
                spellCheck={false}
                required={dualMode}
                aria-invalid={showErrors && dualMode && !partnerForm.birthCity.trim()}
              />
              {partnerIsSearching && <span className="hx-birth-city-spinner" aria-hidden="true" />}
            </div>

            {partnerShowDropdown && (
              <ul className="hx-birth-city-dropdown" role="listbox" aria-label="Suggestions de villes (autre personne)">
                {partnerSuggestions.map((r, i) => (
                  <li
                    key={i}
                    role="option"
                    className="hx-birth-city-option"
                    onMouseDown={(e) => { e.preventDefault(); handlePartnerSelectCity(r) }}
                  >
                    <span className="hx-birth-city-name">{r.label || r.city}</span>
                    <span className="hx-birth-city-meta">
                      {r.country}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {fieldError(!dualMode || !!partnerForm.birthCity.trim(), 'Ville requise.') && (
              <p className="hx-birth-time-unknown-note">{fieldError(!dualMode || !!partnerForm.birthCity.trim(), 'Ville requise.')}</p>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="hx-birth-inline-submit"
        disabled={!isValid || !partnerIsValid}
      >
        Commencer ma lecture →
      </button>

      <p className="hx-birth-time-unknown-note" style={{ marginTop: 10 }}>
        HexAstra utilise vos données de naissance pour générer une analyse personnalisée. Une heure de naissance précise améliore la qualité du résultat.
      </p>
    </form>
  )
}
