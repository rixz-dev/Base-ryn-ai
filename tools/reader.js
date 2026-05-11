const fetch = require('node-fetch');

function extractUrls(text) {
  const regex = /https?:\/\/[^\s]+/g;
  return text.match(regex) || [];
}

async function readUrl(url) {
  try {
    // Pakai r.jina.ai untuk extract clean text dari URL
    const res  = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain' },
      timeout: 10000,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();

    // Trim — ambil 2000 char pertama cukup untuk summary
    return text.slice(0, 2000).trim() || null;

  } catch (err) {
    console.error('[Reader]', err.message);
    return null;
  }
}

module.exports = { extractUrls, readUrl };
