const { searchWeb } = require('./search');
const { getAllFacts } = require('../brain/memory');

const DEFAULT_TOPICS = ['AI technology', 'programming', 'tech news'];

function buildTopics() {
  const facts = getAllFacts();
  const topics = [...DEFAULT_TOPICS];

  const factMap = Object.fromEntries(facts.map(f => [f.key, f.value]));

  if (factMap.developer)    topics.push('software development', 'open source');
  if (factMap.suka_baca)    topics.push('book recommendations');
  if (factMap.suka_musik)   topics.push('music');
  if (factMap.suka_game)    topics.push('gaming');

  // Shuffle dan ambil 3
  return topics.sort(() => Math.random() - 0.5).slice(0, 3);
}

async function buildDigest() {
  const topics  = buildTopics();
  const results = [];

  for (const topic of topics) {
    const result = await searchWeb(`${topic} latest news today`);
    if (result) results.push({ topic, result });
  }

  if (!results.length) return null;

  return results
    .map(r => `[${r.topic.toUpperCase()}]\n${r.result}`)
    .join('\n\n---\n\n');
}

module.exports = { buildDigest };
