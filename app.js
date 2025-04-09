const express = require("express");
const hbs = require("hbs");
const axios = require("axios");

const app = express();
const PORT = 3000;
const API_KEY = "616778eddff5d006df58aadb4489811a";

// Налаштування view engine для Handlebars
app.set("view engine", "hbs");

// Регістрація часткових шаблонів
hbs.registerPartials(__dirname + '/views/partials');

app.use(express.static('public'));

// Головна сторінка
app.get("/", (req, res) => {
  res.render("index");
});

console.log("== Сервер запускається ==");

// функція для отримання назви міста через Nominatim
async function getCityFromCoords(lat, lon) {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "weather-app-kpi" } }
      );

      const address = response.data.address;
      console.log("Nominatim response:", address); // Додатково для відладки

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.district ||
        address.state;

      return city || "Ваше місцезнаходження"; // Якщо нічого не знайдено, повертаємо за замовчуванням
    } catch (error) {
      console.error("Geocoding error:", error.message);
      return "Ваше місцезнаходження"; // Якщо сталася помилка
    }
}

// Погода за геолокацією
app.get("/weather/geo", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.render("weather", {
        city: "Ваше місцезнаходження",
        error: "Немає координат для запиту погоди",
      });
    }

    try {
      // 1. Отримуємо назву міста через Nominatim
      const cityName = await getCityFromCoords(lat, lon);

      // 2. Отримуємо погоду
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ua`
      );
      const weather = response.data;

      // 3. Рендер з містом із Nominatim
      res.render("weather", {
        city: cityName,
        temp: weather.main.temp,
        description: weather.weather[0].description,
        icon: `http://openweathermap.org/img/w/${weather.weather[0].icon}.png`,
      });
    } catch (error) {
      console.error("Geo API error:", error.message);
      res.render("weather", {
        city: "Ваше місцезнаходження",
        error: "Не вдалося отримати дані про погоду",
      });
    }
});

// Погода для міста
app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ua`
    );

    const weather = response.data;
    res.render("weather", {
      city: weather.name,
      temp: weather.main.temp,
      description: weather.weather[0].description,
      icon: `http://openweathermap.org/img/w/${weather.weather[0].icon}.png`,
    });
  } catch (error) {
    console.error("API error:", error.message);
    res.render("weather", {
      city,
      error: "Не вдалося отримати дані про погоду",
    });
  }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
