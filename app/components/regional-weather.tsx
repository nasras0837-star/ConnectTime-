"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/app/components/language-provider";

type WeatherData = {
  city: string;
  current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] };
};

const capitals: Record<string,string> = {
  US:"Washington",GB:"London",CA:"Ottawa",AU:"Canberra",NZ:"Wellington",IE:"Dublin",DE:"Berlin",FR:"Paris",ES:"Madrid",IT:"Rome",NL:"Amsterdam",PT:"Lisbon",SE:"Stockholm",
  BR:"Brasilia",MX:"Mexico City",AR:"Buenos Aires",CL:"Santiago",CO:"Bogota",IN:"New Delhi",JP:"Tokyo",CN:"Beijing",TW:"Taipei",KR:"Seoul",SG:"Singapore",MY:"Kuala Lumpur",ID:"Jakarta",TH:"Bangkok",
  ZA:"Pretoria",NG:"Abuja",KE:"Nairobi",UG:"Kampala",AE:"Abu Dhabi",SA:"Riyadh",QA:"Doha",PK:"Islamabad"
};
const descriptions: Record<number,string> = {
  0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Depositing rime fog",
  51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",
  71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Rain showers",82:"Heavy showers",
  95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail"
};
function weatherLabel(code:number){return descriptions[code] || "Variable conditions";}
function weatherIcon(code:number){if(code===0)return "☀️";if([1,2].includes(code))return "🌤️";if([3].includes(code))return "☁️";if([45,48].includes(code))return "🌫️";if([51,53,55,61,63,65,80,81,82].includes(code))return "🌧️";if([71,73,75].includes(code))return "❄️";return "⛈️";}

export default function RegionalWeather({ compact = false }: { compact?: boolean }) {
  const { countryCode, countryName, language, temperatureUnit } = useLanguage();
  const [city,setCity] = useState("");
  const [query,setQuery] = useState("");
  const [data,setData] = useState<WeatherData|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(() => {
    // Reset a manually searched city when the member changes regional edition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
    setCity("");
  }, [countryCode]);

  useEffect(() => {
    const controller = new AbortController();
    const selectedCity = query.trim() || capitals[countryCode] || "Washington";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    const languageCode = language === "zh" ? "zh" : language;
    fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(selectedCity)+"&count=1&language="+encodeURIComponent(languageCode)+"&format=json",{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error("Location lookup is unavailable.");return r.json();})
      .then(async geo=>{
        const place=geo.results?.[0];
        if(!place)throw new Error("No matching city found. Try another city.");
        const units=temperatureUnit==="fahrenheit"?"fahrenheit":"celsius";
        const wind=temperatureUnit==="fahrenheit"?"mph":"kmh";
        const url="https://api.open-meteo.com/v1/forecast?latitude="+place.latitude+"&longitude="+place.longitude+"&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit="+units+"&wind_speed_unit="+wind+"&timezone=auto&forecast_days=5";
        const response=await fetch(url,{signal:controller.signal});
        if(!response.ok)throw new Error("Weather forecast is unavailable.");
        const forecast=await response.json();
        setData({city:place.name+(place.admin1?", "+place.admin1:""),current:forecast.current,daily:forecast.daily});
      })
      .catch(e=>{if(e.name!=="AbortError")setError(e instanceof Error?e.message:"Weather is unavailable.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[countryCode,language,temperatureUnit,query]);

  function searchCity(event:FormEvent<HTMLFormElement>){event.preventDefault();setQuery(city.trim());}
  const unit=temperatureUnit==="fahrenheit"?"°F":"°C";
  const windUnit=temperatureUnit==="fahrenheit"?"mph":"km/h";
  return <section className={compact ? "ctRegionalWeather ctRegionalWeatherCompact" : "ctRegionalWeather"} aria-label="Regional weather">
    <div className="ctRegionalWeatherHead"><div><span>🌦️ CONNECT WEATHER · {countryName.toUpperCase()}</span><h2>Weather in your region</h2><p>{compact ? "Current conditions and a short forecast." : "Local conditions and a five-day forecast. Change the city at any time."}</p></div><span className="ctWeatherUnit">{temperatureUnit==="fahrenheit"?"°F":"°C"}</span></div>
    <form className="ctWeatherSearch" onSubmit={searchCity}><label htmlFor="ct-weather-city">City or town</label><input id="ct-weather-city" value={city} onChange={e=>setCity(e.target.value)} placeholder={"Search a city in "+countryName}/><button type="submit">Update location</button></form>
    {loading?<p role="status">Loading regional forecast…</p>:error?<p role="alert">{error}</p>:data&&<>
      <div className="ctWeatherCurrent"><div><span>{data.city}</span><strong>{weatherIcon(data.current.weather_code)} {Math.round(data.current.temperature_2m)}{unit}</strong><small>{weatherLabel(data.current.weather_code)}</small></div><div className="ctWeatherDetails"><span>Feels like <b>{Math.round(data.current.apparent_temperature)}{unit}</b></span><span>Humidity <b>{data.current.relative_humidity_2m}%</b></span><span>Wind <b>{Math.round(data.current.wind_speed_10m)} {windUnit}</b></span></div></div>
      <div className="ctWeatherForecast">{data.daily.time.slice(0, compact ? 3 : 5).map((day,index)=><article key={day}><b>{new Date(day+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</b><span>{weatherIcon(data.daily.weather_code[index])}</span><strong>{Math.round(data.daily.temperature_2m_max[index])}{unit} / {Math.round(data.daily.temperature_2m_min[index])}{unit}</strong><small>Rain {data.daily.precipitation_probability_max[index] ?? 0}%</small></article>)}</div>
      <small className="ctWeatherAttribution">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>. Location defaults to the country capital and can be changed above.</small>
    </>}
  </section>;
}
