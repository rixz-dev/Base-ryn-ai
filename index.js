require('dotenv').config();
const { Bot } = require('grammy');
const { handleMessage }            = require('./handlers/message');
const { handlePhoto, handleVideo } = require('./handlers/photo');
const { initMemory, saveChatId, saveMessage } = require('./brain/memory');
const { startScheduler, sendProactive } = require('./scheduler/cron');
const { generateVoice, cleanupVoice }   = require('./tools/voice');
const { buildMessages }  = require('./brain/prompt');
const { callRyn }        = require('./ai/client');

const bot = new Bot(process.env.BOT_TOKEN);

initMemory();

bot.command('start', async (ctx) => {
  saveChatId(ctx.chat.id);
  await ctx.reply('riz.');
});

bot.command('mood', async (ctx) => {
  const { getCurrentMood } = require('./brain/mood');
  await ctx.reply(`mood ryn sekarang: ${getCurrentMood()}`);
});

bot.command('ping', async (ctx) => {
  await sendProactive(bot, 'missing');
});

bot.command('suara', async (ctx) => {
  const text = ctx.match?.trim();
  if (!text) return ctx.reply('mau aku ucapkan apa?');
  await ctx.api.sendChatAction(ctx.chat.id, 'record_voice');
  const oggPath = await generateVoice(text);
  if (oggPath) { const { InputFile } = require("grammy"); await ctx.replyWithVoice(new InputFile(oggPath)); cleanupVoice(oggPath); }
  else await ctx.reply(text);
});

bot.command('v', async (ctx) => {
  const text = ctx.match?.trim();
  if (!text) return;
  saveMessage('user', text);
  const messages = buildMessages(text);
  const response = await callRyn(messages);
  saveMessage('assistant', response);
  await ctx.api.sendChatAction(ctx.chat.id, 'record_voice');
  const oggPath = await generateVoice(response);
  if (oggPath) { const { InputFile } = require("grammy"); await ctx.replyWithVoice(new InputFile(oggPath)); cleanupVoice(oggPath); }
  else await ctx.reply(response);
});

bot.on('message:text',       handleMessage);
bot.on('message:photo',      handlePhoto);
bot.on('message:video',      handleVideo);
bot.on('message:video_note', handleVideo);

bot.catch((err) => console.error('[Bot]', err.message));
bot.start();
startScheduler(bot);
console.log('[Ryn] online.');
