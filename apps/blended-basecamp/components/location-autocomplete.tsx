"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";

export type Place = { id: number; label: string; latitude: number; longitude: number; type: string; distanceMiles?: number };

export function LocationAutocomplete({ className, label, near, onChange, onSelect, placeholder, value }: { className?: string; label: string; near?: { label: string; latitude?: number; longitude?: number }; onChange: (value: string) => void; onSelect?: (place: Place) => void; placeholder: string; value: string }) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) { setResults([]); setOpen(false); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (near?.label) params.set("near", near.label);
        if (near?.latitude !== undefined && near.longitude !== undefined) { params.set("lat", String(near.latitude)); params.set("lon", String(near.longitude)); }
        const response = await fetch(`/api/location-search?${params}`, { signal: controller.signal });
        const data = (await response.json()) as { results?: Place[] };
        setResults(response.ok ? (data.results ?? []) : []);
        setOpen(response.ok && Boolean(data.results?.length));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [near?.label, near?.latitude, near?.longitude, value]);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return <div className="relative" ref={box}>
    <input aria-autocomplete="list" aria-controls={listId} aria-expanded={open} aria-label={label} autoComplete="off" className={className} onChange={(event) => onChange(event.target.value)} onFocus={() => setOpen(results.length > 0)} placeholder={placeholder} role="combobox" value={value} />
    {loading ? <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#527568]" /> : null}
    {open ? <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-black/10 bg-[#fffdf8] p-1 text-left normal-case tracking-normal shadow-2xl" id={listId} role="listbox">
      {results.map((place) => <li key={place.id} role="option"><button className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium leading-5 text-[#1d352f] hover:bg-[#e8efe8]" onClick={() => { onChange(place.label); onSelect?.(place); setOpen(false); }} type="button"><MapPin className="mt-0.5 size-4 shrink-0 text-[#a76536]" /><span>{place.label}{place.distanceMiles !== undefined ? <small className="mt-0.5 block text-[#6c786f]">{Math.round(place.distanceMiles)} miles away</small> : null}</span></button></li>)}
    </ul> : null}
  </div>;
}
