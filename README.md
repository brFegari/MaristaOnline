# Maristas Grade Dashboard

Aplicação web (Node + Express + Puppeteer) para:
- Fazer login no portal do aluno (`gvdasa.maristas.org.br`)
- Selecionar a unidade **"8 - SOME: Marista Santo Ângelo"**
- Navegar até a página de **notas/boletim**
- Coletar as notas e montar um **dashboard** com:
  - Piores notas (ordenadas do menor para o maior)
  - Média por disciplina
  - Quanto você precisa tirar **na próxima avaliação** para atingir uma **média alvo** (assumindo pesos iguais)

> **Aviso**: este projeto acessa um portal autenticado. Use somente com suas próprias credenciais e respeite os termos de uso do site. As credenciais **não** são armazenadas no servidor.

## Deploy rápido no Render

1. Faça fork deste repositório no GitHub.
2. No Render, crie um **Web Service** apontando para o fork.
3. Defina as variáveis de ambiente (opcional):
   - `PORT` – porta (Render define automaticamente).
   - `PUPPETEER_EXECUTABLE_PATH` – se usar Chromium do sistema (normalmente não precisa).
   - `HEADLESS=true` – para rodar em modo headless.
4. Build & Start: Render detectará Node e rodará `npm install` e `npm start`.

> Dica: em ambientes restritos, o Puppeteer pode precisar da flag `--no-sandbox`. Já está configurado por padrão no código.

## Rodando localmente

```bash
npm install
npm start
# abra http://localhost:3000
```

## Como funciona

- A rota `GET /` mostra um formulário para **e‑mail**, **senha**, **média alvo** (padrão 7.0) e **pontuação máxima** (padrão 10).
- Ao enviar, `POST /scrape` usa o **Puppeteer** para:
  1. Abrir o portal de login
  2. Autenticar
  3. Selecionar a unidade *"8 - SOME: Marista Santo Ângelo"*
  4. Encontrar a página de **Notas/Boletim** (links com textos como “Notas”, “Boletim”, “Avaliações”)
  5. Extrair a tabela de notas

- O servidor transforma os dados e rende o dashboard.

## Ajustando seletores (caso o portal mude)

Veja o arquivo [`src/config.js`](src/config.js). Lá você pode:
- Ajustar **URLs**, **textos** e **seletores** prováveis dos elementos usados no login e navegação.
- Ligar o **modo debug** para salvar HTMLs intermediários em `tmp/`.

## Segurança

- As credenciais **não são salvas**. São usadas somente durante a sessão de scraping.
- Rate-limit e Helmet estão habilitados.
- Não suba seu `.env` (está ignorado).

## Licença

MIT
