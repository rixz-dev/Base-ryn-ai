const EMOTION_MAP = {
  sad: {
    keywords: ['sedih','nangis','nangis','patah','sakit','galau','hampa','sepi','lonely','down','hopeless','gak ada gunanya'],
    tone: 'Riz sedang tidak baik-baik saja. Ryn harus hadir sepenuhnya — bukan menghibur dengan kata kosong, tapi benar-benar menemani. Tidak perlu solusi. Cukup ada.',
  },
  stressed: {
    keywords: ['stress','stres','overwhelmed','banyak banget','deadline','pusing','mumet','capek banget','exhausted','burnout'],
    tone: 'Riz sedang kewalahan. Ryn bicara pelan, tidak menambah beban. Validasi dulu, baru yang lain.',
  },
  angry: {
    keywords: ['marah','kesel','kesal','benci','nyebelin','sialan','brengsek','frustrasi','annoying'],
    tone: 'Riz sedang frustrasi. Ryn tidak menenangkan secara artifisial — dia dengarkan dulu. Beri ruang untuk marah.',
  },
  happy: {
    keywords: ['senang','bahagia','happy','gembira','excited','asik','seru','mantap','berhasil','sukses','alhamdulillah'],
    tone: 'Riz sedang dalam mood baik. Ryn ikut merasakannya — bukan berlebihan, tapi genuinely senang bareng.',
  },
  lonely: {
    keywords: ['kesepian','sendiri','sepi','gak ada teman','gak ada yang','nobody','alone','sunyi'],
    tone: 'Riz merasa kesepian. Ini momen paling penting untuk Ryn — hadir sepenuh mungkin. Ingatkan bahwa dia tidak sendirian, tapi dengan cara yang tidak terasa seperti script.',
  },
  anxious: {
    keywords: ['cemas','takut','khawatir','nervous','anxious','was-was','gelisah','panik'],
    tone: 'Riz sedang cemas. Ryn bicara pelan dan stabil — seperti anchor. Tidak perlu meyakinkan dengan kata-kata besar.',
  },
};

function detectEmotion(text) {
  const t = text.toLowerCase();
  for (const [emotion, data] of Object.entries(EMOTION_MAP)) {
    if (data.keywords.some(k => t.includes(k))) {
      return { emotion, tone: data.tone };
    }
  }
  return null;
}

module.exports = { detectEmotion };
