const { getState, setState, getAllFacts, setFact } = require('./memory');

// Simpan tanggal penting
function saveDate(label, dateStr) {
  // Format: "dd-mm" atau "dd-mm-yyyy"
  setFact(`date_${label.toLowerCase().replace(/\s+/g, '_')}`, `${label}||${dateStr}`);
}

// Ambil semua tanggal penting
function getImportantDates() {
  const facts = getAllFacts();
  return facts
    .filter(f => f.key.startsWith('date_'))
    .map(f => {
      const [label, dateStr] = f.value.split('||');
      return { label, dateStr, key: f.key };
    });
}

// Cek apakah hari ini atau besok ada tanggal penting
function checkUpcomingDates() {
  const dates = getImportantDates();
  const now   = new Date();
  const upcoming = [];

  for (const d of dates) {
    const parts = d.dateStr.split('-');
    if (parts.length < 2) continue;

    const day   = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    const thisYear = new Date(now.getFullYear(), month - 1, day);
    const diffDays = Math.round((thisYear - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 0)  upcoming.push({ ...d, when: 'today' });
    if (diffDays === 1)  upcoming.push({ ...d, when: 'tomorrow' });
    if (diffDays === 7)  upcoming.push({ ...d, when: 'week' });
  }

  return upcoming;
}

// Extract tanggal dari teks natural
function extractDateFromText(text) {
  // Format: "tanggal 15 mei", "15 mei", "15/05", "15-05"
  const months = {
    januari:1, februari:2, maret:3, april:4, mei:5, juni:6,
    juli:7, agustus:8, september:9, oktober:10, november:11, desember:12,
    january:1, february:2, march:3, april:4, may:5, june:6,
    july:7, august:8, september:9, october:10, november:11, december:12,
  };

  // "15 mei" atau "tanggal 15 mei"
  const match1 = text.match(/(?:tanggal\s+)?(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|april|may|june|july|august|september|october|november|december)/i);
  if (match1) {
    const day   = match1[1].padStart(2, '0');
    const month = String(months[match1[2].toLowerCase()]).padStart(2, '0');
    return `${day}-${month}`;
  }

  // "15/05" atau "15-05"
  const match2 = text.match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (match2) {
    return `${match2[1].padStart(2,'0')}-${match2[2].padStart(2,'0')}`;
  }

  return null;
}

// Extract label dari konteks kalimat
function extractDateLabel(text) {
  const t = text.toLowerCase();
  if (t.includes('ulang tahun') || t.includes('birthday')) return 'ulang tahun riz';
  if (t.includes('anniversary'))                             return 'anniversary';
  if (t.includes('wisuda'))                                  return 'wisuda';
  if (t.includes('interview') || t.includes('interview'))   return 'interview';
  if (t.includes('deadline'))                                return 'deadline';
  if (t.includes('ujian') || t.includes('exam'))            return 'ujian';
  // Generic — ambil konteks sebelum tanggal
  const match = text.match(/(.{3,30}?)\s+(?:tanggal|\d{1,2}\s+(?:januari|februari|maret))/i);
  if (match) return match[1].trim().slice(0, 30);
  return 'momen penting';
}

module.exports = { saveDate, getImportantDates, checkUpcomingDates, extractDateFromText, extractDateLabel };
