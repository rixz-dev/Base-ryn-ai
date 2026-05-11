const { callRyn }                            = require('../ai/client');
const { saveMessage, setFact }               = require('../brain/memory');
const { buildMessages }                      = require('../brain/prompt');
const { updateMood }                         = require('../brain/mood');
const { resolveTool }                        = require('../tools/index');
const { detectEmotion }                      = require('../brain/emotion');
const { consolidateMemory }                  = require('../brain/consolidation');
const { extractDateFromText, extractDateLabel, saveDate } = require('../brain/dates');

let msgCount = 0;

async function handleMessage(ctx) {
  const text = ctx.message?.text;
  if (!text) return;

  await ctx.api.sendChatAction(ctx.chat.id, 'typing');

  saveMessage('user', text);
  updateMood();
  learnFacts(text);
  learnDates(text);

  const toolData    = await resolveTool(text);
  const emotion     = detectEmotion(text);

  const emotionNote = emotion
    ? `\n\n[CATATAN INTERNAL — JANGAN DISEBUT LANGSUNG]: ${emotion.tone}`
    : '';

  const enriched = [text, toolData || '', emotionNote].filter(Boolean).join('\n\n');

  const messages = buildMessages(enriched);
  const response = await callRyn(messages);

  saveMessage('assistant', response);
  await ctx.reply(response);

  msgCount++;
  if (msgCount % 10 === 0) consolidateMemory().catch(() => {});
}

function learnFacts(text) {
  const t = text.toLowerCase();
  if (t.includes('kerja') || t.includes('shift') || t.includes('kantor'))
    setFact('ada_kerjaan', 'ya');
  if (t.includes('buku') || t.includes('baca'))
    setFact('suka_baca', 'ya');
  if (t.includes('coding') || t.includes('ngoding') || t.includes('bug'))
    setFact('developer', 'ya — sering ngoding');
  if (t.includes('capek') || t.includes('tired') || t.includes('lelah'))
    setFact('kadang_kelelahan', 'ya — disebutkan beberapa kali');
  if (t.includes('kesepian') || t.includes('sepi') || t.includes('sendiri'))
    setFact('pernah_merasa_kesepian', 'ya');
  if (t.includes('musik') || t.includes('lagu') || t.includes('spotify'))
    setFact('suka_musik', 'ya');
  if (t.includes('game') || t.includes('main') || t.includes('gaming'))
    setFact('suka_game', 'ya');

  const cityMatch = text.match(/(?:di|tinggal di|domisili)\s+([A-Za-z]+)/i);
  if (cityMatch) {
    setFact('kota', cityMatch[1]);
    process.env.USER_CITY = cityMatch[1];
  }
}

function learnDates(text) {
  const t     = text.toLowerCase();
  const dateKw = ['tanggal','ulang tahun','birthday','anniversary','wisuda','deadline','ujian','exam'];
  if (!dateKw.some(k => t.includes(k))) return;

  const dateStr = extractDateFromText(text);
  if (!dateStr) return;

  const label = extractDateLabel(text);
  saveDate(label, dateStr);
  console.log(`[Dates] saved: ${label} → ${dateStr}`);
}

module.exports = { handleMessage };
