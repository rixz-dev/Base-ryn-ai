const fetch = require('node-fetch');

async function getWeather(city) {
  try {
    const res  = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await res.json();
    const cur  = data.current_condition[0];

    return {
      city,
      temp_c:    cur.temp_C,
      feels_c:   cur.FeelsLikeC,
      desc:      cur.weatherDesc[0].value,
      humidity:  cur.humidity,
      wind_kmph: cur.windspeedKmph,
    };
  } catch (err) {
    console.error('[Weather]', err.message);
    return null;
  }
}

module.exports = { getWeather };