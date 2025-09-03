function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const m = String(v).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function pickSubject(record) {
  const key = Object.keys(record).find(k => /disciplina|mat[ée]ria/i.test(k)) || 'Disciplina';
  return record[key] || '—';
}

function pickAssessment(record) {
  const key = Object.keys(record).find(k => /avalia[cç][aã]o|etapa|bimestre|prova/i.test(k)) || 'Avaliação';
  return record[key] || '—';
}

function pickGrade(record) {
  const key = Object.keys(record).find(k => /nota|m[eé]dia/i.test(k));
  return key ? toNumber(record[key]) : null;
}

function groupBy(arr, fn) {
  return arr.reduce((acc, item) => {
    const k = fn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

function computeInsights(rows, { targetAvg = 7, maxScore = 10 } = {}) {
  // Normaliza
  const normalized = rows.map(r => ({
    subject: pickSubject(r),
    assessment: pickAssessment(r),
    grade: pickGrade(r),
    raw: r
  })).filter(x => x.grade != null);

  // Piores notas
  const worst = [...normalized].sort((a,b) => a.grade - b.grade);

  // Médias por disciplina
  const bySubject = groupBy(normalized, r => r.subject);
  const subjects = Object.entries(bySubject).map(([subject, items]) => {
    const grades = items.map(i => i.grade);
    const avg = grades.reduce((a,b)=>a+b,0) / grades.length;
    // Nota necessária na próxima avaliação (assumindo mais 1 avaliação com peso igual)
    const n = grades.length;
    const needed = targetAvg * (n + 1) - grades.reduce((a,b)=>a+b,0);
    const neededClamped = Math.max(0, Math.min(maxScore, Number.isFinite(needed) ? needed : 0));
    return {
      subject,
      count: n,
      average: Number(avg.toFixed(2)),
      neededNextToReachTarget: Number(neededClamped.toFixed(2))
    };
  }).sort((a,b) => a.average - b.average);

  return { worst, subjects };
}

module.exports = { computeInsights };
