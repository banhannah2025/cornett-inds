"use client";
import { cloneElement, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Gauge,
  LoaderCircle,
  LocateFixed,
  MapPinned,
  Plus,
  Radio,
  Router,
  Satellite,
  Signal,
  Smartphone,
  Trash2,
  Wifi,
} from "lucide-react";
import { LocationAutocomplete, type Place } from "./location-autocomplete";
type Kind = "starlink" | "cellular" | "wifi";
type NativeSignal = { carrier?: string; networkType?: string; dbm?: number; rsrp?: number; rsrq?: number; sinr?: number; level?: number; bandChannel?: number; cellId?: number; pci?: number; tac?: number; roaming?: boolean; capturedAt?: number };
type Log = {
  id: number;
  kind: Kind;
  provider: string;
  network: string;
  location: string;
  latitude?: number;
  longitude?: number;
  download: string;
  upload: string;
  ping: string;
  signal: string;
  obstructions: string;
  reliability: number;
  notes: string;
  created: string;
};
const kinds = {
  starlink: { label: "Starlink", icon: Satellite, color: "#527568" },
  cellular: { label: "Cellular", icon: Radio, color: "#b66e38" },
  wifi: { label: "Wi-Fi", icon: Wifi, color: "#806b9a" },
} as const;
const empty = {
  kind: "starlink" as Kind,
  provider: "Starlink",
  network: "",
  location: "",
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  download: "",
  upload: "",
  ping: "",
  signal: "",
  obstructions: "",
  reliability: 4,
  notes: "",
};
export function ConnectivityLog() {
  const [logs, setLogs] = useState<Log[]>([]),
    [form, setForm] = useState(empty),
    [loaded, setLoaded] = useState(false),
    [locating, setLocating] = useState(false),
    [locationMessage, setLocationMessage] = useState(""),
    [testing, setTesting] = useState(false),
    [nativeSignal, setNativeSignal] = useState<NativeSignal | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp-connectivity");
      if (raw) setLogs(JSON.parse(raw));
    } catch {
      localStorage.removeItem("blended-basecamp-connectivity");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "blended-basecamp-connectivity",
        JSON.stringify(logs),
      );
  }, [logs, loaded]);
  useEffect(() => {
    const encoded = new URLSearchParams(window.location.hash.slice(1)).get("basecamp-signal");
    if (!encoded) return;
    try {
      const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
      const reading = JSON.parse(new TextDecoder().decode(bytes)) as NativeSignal;
      setNativeSignal(reading);
      setForm((value) => ({ ...value, kind: "cellular", provider: reading.carrier || value.provider, network: reading.networkType || value.network, signal: reading.dbm !== undefined ? `${reading.dbm} dBm${reading.level !== undefined ? ` · level ${reading.level}/4` : ""}` : value.signal, notes: `Android radio reading imported${reading.rsrp !== undefined ? ` · RSRP ${reading.rsrp} dBm` : ""}${reading.rsrq !== undefined ? ` · RSRQ ${reading.rsrq} dB` : ""}${reading.sinr !== undefined ? ` · SINR ${reading.sinr} dB` : ""}. Run the connection test to add current speeds.` }));
      setLocationMessage("Android radio reading imported. Run the connection test to add speed and location.");
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    } catch { setLocationMessage("The Android radio reading could not be imported. Try measuring again."); }
  }, []);
  const averages = useMemo(() => {
    const nums = (k: "download" | "upload" | "ping") =>
      logs.map((l) => Number(l[k])).filter(Number.isFinite);
    const avg = (v: number[]) =>
      v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
    return {
      down: avg(nums("download")),
      up: avg(nums("upload")),
      ping: avg(nums("ping")),
    };
  }, [logs]);
  const set = <K extends keyof typeof empty>(
    key: K,
    value: (typeof empty)[K],
  ) => setForm((v) => ({ ...v, [key]: value }));
  const save = () => {
    if (!form.location.trim()) return;
    setLogs((v) => [
      { ...form, id: Date.now(), created: new Date().toLocaleString() },
      ...v,
    ]);
    setForm((v) => ({ ...empty, kind: v.kind, provider: v.provider }));
    setLocationMessage("");
  };
  const selectLocation = (place: Place) => {
    setForm((value) => ({ ...value, location: place.label, latitude: place.latitude, longitude: place.longitude }));
    setLocationMessage("Location selected.");
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Current location is not available in this browser.");
      return;
    }
    setLocating(true);
    setLocationMessage("Requesting your current location…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        let label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const response = await fetch(`/api/location-search?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);
          const data = (await response.json()) as { result?: Place };
          if (response.ok && data.result?.label) label = data.result.label;
        } catch {
          // Coordinates remain useful if a readable place cannot be resolved.
        }
        setForm((value) => ({ ...value, location: label, latitude, longitude }));
        setLocationMessage("Current location added.");
        setLocating(false);
      },
      (error) => {
        setLocationMessage(error.code === error.PERMISSION_DENIED ? "Location permission was denied. You can still search for a place." : "We could not determine your current location. Try again or search manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  const testConnection = async () => {
    setTesting(true);
    setLocationMessage("Testing connection and checking location…");
    try {
      const currentLocation = new Promise<{ label: string; latitude: number; longitude: number } | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
          const latitude = coords.latitude, longitude = coords.longitude;
          let label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          try {
            const response = await fetch(`/api/location-search?lat=${latitude}&lon=${longitude}`);
            const data = (await response.json()) as { result?: Place };
            if (response.ok && data.result?.label) label = data.result.label;
          } catch { /* Keep exact coordinates as the fallback. */ }
          resolve({ label, latitude, longitude });
        }, () => resolve(null), { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      });
      const profilePromise = fetch(`/api/connectivity-test?mode=profile&t=${Date.now()}`, { cache: "no-store" })
        .then(async (response) => response.ok ? await response.json() as { provider?: string | null; organization?: string | null } : null)
        .catch(() => null);

      await fetch(`/api/connectivity-test?mode=ping&warmup=${Date.now()}`, { cache: "no-store" });
      const pings: number[] = [];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const started = performance.now();
        await fetch(`/api/connectivity-test?mode=ping&t=${Date.now()}-${attempt}`, { cache: "no-store" });
        pings.push(performance.now() - started);
      }
      const downloadStarted = performance.now();
      const downloadResponses = await Promise.all(Array.from({ length: 3 }, (_, stream) => fetch(`/api/connectivity-test?mode=download&t=${Date.now()}-${stream}`, { cache: "no-store" })));
      if (downloadResponses.some((response) => !response.ok)) throw new Error("Download test failed");
      const downloadBuffers = await Promise.all(downloadResponses.map((response) => response.arrayBuffer()));
      const downloadBytes = downloadBuffers.reduce((total, buffer) => total + buffer.byteLength, 0);
      const downloadSeconds = Math.max((performance.now() - downloadStarted) / 1000, 0.001);

      const uploadStarted = performance.now();
      const uploadResponses = await Promise.all(Array.from({ length: 3 }, () => fetch("/api/connectivity-test", { method: "POST", body: new ArrayBuffer(1024 * 1024), cache: "no-store" })));
      if (uploadResponses.some((response) => !response.ok)) throw new Error("Upload test failed");
      const uploadSeconds = Math.max((performance.now() - uploadStarted) / 1000, 0.001);

      const download = (downloadBytes * 8) / downloadSeconds / 1_000_000;
      const upload = (3 * 1024 * 1024 * 8) / uploadSeconds / 1_000_000;
      const ping = [...pings].sort((a, b) => a - b)[Math.floor(pings.length / 2)] ?? 0;
      const [location, profile] = await Promise.all([currentLocation, profilePromise]);
      const reliability = Math.min(5, 2 + Number(download >= 25) + Number(upload >= 5) + Number(ping <= 100));
      setForm((value) => {
        const detectedKind = profile?.provider && /starlink|spacex/i.test(profile.provider) ? "starlink" : profile?.provider && /verizon|t-mobile|at&t|wireless|cellular|mobile/i.test(profile.provider) ? "cellular" : value.kind;
        return ({
        ...value,
        kind: detectedKind,
        provider: nativeSignal?.carrier || profile?.provider || profile?.organization || value.provider.trim() || "Provider not identified",
        network: nativeSignal?.networkType || (detectedKind === "cellular" ? "Cellular data · use Android companion for 5G/LTE" : detectedKind === "starlink" ? "Satellite internet" : "Internet connection"),
        location: location?.label || value.location || "Location permission not shared",
        latitude: location?.latitude,
        longitude: location?.longitude,
        download: download.toFixed(1),
        upload: upload.toFixed(1),
        ping: Math.round(ping).toString(),
        signal: nativeSignal?.dbm !== undefined ? `${nativeSignal.dbm} dBm${nativeSignal.level !== undefined ? ` · level ${nativeSignal.level}/4` : ""}` : detectedKind === "cellular" ? "Use Android companion for bars and dBm" : "Signal level unavailable to web browser",
        obstructions: "No transfer failures detected during this test",
        reliability,
        notes: `Multi-stream connection test: ${download.toFixed(1)} Mbps down, ${upload.toFixed(1)} Mbps up, ${Math.round(ping)} ms median ping.${nativeSignal ? ` Android radio: ${nativeSignal.networkType || "cellular"}${nativeSignal.rsrp !== undefined ? `, RSRP ${nativeSignal.rsrp} dBm` : ""}${nativeSignal.rsrq !== undefined ? `, RSRQ ${nativeSignal.rsrq} dB` : ""}${nativeSignal.sinr !== undefined ? `, SINR ${nativeSignal.sinr} dB` : ""}.` : " Install the Android companion for cellular generation and radio strength."}`,
      }); });
      setLocationMessage(location ? "Connection tested and current location added." : "Connection tested. Location was not shared; you can select it manually.");
    } catch {
      setLocationMessage("The connection test could not finish. Check your connection and try again.");
    } finally {
      setTesting(false);
    }
  };
  return (
    <section id="connectivity-log" className="mb-10">
      <div className="mb-5">
        <p className="eyebrow">Starlink & cellular</p>
        <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
          Build a connectivity map you can trust.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68746f]">
          Record real-world connection quality at every campsite, lodging stop,
          and remote workspace.
        </p>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">New connection test</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                Log this signal.
              </h3>
            </div>
            <Signal className="text-[#527568]" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {Object.entries(kinds).map(([key, v]) => {
              const Icon = v.icon;
              return (
                <button
                  key={key}
                  onClick={() => set("kind", key as Kind)}
                  className={`rounded-xl border p-3 text-center text-xs font-bold ${form.kind === key ? "border-[#527568] bg-[#e8efe8]" : "border-black/10 bg-white"}`}
                >
                  <Icon className="mx-auto mb-1" size={18} />
                  {v.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Provider">
              <input
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="Starlink, Verizon, T-Mobile..."
              />
            </Field>
            <Field label="Network / plan">
              <input
                value={form.network}
                onChange={(e) => set("network", e.target.value)}
                placeholder="5G, LTE, Roam..."
              />
            </Field>
            <div className="mt-3">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">Location</span>
              <LocationAutocomplete className={control} label="Signal test location" onChange={(location) => setForm((value) => ({ ...value, location, latitude: undefined, longitude: undefined }))} onSelect={selectLocation} placeholder="Campground, hotel, city..." value={form.location} />
              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#527568]/25 bg-[#e8efe8] px-3 py-2.5 text-xs font-bold text-[#244a40] disabled:opacity-60" disabled={locating} onClick={useCurrentLocation} type="button">
                {locating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                {locating ? "Locating…" : "Use current location"}
              </button>
              {locationMessage ? <p className="mt-2 text-xs font-medium normal-case tracking-normal text-[#68746f]" role="status">{locationMessage}</p> : null}
            </div>
            <Field label="Signal strength">
              <input
                value={form.signal}
                onChange={(e) => set("signal", e.target.value)}
                placeholder="Bars, dBm, or quality"
              />
            </Field>
            <Field label="Download Mbps">
              <input
                inputMode="decimal"
                value={form.download}
                onChange={(e) => set("download", e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Upload Mbps">
              <input
                inputMode="decimal"
                value={form.upload}
                onChange={(e) => set("upload", e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Ping ms">
              <input
                inputMode="numeric"
                value={form.ping}
                onChange={(e) => set("ping", e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field label="Obstructions / interruptions">
              <input
                value={form.obstructions}
                onChange={(e) => set("obstructions", e.target.value)}
                placeholder="Trees, drops, congestion..."
              />
            </Field>
          </div>
          <label className="mt-4 block text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">
            Remote-work reliability: {form.reliability}/5
            <input
              aria-label="Remote work reliability"
              type="range"
              min="1"
              max="5"
              value={form.reliability}
              onChange={(e) => set("reliability", Number(e.target.value))}
              className="mt-2 block w-full accent-[#527568]"
            />
          </label>
          <Field label="Work and call notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Video-call quality, outages, best dish placement, usable hours..."
            />
          </Field>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#244a40]/25 bg-[#e8efe8] px-4 py-3 text-sm font-bold text-[#244a40] disabled:opacity-60"
            disabled={testing}
            onClick={testConnection}
            type="button"
          >
            {testing ? <LoaderCircle className="size-[18px] animate-spin" /> : <Gauge size={18} />}
            {testing ? "Testing connection…" : "Test connection & fill fields"}
          </button>
          <div className="mt-3 rounded-xl border border-[#527568]/20 bg-[#f2f5ef] p-3 text-xs text-[#425b53]">
            <div className="flex items-center gap-2 font-bold text-[#244a40]"><Smartphone size={16} /> Android precise radio data</div>
            <p className="mt-1 leading-5">Install the Android companion to add the real carrier, 5G/LTE generation, dBm, RSRP, RSRQ, and SINR when your phone exposes them.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <a className="rounded-lg border border-[#527568]/30 bg-white px-3 py-2 text-center font-bold" href="https://github.com/banhannah2025/cornett-inds/releases/download/android-signal-latest/basecamp-signal-android.apk">Install Android companion</a>
              <button className="rounded-lg bg-[#527568] px-3 py-2 font-bold text-white" onClick={() => { const returnUrl = window.location.href.split("#")[0] ?? window.location.href; window.location.href = `basecampsignal://measure?return=${encodeURIComponent(returnUrl)}`; }} type="button">Open signal companion</button>
            </div>
            {nativeSignal ? <p className="mt-2 font-bold text-[#356454]" role="status">Android reading ready: {nativeSignal.carrier || "carrier"} · {nativeSignal.networkType || "cellular"}{nativeSignal.dbm !== undefined ? ` · ${nativeSignal.dbm} dBm` : ""}</p> : null}
          </div>
          <button
            onClick={save}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#244a40] px-4 py-3 text-sm font-bold text-white"
          >
            <Plus size={18} />
            Save connection test
          </button>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Metric
              icon={Router}
              value={averages.down ? String(averages.down) : "—"}
              unit="Mbps"
              label="Avg. down"
            />
            <Metric
              icon={Activity}
              value={averages.up ? String(averages.up) : "—"}
              unit="Mbps"
              label="Avg. up"
            />
            <Metric
              icon={Radio}
              value={averages.ping ? String(averages.ping) : "—"}
              unit="ms"
              label="Avg. ping"
            />
          </div>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/10 p-5">
              <div>
                <p className="eyebrow">Connection history</p>
                <h3 className="basecamp-serif text-2xl font-bold">
                  Tested locations
                </h3>
              </div>
              <span className="rounded-full bg-[#eee9df] px-3 py-1 text-xs font-bold">
                {logs.length} logs
              </span>
            </div>
            {logs.length === 0 ? (
              <div className="grid min-h-56 place-items-center p-6 text-center">
                <div>
                  <MapPinned className="mx-auto text-[#b66e38]" size={32} />
                  <p className="mt-3 text-sm text-[#68746f]">
                    No tests saved yet. Log the connection where you are now.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {logs.map((log) => {
                  const meta = kinds[log.kind],
                    Icon = meta.icon;
                  return (
                    <article
                      key={log.id}
                      className="border-b border-black/10 p-5 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                          style={{ background: meta.color }}
                        >
                          <Icon size={19} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <b>{log.location}</b>
                            <span className="rounded-full bg-[#eee9df] px-2 py-0.5 text-[9px] font-bold uppercase">
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#68746f]">
                            {log.provider}
                            {log.network && ` · ${log.network}`} · {log.created}
                          </p>
                          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                            <Reading value={log.download || "—"} label="Down" />
                            <Reading value={log.upload || "—"} label="Up" />
                            <Reading value={log.ping || "—"} label="Ping" />
                            <Reading
                              value={`${log.reliability}/5`}
                              label="Work"
                            />
                          </div>
                          {(log.obstructions || log.notes) && (
                            <p className="mt-3 text-xs leading-5 text-[#65716c]">
                              {[log.obstructions, log.notes]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <button
                          aria-label="Delete log"
                          onClick={() =>
                            setLogs((v) => v.filter((x) => x.id !== log.id))
                          }
                          className="text-[#9a5845]"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
const control =
  "mt-2 w-full rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm font-medium text-[#1d352f] outline-[#527568]";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const child = children as React.ReactElement<{ className?: string }>;
  return (
    <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wider text-[#766c5e]">
      {label}
      {cloneElement(child, { className: control })}
    </label>
  );
}
function Metric({
  icon: Icon,
  value,
  unit,
  label,
}: {
  icon: typeof Router;
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="panel p-3 text-center sm:p-4">
      <Icon className="mx-auto text-[#527568]" size={18} />
      <b className="mt-2 block text-xl">{value}</b>
      <span className="block text-[9px] font-bold text-[#77817d]">{unit}</span>
      <small className="mt-1 block text-[9px] uppercase tracking-wider">
        {label}
      </small>
    </div>
  );
}
function Reading({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-[#eee9df] p-2">
      <b className="block text-xs">{value}</b>
      <small className="text-[8px] uppercase tracking-wider">{label}</small>
    </div>
  );
}
