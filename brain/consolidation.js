const { getHistory, getAllFacts, setFact, setState, getState } = require('./memory');
const { callRyn } = require('../ai/client');

async function consolidateMemory() {
  const history = getHistory(40);
  if (history.length < 4) return;

  const lastConsolidated = parseInt(getState('last_consolidated') || '0');
  const now = Date.now() / 1000;

  // Jangan consolidate kalau baru 6 jam lalu
  if (now - lastConsolidated < 6 * 3600) return;

  const transcript = history
    .map(m => `${m.role === 'user' ? 'Riz' : 'Ryn'}: ${m.content}`)
    .join('\n');

  const prompt = `Dari percakapan ini antara Riz dan Ryn, ekstrak maksimal 5 fakta baru atau update yang penting tentang Riz.

Format HANYA JSON array seperti ini, tidak ada teks lain:
[{"key":"nama_fakta","value":"deskripsi singkat"},...]

Jangan duplikasi yang sudah jelas. Fokus pada: perasaan, kebiasaan, kejadian penting, preferensi, hal yang dia ceritakan.

Percakapan:
${transcript}`;

  try {
    const response = await callRyn([
      { role: 'system', content: 'Kamu adalah memory extractor. Respond HANYA dengan JSON array. Tidak ada teks lain.' },
      { role: 'user', content: prompt },
    ]);

    const clean = response.replace(/```json|```/g, '').trim();
    const facts  = JSON.parse(clean);

    if (Array.isArray(facts)) {
      facts.forEach(f => {
        if (f.key && f.value) setFact(f.key, f.value);
      });
      setState('last_consolidated', String(Math.floor(now)));
      console.log(`[Memory] consolidated ${facts.length} facts.`);
    }
  } catch (err) {
    console.error('[Memory] consolidation failed:', err.message);
  }
}

module.exports = { consolidateMemory };
