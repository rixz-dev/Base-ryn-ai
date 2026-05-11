const fetch = require('node-fetch');

async function searchWeb(query) {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:      process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results:  3,
        include_answer: true,
      }),
    });

    const data = await res.json();

    // Ambil answer langsung kalau ada, fallback ke snippets
    if (data.answer) return data.answer;

    return data.results
      ?.slice(0, 3)
      .map(r => `${r.title}: ${r.content?.slice(0, 200)}`)
      .join('\n') || null;

  } catch (err) {
    console.error('[Search]', err.message);
    return null;
  }
}

module.exports = { searchWeb };