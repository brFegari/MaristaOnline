module.exports = {
  baseUrl: 'https://gvdasa.maristas.org.br/apsweb/modulos/aluno/login.php5?',
  unitText: '8 - SOME: Marista Santo Ângelo',
  debugSaveHtml: false,

  selectors: {
    email: [
      'input[type=text]',
      'input[type=email]',
      'input[name*=email i]',
      'input[name*=matric i]',
      'input#login',
      'input#usuario'
    ],
    password: 'input[type=password], input[name*=senha i], input#senha',
    submit: 'button[type=submit], input[type=submit], button[id*=entrar i], button',

    // Aqui estavam dando erro porque estavam soltos!
    unitSelect: 'select, #unidade, [name*=unidade i]',
    unitClickableText: '8 - SOME: Marista Santo Ângelo',

    gradesLinkTexts: ['Notas', 'Boletim', 'Avaliações', 'Desempenho', 'Notas Finais'],
    gradesTable: 'table, .table, #tabelaNotas'
  },

  timeouts: {
    nav: 20000
  },

  chromiumFlags: ['--no-sandbox', '--disable-setuid-sandbox']
};
