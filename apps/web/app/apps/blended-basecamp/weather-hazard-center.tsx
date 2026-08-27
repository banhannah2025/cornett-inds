"use client";
import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  CloudSun,
  LocateFixed,
  RefreshCw,
  ShieldAlert,
  ThermometerSun,
  TriangleAlert,
  Wind,
} from "lucide-react";
type Forecast = {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  shortForecast: string;
};
type Alert = {
  id: string;
  properties: {
    event: string;
    severity: string;
    headline: string;
    description: string;
    instruction: string | null;
    areaDesc: string;
    expires: string;
  };
};
const hazardOptions = [
  "Severe thunderstorms",
  "Flooding",
  "Wildfire and smoke",
  "High wind",
  "Extreme heat or cold",
  "Winter weather",
];
export function WeatherHazardCenter() {
  const [forecast, setForecast] = useState<Forecast[]>([]),
    [alerts, setAlerts] = useState<Alert[]>([]),
    [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
      "idle",
    ),
    [message, setMessage] = useState(
      "Use your location to load official local conditions.",
    ),
    [prefs, setPrefs] = useState<Record<string, boolean>>({}),
    [updated, setUpdated] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blended-basecamp-hazards");
      if (raw) setPrefs(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("blended-basecamp-hazards", JSON.stringify(prefs));
  }, [prefs]);
  const notify = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default")
      await Notification.requestPermission();
  };
  const load = () => {
    if (!navigator.geolocation) {
      setMessage("Location is not available on this device.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("Finding your location and checking official alerts…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude.toFixed(4),
            lon = pos.coords.longitude.toFixed(4);
          const [pointRes, alertRes] = await Promise.all([
            fetch(`https://api.weather.gov/points/${lat},${lon}`, {
              headers: { Accept: "application/geo+json" },
            }),
            fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
              headers: { Accept: "application/geo+json" },
            }),
          ]);
          if (!pointRes.ok || !alertRes.ok) throw new Error();
          const point = await pointRes.json(),
            alertData = await alertRes.json();
          const forecastRes = await fetch(point.properties.forecast, {
            headers: { Accept: "application/geo+json" },
          });
          if (!forecastRes.ok) throw new Error();
          const forecastData = await forecastRes.json();
          const active = (alertData.features ?? []) as Alert[];
          setForecast((forecastData.properties.periods ?? []).slice(0, 4));
          setAlerts(active);
          setUpdated(
            new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
          );
          setMessage(
            active.length
              ? `${active.length} active National Weather Service alert${active.length === 1 ? "" : "s"} for your location.`
              : "No active National Weather Service alerts for your location.",
          );
          setStatus("ready");
          const firstAlert = active[0];
          if (
            firstAlert &&
            "Notification" in window &&
            Notification.permission === "granted"
          )
            new Notification(firstAlert.properties.event, {
              body: firstAlert.properties.headline,
            });
        } catch {
          setStatus("error");
          setMessage(
            "Weather data could not be loaded. Check your connection and try again.",
          );
        }
      },
      () => {
        setStatus("error");
        setMessage("Location permission is needed to check nearby hazards.");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };
  return (
    <section id="weather-hazards" className="mb-10">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Weather & hazard center</p>
          <h2 className="basecamp-serif text-3xl font-bold sm:text-4xl">
            Know what’s coming before it reaches camp.
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={notify}
            className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-bold"
          >
            <Bell size={16} />
            Enable alerts
          </button>
          <button
            onClick={load}
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-xl bg-[#244a40] px-4 py-2.5 text-xs font-bold text-white"
          >
            {status === "loading" ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <LocateFixed size={16} />
            )}
            Check my area
          </button>
        </div>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_.65fr]">
        <div className="space-y-5">
          <div
            className={`rounded-[26px] p-5 text-white sm:p-6 ${alerts.length ? "bg-[#7f3f32]" : "bg-[#203f37]"}`}
          >
            <div className="flex items-start gap-4">
              {alerts.length ? (
                <BellRing className="shrink-0 text-[#ffd18c]" size={28} />
              ) : (
                <ShieldAlert className="shrink-0 text-[#e6c57d]" size={28} />
              )}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#e6c57d]">
                  Local status {updated && `· updated ${updated}`}
                </p>
                <h3 className="basecamp-serif mt-1 text-2xl font-bold">
                  {alerts.length
                    ? "Hazard attention needed"
                    : "Ready for a local check"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {message}
                </p>
              </div>
            </div>
          </div>
          {alerts.map((a) => (
            <article key={a.id} className="panel overflow-hidden">
              <div className="border-b border-[#d7b7aa] bg-[#f6e4dc] p-5">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="shrink-0 text-[#9a4937]" />
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#9a4937]">
                      {a.properties.severity} · expires{" "}
                      {new Date(a.properties.expires).toLocaleString()}
                    </span>
                    <h3 className="basecamp-serif mt-1 text-2xl font-bold">
                      {a.properties.event}
                    </h3>
                    <p className="mt-1 text-xs text-[#765e55]">
                      {a.properties.areaDesc}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-bold leading-6">
                  {a.properties.headline}
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-bold text-[#527568]">
                    Read official details and safety guidance
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-xs leading-6 text-[#65716c]">
                    {a.properties.description}
                  </p>
                  {a.properties.instruction && (
                    <p className="mt-3 rounded-xl bg-[#eee9df] p-4 text-xs font-semibold leading-5">
                      {a.properties.instruction}
                    </p>
                  )}
                </details>
              </div>
            </article>
          ))}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {forecast.map((f, i) => (
              <article key={i} className="panel p-4">
                <CloudSun className="text-[#b66e38]" size={21} />
                <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider">
                  {f.name}
                </p>
                <b className="basecamp-serif mt-1 block text-3xl">
                  {f.temperature}°{f.temperatureUnit}
                </b>
                <p className="mt-2 text-xs leading-5 text-[#65716c]">
                  {f.shortForecast}
                </p>
                <span className="mt-2 flex items-center gap-1 text-[10px]">
                  <Wind size={12} />
                  {f.windSpeed}
                </span>
              </article>
            ))}
          </div>
        </div>
        <aside className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Alert preferences</p>
              <h3 className="basecamp-serif text-2xl font-bold">
                What should stand out?
              </h3>
            </div>
            <ThermometerSun className="text-[#b66e38]" />
          </div>
          <p className="mt-2 text-xs leading-5 text-[#68746f]">
            Save the hazards most important to your work, route, rig, and
            family. Official active alerts are always shown.
          </p>
          <div className="mt-5 space-y-2">
            {hazardOptions.map((h) => (
              <label
                key={h}
                className="flex cursor-pointer items-center justify-between rounded-xl bg-[#eee9df] px-4 py-3 text-xs font-bold"
              >
                {h}
                <input
                  type="checkbox"
                  checked={!!prefs[h]}
                  onChange={() => setPrefs((v) => ({ ...v, [h]: !v[h] }))}
                  className="size-4 accent-[#527568]"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[#d7c9aa] bg-[#fff7df] p-4 text-xs leading-5 text-[#6e6048]">
            <b>Important:</b> Basecamp supplements—not replaces—Wireless
            Emergency Alerts, NOAA Weather Radio, local evacuation notices, and
            official instructions.
          </div>
        </aside>
      </div>
    </section>
  );
}
