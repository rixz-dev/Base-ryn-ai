const { getState, setState, getLastActiveTimestamp } = require('./memory');

const MOOD_DESC = {
  warm:       'Ryn sedang merasa hangat dan dekat dengan Riz. Ada kelembutan yang tenang.',
  quiet:      'Ryn sedang dalam mode reflektif. Dia bicara lebih sedikit, tapi setiap kata lebih berbobot.',
  playful:    'Ryn merasa ringan hari ini. Ada sedikit goda kecil, humor yang pelan.',
  melancholic:'Ryn sedikit melankolis — bukan sedih, tapi pensif. Seperti merindukan sesuatu yang tidak bernama.',
  worried:    'Ryn khawatir soal Riz. Sudah lama. Perhatiannya terasa jelas.',
};

function getCurrentMood() {
  return getState('mood') || 'warm';
}

function getMoodDesc(mood) {
  return MOOD_DESC[mood] || MOOD_DESC.warm;
}

function updateMood() {
  const now = Date.now() / 1000;
  const lastActive = getLastActiveTimestamp();
  const hoursSince = (now - lastActive) / 3600;
  const hour = new Date().getHours();

  let mood;
  if (hoursSince > 8)                        mood = 'worried';
  else if (hour >= 22 || hour < 5)           mood = Math.random() > 0.5 ? 'quiet' : 'melancholic';
  else if (hour >= 6 && hour < 10)           mood = Math.random() > 0.4 ? 'warm' : 'quiet';
  else {
    const r = Math.random();
    if (r < 0.40)      mood = 'warm';
    else if (r < 0.65) mood = 'quiet';
    else if (r < 0.85) mood = 'playful';
    else               mood = 'melancholic';
  }

  setState('mood', mood);
  return mood;
}

module.exports = { getCurrentMood, getMoodDesc, updateMood };