module.exports = {
  baseUrl: 'https://gvdasa.maristas.org.br/apsweb/modulos/aluno/login.php5?',
  unitText: '8 - SOME: Marista Santo Ângelo',
  // Ative para salvar HTML das páginas em tmp/ (útil para ajustar seletores)
  debugSaveHtml: false,

  selectors: {
    email: 'input[type=email], input[name*=email i], input#email',
    password: 'input[type=password], input[name*=senha i], input#senha',
    submit: 'button[type=submit], input[type=submit], button[id*=entrar i], button:has(> span:contains("Entrar"))',

    // Após login, pode haver um select/lista de unidades
    unitSelect: 'select, #unidade, [name*=unidade i]',
    // Caso a unidade seja mostrada como botoes/cartões, buscamos por esse texto
    unitClickableText: '8 - SOME: Marista Santo Ângelo',

    // Links prováveis para boletim/notas
    gradesLinkTexts: [
      'Notas', 'Boletim', 'Avaliações', 'Desempenho', 'Notas Finais'
    ],

    // Tabela de notas: heurísticas comuns
    gradesTable: 'table, .table, #tabelaNotas',
  },

  // Tempo padrão de espera
  timeouts: {
    nav: 20000 // 20s
  },

  // Chromium flags
  chromiumFlags: ['--no-sandbox', '--disable-setuid-sandbox']
};
