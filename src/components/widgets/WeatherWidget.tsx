import React, { useState, useEffect, useCallback } from "react";
import { Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning, RefreshCw, MapPin, MapPinOff } from "lucide-react";

interface WeatherData {
  temp: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}

// Maps WMO codes to descriptions and icons
const getWeatherDescription = (code: number) => {
  if (code === 0) return { desc: "Clear Sky", Icon: Sun, color: "text-amber-400" };
  if ([1, 2].includes(code)) return { desc: "Partly Cloudy", Icon: CloudSun, color: "text-zinc-300" };
  if (code === 3) return { desc: "Overcast", Icon: Cloud, color: "text-zinc-400" };
  if ([45, 48].includes(code)) return { desc: "Foggy", Icon: CloudFog, color: "text-zinc-500" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { desc: "Raining", Icon: CloudRain, color: "text-blue-400" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { desc: "Snowing", Icon: CloudSnow, color: "text-sky-300" };
  if ([95, 96, 99].includes(code)) return { desc: "Thunderstorm", Icon: CloudLightning, color: "text-yellow-500" };
  return { desc: "Cloudy", Icon: Cloud, color: "text-zinc-400" };
};

// Default coordinates (New York City)
const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.0060;

export const WeatherWidget: React.FC = () => {
  const [lat, setLat] = useState<number>(() => {
    const saved = localStorage.getItem("weather-lat");
    return saved ? parseFloat(saved) : DEFAULT_LAT;
  });
  const [lon, setLon] = useState<number>(() => {
    const saved = localStorage.getItem("weather-lon");
    return saved ? parseFloat(saved) : DEFAULT_LON;
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<"prompt" | "granted" | "denied" | "error">("prompt");
  const [showConfig, setShowConfig] = useState(false);

  // Manual input state
  const [inputLat, setInputLat] = useState(String(lat));
  const [inputLon, setInputLon] = useState(String(lon));

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&wind_speed_unit=mph`
      );
      if (!response.ok) throw new Error("Weather service unreachable.");
      const data = await response.json();
      
      if (data.current_weather) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          windSpeed: Math.round(data.current_weather.windspeed),
          weatherCode: data.current_weather.weathercode,
          time: data.current_weather.time,
        });
      } else {
        throw new Error("No current weather data found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load weather.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setError("Geolocation not supported by browser.");
      fetchWeather(lat, lon);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = parseFloat(position.coords.latitude.toFixed(4));
        const newLon = parseFloat(position.coords.longitude.toFixed(4));
        setLat(newLat);
        setLon(newLon);
        setInputLat(String(newLat));
        setInputLon(String(newLon));
        localStorage.setItem("weather-lat", String(newLat));
        localStorage.setItem("weather-lon", String(newLon));
        setGeoStatus("granted");
        fetchWeather(newLat, newLon);
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setGeoStatus("denied");
        // Fallback to saved/default coordinates
        fetchWeather(lat, lon);
      },
      { timeout: 8000 }
    );
  }, [lat, lon, fetchWeather]);

  // Load weather on mount
  useEffect(() => {
    // Attempt automatic geolocation check
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" as any }).then((result) => {
        if (result.state === "granted") {
          requestGeolocation();
        } else {
          setGeoStatus(result.state as any);
          fetchWeather(lat, lon);
        }
      });
    } else {
      fetchWeather(lat, lon);
    }
  }, []);

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLat = parseFloat(inputLat);
    const newLon = parseFloat(inputLon);
    if (isNaN(newLat) || isNaN(newLon)) {
      setError("Coordinates must be valid decimal numbers.");
      return;
    }

    setLat(newLat);
    setLon(newLon);
    localStorage.setItem("weather-lat", String(newLat));
    localStorage.setItem("weather-lon", String(newLon));
    setShowConfig(false);
    fetchWeather(newLat, newLon);
  };

  const weatherDetails = weather ? getWeatherDescription(weather.weatherCode) : null;
  const WeatherIcon = weatherDetails ? weatherDetails.Icon : Cloud;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-2 text-center select-none group relative">
      
      {showConfig ? (
        /* Configuration Panel */
        <form onSubmit={handleManualSave} className="w-full flex-1 flex flex-col justify-center items-center space-y-3 px-4 py-2">
          <span className="text-sm font-bold text-[var(--color-text-main)]">Set Coordinates (Lat/Lon)</span>
          <div className="flex space-x-2">
            <div className="flex-1 flex flex-col items-start">
              <label htmlFor="lat-input" className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Latitude</label>
              <input
                id="lat-input"
                type="text"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                className="w-full p-2 bg-black/40 border border-[var(--color-card-border)] text-[var(--color-text-main)] rounded-lg text-sm text-center focus:outline-none accessible-focus font-mono"
              />
            </div>
            <div className="flex-1 flex flex-col items-start">
              <label htmlFor="lon-input" className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Longitude</label>
              <input
                id="lon-input"
                type="text"
                value={inputLon}
                onChange={(e) => setInputLon(e.target.value)}
                className="w-full p-2 bg-black/40 border border-[var(--color-card-border)] text-[var(--color-text-main)] rounded-lg text-sm text-center focus:outline-none accessible-focus font-mono"
              />
            </div>
          </div>
          <div className="flex space-x-2 w-full pt-1">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm accessible-focus"
            >
              Save & Fetch
            </button>
            <button
              type="button"
              onClick={() => {
                setInputLat(String(lat));
                setInputLon(String(lon));
                setShowConfig(false);
              }}
              className="px-3 py-2 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-[var(--color-text-main)] rounded-lg font-bold text-sm border border-[var(--color-card-border)] accessible-focus"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Weather Display */
        <div className="flex-1 w-full flex flex-col justify-center items-center">
          {error && (
            <div className="text-red-500 font-bold text-sm px-4 mb-2">
              ⚠️ {error}
            </div>
          )}
          
          {loading && !weather ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-sm font-bold text-[var(--color-text-muted)]">Loading weather...</span>
            </div>
          ) : weather && weatherDetails ? (
            <div className="flex flex-col items-center">
              {/* Main Weather Row */}
              <div className="flex items-center justify-center space-x-4">
                <WeatherIcon className={`w-16 h-16 ${weatherDetails.color}`} />
                <div className="text-left">
                  <div className="text-5xl font-extrabold tabular-nums tracking-tight leading-none text-[var(--color-text-main)]">
                    {weather.temp}°F
                  </div>
                  <div className="text-lg font-bold text-[var(--color-text-main)] mt-1">
                    {weatherDetails.desc}
                  </div>
                </div>
              </div>

              {/* Extra Details */}
              <div className="flex space-x-4 mt-3 text-xs font-bold text-[var(--color-text-muted)]">
                <span className="flex items-center">
                  💨 Wind: {weather.windSpeed} mph
                </span>
                <span className="flex items-center font-mono">
                  📍 {lat.toFixed(2)}°, {lon.toFixed(2)}°
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm font-bold text-[var(--color-text-muted)]">
              No weather data loaded.
            </div>
          )}
        </div>
      )}

      {/* Control bar */}
      {!showConfig && (
        <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 mt-2">
          <button
            onClick={() => fetchWeather(lat, lon)}
            disabled={loading}
            className="py-1.5 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] disabled:opacity-40 text-xs font-bold rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-main)] flex items-center accessible-focus"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          
          <button
            onClick={requestGeolocation}
            disabled={loading}
            className="py-1.5 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-xs font-bold rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-main)] flex items-center accessible-focus"
            aria-label="Use current location coordinates"
          >
            {geoStatus === "denied" ? <MapPinOff className="w-3.5 h-3.5 mr-1 text-red-500" /> : <MapPin className="w-3.5 h-3.5 mr-1 text-green-500" />} Locate
          </button>

          <button
            onClick={() => setShowConfig(true)}
            className="py-1.5 px-3 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] text-xs font-bold rounded-lg border border-[var(--color-card-border)] text-[var(--color-text-main)] accessible-focus"
            aria-label="Set coordinates manually"
          >
            Edit Loc
          </button>
        </div>
      )}
    </div>
  );
};
