const { getWeather }          = require('./weather');
const { searchWeb }           = require('./search');
const { extractUrls, readUrl } = require('./reader');

const WEATHER_KW = ['cuaca','weather','panas','hujan','dingin','mendung','gerimis','suhu','temperature'];
const SEARCH_KW  = ['cari','search','cariin','tau gak','tau tidak','apa itu','siapa itu','berita','info','gimana kabar','terbaru'];

function detectIntent(text) {
  const t    = text.toLowerCase();
  const urls = extractUrls(text);

  if (urls.length)                          return 'read';
  if (WEATHER_KW.some(k => t.includes(k))) return 'weather';
  if (SEARCH_KW.some(k => t.includes(k)))  return 'search';
  return null;
}

function extractQuery(text) {
  return text
    .replace(/cariin|cari|search|tau gak|apa itu|siapa itu|berita tentang|info tentang/gi, '')
    .trim() || text;
}

async function resolveTool(text) {
  const intent = detectIntent(text);
  if (!intent) return null;

  if (intent === 'read') {
    const urls    = extractUrls(text);
    const content = await readUrl(urls[0]);
    if (!content) return null;
    return `[ISI ARTIKEL/LINK YANG DIKIRIM RIZ]\n${content}\n\nRyn membaca ini dan menceritakan kembali dengan gayanya sendiri — natural, bukan bullet point.`;
  }

  if (intent === 'weather') {
    const city    = process.env.USER_CITY || 'Jakarta';
    const weather = await getWeather(city);
    if (!weather) return null;
    return `[DATA CUACA ${weather.city.toUpperCase()} SEKARANG]\n` +
           `Suhu: ${weather.temp_c}°C (terasa ${weather.feels_c}°C)\n` +
           `Kondisi: ${weather.desc}\n` +
           `Kelembapan: ${weather.humidity}%\n` +
           `Angin: ${weather.wind_kmph} km/h`;
  }

  if (intent === 'search') {
    const query  = extractQuery(text);
    const result = await searchWeb(query);
    if (!result) return null;
    return `[HASIL PENCARIAN: "${query}"]\n${result}`;
  }

  return null;
}

module.exports = { resolveTool };
