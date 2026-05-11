const fs      = require('fs');
const path    = require('path');
const ffmpeg  = require('fluent-ffmpeg');
const { execSync } = require('child_process');

const TMP = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function ttsEdge(text) {
  try {
    const mp3Path = path.join(TMP, `ryn_${Date.now()}.mp3`);
    // Sanitize text — remove chars that trip up monolingual voices
    const safe = text
      .replace(/[^\x00-\x7F]/g, ' ')  // strip non-ASCII
      .replace(/\s+/g, ' ')
      .trim();

    const input = safe.length > 10 ? safe : text; // fallback ke original kalau terlalu pendek

    execSync(
      `python3 -m edge_tts --voice "en-IE-EmilyNeural" --text "${input.replace(/"/g, "'")}" --write-media "${mp3Path}"`,
      { timeout: 20000 }
    );
    return fs.existsSync(mp3Path) ? mp3Path : null;
  } catch (err) {
    console.error('[TTS:Edge]', err.message);
    return null;
  }
}

async function convertToOgg(mp3Path) {
  return new Promise((resolve, reject) => {
    const oggPath = mp3Path.replace('.mp3', '.ogg');
    ffmpeg(mp3Path)
      .audioCodec('libopus')
      .format('ogg')
      .on('end', () => resolve(oggPath))
      .on('error', reject)
      .save(oggPath);
  });
}

async function generateVoice(text) {
  const trimmed = text.length > 300 ? text.slice(0, 300) + '...' : text;
  const mp3 = await ttsEdge(trimmed);
  if (!mp3) return null;

  try {
    const ogg = await convertToOgg(mp3);
    fs.unlinkSync(mp3);
    return ogg;
  } catch (err) {
    console.error('[Voice:convert]', err.message);
    if (fs.existsSync(mp3)) fs.unlinkSync(mp3);
    return null;
  }
}

function cleanupVoice(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

module.exports = { generateVoice, cleanupVoice };
