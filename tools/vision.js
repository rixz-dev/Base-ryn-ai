const fs    = require('fs');
const path  = require('path');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const TMP = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function downloadTelegramFile(botApi, fileId, botToken) {
  const file    = await botApi.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
  const res     = await fetch(fileUrl);
  const buffer  = await res.buffer();

  const ext  = path.extname(file.file_path) || '.jpg';
  const dest = path.join(TMP, `vision_${Date.now()}${ext}`);
  fs.writeFileSync(dest, buffer);
  return dest;
}

function extractVideoFrame(videoPath) {
  const framePath = videoPath.replace(/\.\w+$/, '_frame.jpg');
  try {
    execSync(
      `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${framePath}" -y 2>/dev/null`,
      { timeout: 15000 }
    );
    return fs.existsSync(framePath) ? framePath : null;
  } catch {
    return null;
  }
}

function encodeBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

function cleanup(...paths) {
  for (const p of paths) {
    try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  }
}

module.exports = { downloadTelegramFile, extractVideoFrame, encodeBase64, cleanup };
