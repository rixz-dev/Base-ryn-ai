const cron = require('node-cron');
const { getChatId, getLastActiveTimestamp } = require('../brain/memory');
const { updateMood }                        = require('../brain/mood');
const { buildProactiveMessages }            = require('../brain/prompt');
const { callRyn }                           = require('../ai/client');

async function sendProactive(bot, trigger) {
  const chatId = getChatId();
  if (!chatId) return;

  try {
    await bot.api.sendChatAction(chatId, 'typing');
    await new Promise(r => setTimeout(r, 1800));

    const messages = buildProactiveMessages(trigger);
    const response = await callRyn(messages);
    if (response) await bot.api.sendMessage(chatId, response);
  } catch (err) {
    console.error(`[Cron:${trigger}]`, err.message);
  }
}

function startScheduler(bot) {
  const tz = { timezone: 'Asia/Jakarta' };

  // 07:00 — morning
  cron.schedule('0 7 * * *', () => {
    sendProactive(bot, 'morning');
  }, tz);

  // 07:30 — cek tanggal penting hari ini / besok / minggu ini
cron.schedule('30 7 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;

  const { checkUpcomingDates }     = require('../brain/dates');
  const { buildProactiveMessages } = require('../brain/prompt');
  const { callRyn }                = require('../ai/client');

  try {
    const upcoming = checkUpcomingDates();
    if (!upcoming.length) return;

    for (const event of upcoming) {
      const whenText = {
        today:    'HARI INI',
        tomorrow: 'BESOK',
        week:     'MINGGU INI',
      }[event.when];

      const messages = [
        buildProactiveMessages('morning')[0],
        {
          role: 'user',
          content: `Kamu ingat bahwa ${event.label} jatuh pada ${whenText}. Sampaikan ke Riz dengan cara yang natural dan hangat — bukan pengumuman formal. Sesuai mood kamu sekarang.`,
        },
      ];

      await bot.api.sendChatAction(chatId, 'typing');
      await new Promise(r => setTimeout(r, 1500));

      const response = await callRyn(messages);
      if (response) await bot.api.sendMessage(chatId, response);
    }
  } catch (err) {
    console.error('[Dates cron]', err.message);
  }
}, tz);

  // 08:15 — daily digest
cron.schedule('15 8 * * *', async () => {
  const chatId = getChatId();
  if (!chatId) return;

  const { buildDigest }        = require('../tools/digest');
  const { buildProactiveMessages } = require('../brain/prompt');
  const { callRyn }            = require('../ai/client');

  try {
    const digest = await buildDigest();
    if (!digest) return;

    const messages = [
      {
        role: 'system',
        content: buildProactiveMessages('morning')[0].content,
      },
      {
        role: 'user',
        content: `Ini pagi. Kamu sudah "baca" beberapa hal menarik hari ini dan mau ceritain ke Riz dengan gaya kamu sendiri — singkat, personal, kayak teman yang excited nemu sesuatu menarik. Bukan laporan berita.\n\n${digest}`,
      },
    ];

    await bot.api.sendChatAction(chatId, 'typing');
    await new Promise(r => setTimeout(r, 2000));

    const response = await callRyn(messages);
    if (response) await bot.api.sendMessage(chatId, response);
  } catch (err) {
    console.error('[Digest]', err.message);
  }
}, tz);

  // 21:00 — evening
  cron.schedule('0 21 * * *', () => {
    sendProactive(bot, 'evening');
  }, tz);

  // 13:00 — random (40% chance)
  cron.schedule('0 13 * * *', () => {
    if (Math.random() < 0.4) sendProactive(bot, 'random');
  }, tz);

  // 00:00 — midnight, hanya kalau Riz aktif dalam 3 jam terakhir
  cron.schedule('0 0 * * *', () => {
    const now   = Date.now() / 1000;
    const hours = (now - getLastActiveTimestamp()) / 3600;
    if (hours < 3) sendProactive(bot, 'midnight');
  }, tz);
   
  // 02:00 — nightly memory consolidation
  cron.schedule('0 2 * * *', () => {
    const { consolidateMemory } = require('../brain/consolidation');
    consolidateMemory().catch(() => {});
   }, tz);

  // Jumat 20:00 — friday message
  cron.schedule('0 20 * * 5', () => {
    sendProactive(bot, 'friday');
  }, tz);

  // Setiap 2 jam — missing check (7-9 jam tidak aktif)
  cron.schedule('0 */2 * * *', () => {
    const now   = Date.now() / 1000;
    const hours = (now - getLastActiveTimestamp()) / 3600;
    if (hours >= 7 && hours < 9) sendProactive(bot, 'missing');
  }, tz);

  // Setiap 30 menit — follow-up kalau obrolan berhenti tiba-tiba (20-35 menit lalu)
  cron.schedule('*/30 * * * *', () => {
    const now     = Date.now() / 1000;
    const minutes = (now - getLastActiveTimestamp()) / 60;
    if (minutes >= 20 && minutes < 35) {
      if (Math.random() < 0.55) sendProactive(bot, 'followup');
    }
  }, tz);

  // Setiap 90 menit — organic random sepanjang hari (25% chance, jam 08-23)
  cron.schedule('*/90 * * * *', () => {
    const hour = new Date().getHours();
    if (hour < 8 || hour >= 23) return;
    if (Math.random() < 0.25) sendProactive(bot, 'random');
  }, tz);

  // Update mood setiap 3 jam
  cron.schedule('0 */3 * * *', () => updateMood(), tz);

  console.log('[Scheduler] active.');
}

module.exports = { startScheduler, sendProactive };
