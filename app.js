const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const cache = new Map(); // just gonna ues mem, not json
const CACHE_TIME = 10 * 60 * 1000; // 10 min, could raise but this is unlikely to be run that much

function getCached(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > CACHE_TIME) {
        cache.delete(key);
        return null;
    }
    return item.data;
}
function setCached(key, data) {
    cache.set(key, { timestamp: Date.now(), data });
}
async function fetchLatLong(streetNumber, streetName, city, state) {
    const address = `${streetNumber} ${streetName}, ${city}, ${state}`;
    const cacheKey = `geocode:${address.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const response = await axios.get("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress", {
        params: { address, benchmark: "Public_AR_Current", format: "json" }
    });
    const matches = response.data.result.addressMatches;
    if (!matches || matches.length === 0) throw new Error("Address not found");
    const location = {
        lat: Number(matches[0].coordinates.y),
        long: Number(matches[0].coordinates.x),
        displayName: matches[0].matchedAddress
    };
    setCached(cacheKey, location);
    return location;
}
async function fetchOpenMeteoWeatherSolar(lat, long) {
    const cacheKey = `weather-solar:${lat},${long}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
            latitude: lat,
            longitude: long,
            temperature_unit: "fahrenheit",
            wind_speed_unit: "mph",
            precipitation_unit: "inch",
            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "rain",
                "showers",
                "snowfall",
                "weather_code",
                "cloud_cover",
                "pressure_msl",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
                "wind_gusts_10m"
            ].join(","),
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "apparent_temperature_max",
                "apparent_temperature_min",
                "sunrise",
                "sunset",
                "daylight_duration",
                "sunshine_duration",
                "precipitation_sum",
                "rain_sum",
                "showers_sum",
                "snowfall_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "wind_gusts_10m_max",
                "wind_direction_10m_dominant"
            ].join(","),
            hourly: [
                "shortwave_radiation",
                "direct_radiation",
                "diffuse_radiation",
                "direct_normal_irradiance"
            ].join(","),
            timezone: "auto",
            forecast_days: 2
        }
    }
    );
    setCached(cacheKey, response.data);
    return response.data;
}
async function fetchOpenMeteoSoil(lat, long) {
    const cacheKey = `soil:${lat},${long}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
            latitude: lat, longitude: long, temperature_unit: "fahrenheit", precipitation_unit: "inch",
            hourly: ["soil_temperature_0cm", "soil_temperature_6cm", "soil_temperature_18cm", "soil_temperature_54cm", "soil_moisture_0_to_1cm",
                "soil_moisture_1_to_3cm", "soil_moisture_3_to_9cm", "soil_moisture_9_to_27cm", "soil_moisture_27_to_81cm"].join(","),
            timezone: "auto", forecast_days: 2
        }
    });
    setCached(cacheKey, response.data);
    return response.data;
}
async function fetchNwsAlerts(lat, long) {
    const cacheKey = `alerts:${lat},${long}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const response = await axios.get("https://api.weather.gov/alerts/active",
        {
            params: { point: `${lat},${long}` },
            headers: { "User-Agent": "LocationWeatherApp/1.0" }
        });
    const alerts = response.data.features || [];
    setCached(cacheKey, alerts);
    return alerts;
}
async function fetchAPI(lat, long) {
    const [weatherSolar, soil, alerts] = await Promise.all([fetchOpenMeteoWeatherSolar(lat, long), fetchOpenMeteoSoil(lat, long), fetchNwsAlerts(lat, long)]);
    return { weatherSolar, soil, alerts };
}
function extractSections(data) {
    const weather = data.weatherSolar;
    const soil = data.soil;
    const alerts = data.alerts;
    const sections = {
        weather: [
            {
                label: "Temperature",
                value: `${weather.current.temperature_2m} °F`
            },
            {
                label: "Feels Like",
                value: `${weather.current.apparent_temperature} °F`
            },
            {
                label: "Humidity",
                value: `${weather.current.relative_humidity_2m}%`
            },
            {
                label: "Wind",
                value: `${weather.current.wind_speed_10m} mph`
            },
            {
                label: "Wind Gusts",
                value: `${weather.current.wind_gusts_10m} mph`
            },
            {
                label: "Cloud Cover",
                value: `${weather.current.cloud_cover}%`
            },
            {
                label: "Pressure",
                value: `${weather.current.pressure_msl} hPa`
            },
            {
                label: "Precipitation",
                value: `${weather.current.precipitation} in`
            }
        ],
        solar: [
            {
                label: "Sunrise",
                value: weather.daily.sunrise[0]
            },
            {
                label: "Sunset",
                value: weather.daily.sunset[0]
            },
            {
                label: "Daylight",
                value: `${Math.round(weather.daily.daylight_duration[0] / 3600)} hours` // not worth making into a func
            },
            {
                label: "Sunshine",
                value: `${Math.round(weather.daily.sunshine_duration[0] / 3600)} hours`
            }
        ],
        soil: [
            {
                label: "Surface Soil Temperature",
                value: `${soil.hourly.soil_temperature_0cm[0]} °F`
            },
            {
                label: "6cm Soil Temperature", //6cm~=2.3in but thats a rly awkward number. decide: change or no?
                value: `${soil.hourly.soil_temperature_6cm[0]} °F`
            },
            {
                label: "Surface Soil Moisture",
                value: soil.hourly.soil_moisture_0_to_1cm[0]
            }
        ],
        alerts: alerts.map(alert => ({
            label: alert.properties.event,
            value: alert.properties.headline
        }))
    };
    return sections;
}

app.get("/", (req, res) => {
    res.render("index", { location: null, sections: null, error: null });
});
app.post("/location", async (req, res) => {
    const { streetNumber, streetName, city, state } = req.body;
    if (!streetNumber || !streetName || !city || !state) {
        return res.render("index", { location: null, sections: null, error: "Please fill out the entire address." });
    }
    try {
        const location = await fetchLatLong(streetNumber, streetName, city, state);
        const data = await fetchAPI(location.lat, location.long);
        const sections = extractSections(data);
        res.render("index", { location, sections, error: null });
    } catch (error) {
        console.error(error);
        res.render("index", { location: null, sections: null, error: "Unable to retrieve information for that address." });
    }
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
