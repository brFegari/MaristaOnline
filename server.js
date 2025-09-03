/* eslint-disable no-console */
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { scrapeGrades } = require('./src/scraper');
const { computeInsights } = require('./src/compute');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basic rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
});
app.use(limiter);

app.get('/', (req, res) => {
  res.render('index', {
    error: null,
    defaults: {
      targetAvg: '7.0',
      maxScore: '10'
    }
  });
});

app.post('/scrape', async (req, res) => {
  const { email, password, targetAvg, maxScore } = req.body || {};
  if (!email || !password) {
    return res.status(400).render('index', {
      error: 'Informe e‑mail e senha.',
      defaults: { targetAvg: targetAvg || '7.0', maxScore: maxScore || '10' }
    });
  }

  const numericTarget = Number(targetAvg || 7.0);
  const numericMax = Number(maxScore || 10);

  try {
    const { rows, meta, rawHtmlSaved } = await scrapeGrades({ email, password });
    if (!rows || rows.length === 0) {
      return res.status(500).render('index', {
        error: 'Não consegui encontrar as notas. Verifique as credenciais e tente novamente. Você também pode ligar o modo debug em src/config.js para capturar o HTML.',
        defaults: { targetAvg: numericTarget.toString(), maxScore: numericMax.toString() }
      });
    }

    const insights = computeInsights(rows, { targetAvg: numericTarget, maxScore: numericMax });

    res.render('results', {
      meta,
      rows,
      insights,
      params: { targetAvg: numericTarget, maxScore: numericMax },
      rawHtmlSaved
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('index', {
      error: 'Erro ao coletar as notas: ' + (err.message || 'desconhecido'),
      defaults: { targetAvg: numericTarget.toString(), maxScore: numericMax.toString() }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
