const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const config = require('./config');

async function maybeSave(page, name) {
  if (!config.debugSaveHtml) return null;
  const html = await page.content();
  const dir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, html, 'utf-8');
  return file;
}

function normalizeText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function parseNumber(str) {
  if (str == null) return null;
  const m = String(str).replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

async function clickByText(page, texts) {
  const list = Array.isArray(texts) ? texts : [texts];
  for (const t of list) {
    const handle = await page.$x(`//*[contains(normalize-space(text()), "${t}")]`);
    if (handle && handle.length) {
      await handle[0].click();
      return true;
    }
  }
  return false;
}

async function waitForAny(page, selectors, timeout) {
  const selList = Array.isArray(selectors) ? selectors : [selectors];
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const sel of selList) {
      const exists = await page.$(sel);
      if (exists) return sel;
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Nenhum seletor encontrado a tempo: ' + selList.join(', '));
}

async function selectUnit(page) {
  // Tenta <select>
  const sel = await page.$(config.selectors.unitSelect);
  if (sel) {
    const options = await page.$$eval(config.selectors.unitSelect + ' option', opts =>
      opts.map(o => ({ value: o.value, text: (o.textContent || '').trim() }))
    );
    const match = options.find(o => (o.text || '').includes('8 - SOME: Marista Santo Ângelo'));
    if (match) {
      await page.select(config.selectors.unitSelect, match.value);
      await page.keyboard.press('Enter').catch(()=>{});
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: config.timeouts.nav }).catch(()=>{});
      return true;
    }
  }
  // Tenta clique por texto
  const ok = await clickByText(page, config.selectors.unitClickableText);
  if (ok) {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: config.timeouts.nav }).catch(()=>{});
    return true;
  }
  return false;
}

async function findGradesPage(page) {
  // Tenta clicar em links com textos conhecidos
  const ok = await clickByText(page, config.selectors.gradesLinkTexts);
  if (ok) {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: config.timeouts.nav }).catch(()=>{});
    return true;
  }
  return false;
}

async function extractTable(page) {
  // Procura a primeira tabela "boletim" plausível
  const rows = await page.$$eval(config.selectors.gradesTable, (tables) => {
    function norm(s){ return (s||'').replace(/\s+/g,' ').trim(); }
    const out = [];
    for (const t of tables) {
      const trs = Array.from(t.querySelectorAll('tr'));
      if (trs.length < 2) continue;
      const headers = Array.from(trs[0].querySelectorAll('th,td')).map(th => norm(th.textContent));
      // Ignora tabelas muito genéricas
      if (headers.filter(h => /disciplina|mat[eé]ria|nota|avalia[cç][aã]o|m[eé]dia/i.test(h)).length < 2) continue;

      for (let i=1;i<trs.length;i++){
        const tds = Array.from(trs[i].querySelectorAll('td')).map(td => norm(td.textContent));
        if (!tds.length) continue;
        out.push({ headers, tds });
      }
      if (out.length) break;
    }
    return out;
  });

  return rows.map(r => {
    const record = {};
    r.headers.forEach((h, idx) => {
      record[h || ('col'+idx)] = r.tds[idx] || '';
    });
    return record;
  });
}

async function scrapeGrades({ email, password }) {
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: config.chromiumFlags
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(config.timeouts.nav);

  try {
    await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
    await maybeSave(page, '01-login.html');

    // Preenche login
    const emailSel = await waitForAny(page, config.selectors.email, config.timeouts.nav);
    await page.type(emailSel, email, { delay: 15 });
    const passSel = await waitForAny(page, config.selectors.password, config.timeouts.nav);
    await page.type(passSel, password, { delay: 15 });

    // Envia
    const submit = await page.$(config.selectors.submit);
    if (submit) {
      await submit.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: config.timeouts.nav }).catch(()=>{});
    await maybeSave(page, '02-after-login.html');

    // Seleciona unidade
    await selectUnit(page);
    await maybeSave(page, '03-after-unit.html');

    // Vai até notas
    await findGradesPage(page);
    await maybeSave(page, '04-grades-page.html');

    // Extrai tabela
    const tableRows = await extractTable(page);
    await maybeSave(page, '05-extract-debug.json');

    const meta = {
      fetchedAt: new Date().toISOString(),
      url: page.url()
    };

    await browser.close();
    return { rows: tableRows, meta, rawHtmlSaved: !!config.debugSaveHtml };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = { scrapeGrades };
