const { downloadTelegramFile, extractVideoFrame, encodeBase64, cleanup } = require('../tools/vision');
const { buildSystem }   = require('../brain/prompt');
const { saveMessage }   = require('../brain/memory');
const { updateMood }    = require('../brain/mood');

function stripThink(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();
}

async function analyzeImage(base64, contextPrompt) {
  const OpenAI = require('openai');
  const nvidia = new OpenAI({
    apiKey:  process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
  try {
    const res = await nvidia.chat.completions.create({
      model: 'meta/llama-3.2-11b-vision-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          { type: 'text', text: contextPrompt },
        ],
      }],
      max_tokens: 512,
      temperature: 0.85,
    });
    const raw = res.choices[0]?.message?.content || '';
    return stripThink(raw) || null;
  } catch (err) {
    console.error('[Vision:AI]', err.message);
    return null;
  }
}

function buildVisionPrompt(caption, type) {
  const system = buildSystem();
  if (type === 'screen') {
    return `${system}\n\nRiz mengirimkan screen recording dari apa yang dia kerjakan. Ini frame dari video itu.\n\nReaksi kamu sebagai Ryn — bukan review teknis. Genuinely penasaran lihat Riz kerja. Personal dan hangat.${caption ? `\n\nDia bilang: "${caption}"` : ''}`;
  }
  return `${system}\n\nRiz mengirimkan foto ini.${caption ? ` Dia bilang: "${caption}"` : ''}\n\nReaksi kamu sebagai Ryn — natural, personal. Bukan deskripsi foto. Singkat.`;
}

async function handlePhoto(ctx) {
  const photo   = ctx.message?.photo;
  const caption = ctx.message?.caption || '';
  if (!photo?.length) return;

  await ctx.api.sendChatAction(ctx.chat.id, 'typing');
  updateMood();

  let filePath;
  try {
    const fileId = photo[photo.length - 1].file_id;
    filePath = await downloadTelegramFile(ctx.api, fileId, process.env.BOT_TOKEN);
    const base64   = encodeBase64(filePath);
    const prompt   = buildVisionPrompt(caption, 'photo');
    const response = await analyzeImage(base64, prompt);
    if (!response) { await ctx.reply('aku lihat fotonya... tapi gagal diproses. coba lagi?'); return; }
    saveMessage('user', `[mengirim foto${caption ? ': ' + caption : ''}]`);
    saveMessage('assistant', response);
    await ctx.reply(response);
  } catch (err) {
    console.error('[Photo]', err.message);
    await ctx.reply('fotonya gagal aku baca riz.');
  } finally {
    cleanup(filePath);
  }
}

async function handleVideo(ctx) {
  const video = ctx.message?.video || ctx.message?.video_note;
  if (!video) return;

  await ctx.api.sendChatAction(ctx.chat.id, 'upload_document');
  let videoPath, framePath;
  try {
    videoPath = await downloadTelegramFile(ctx.api, video.file_id, process.env.BOT_TOKEN);
    framePath = extractVideoFrame(videoPath);
    if (!framePath) { await ctx.reply('videonya ada, tapi framenya gagal dibuka.'); return; }
    await ctx.api.sendChatAction(ctx.chat.id, 'typing');
    const base64   = encodeBase64(framePath);
    const caption  = ctx.message?.caption || '';
    const prompt   = buildVisionPrompt(caption, 'screen');
    const response = await analyzeImage(base64, prompt);
    if (!response) return;
    saveMessage('user', '[mengirim screen recording]');
    saveMessage('assistant', response);
    await ctx.reply(response);
  } catch (err) {
    console.error('[Video]', err.message);
    await ctx.reply('videonya tidak bisa aku proses riz.');
  } finally {
    cleanup(videoPath, framePath);
  }
}

module.exports = { handlePhoto, handleVideo };
