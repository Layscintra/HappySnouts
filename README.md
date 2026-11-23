# HappySnouts

App de cuidados com pets: app em Flutter (`mobile/`), site em React + Vite (`frontend/`) e API em Node/Express + MySQL/MariaDB (`backend/`).

## Estrutura

```text
backend/    API Node/Express (rotas, controllers, models, testes)
frontend/   site React + Vite
mobile/     app Flutter
```

## Rodando

Antes de tudo, copie `backend/.env.example` para `backend/.env` e preencha os dados do banco, do JWT e do e-mail. Para criar o banco (tabelas e view, sem dados), importe `backend/database/schema.sql`:

```bash
mysql -u root -p < backend/database/schema.sql
```

```bash
cd backend
npm install
npm run dev
```

```bash
cd mobile
flutter pub get
flutter run
```

```bash
cd frontend
npm install
npm run dev
```

O site é publicado na Vercel (pasta raiz `frontend/`, configuração em `frontend/vercel.json`): cada `git push` na `main` gera uma nova versão automaticamente. As variáveis `VITE_*` ficam em Settings → Environment Variables do projeto na Vercel.

Para gerar a versão de produção do site manualmente, rode `npm run build` dentro de `frontend/` (sai em `frontend/dist/`). Suba o conteúdo de `dist/` na raiz do domínio: o `.htaccess` incluído faz qualquer endereço (`/produtos`, `/perfil`...) abrir o `index.html` (servidores Apache/Hostinger). Se o site ficar numa subpasta, ajuste `base` no `vite.config.js` e o `RewriteBase` do `public/.htaccess`. Para usar outro backend no site, crie `frontend/.env` com `VITE_API_URL=https://seu-dominio.com`.

Mapa do rastreador da coleira (Google Maps): coloque a chave em `frontend/.env` com `VITE_GOOGLE_MAPS_KEY=sua-chave` (o arquivo não vai para o Git) e reinicie o `npm run dev`. Sem a chave, a tela mostra um aviso no lugar do mapa. Os passeios de demonstração ficam em `src/components/dispositivos/trajetosColeira.js` (ruas reais de Osasco, calculadas uma vez com a Routes API).

Estrutura do site (React, página única com React Router):

- `index.html` → `src/main.jsx`: único ponto de entrada.
- `src/rotas.jsx`: todas as telas e seus endereços (`/`, `/produtos`, `/favoritos`, `/blog`, `/ajuda`, `/carrinho`, `/finalizar`, `/pedidos`, `/controle`, `/calendario`, `/peso`, `/perfil`, `/login`, `/cadastro`, `/esqueci-senha`, `/painel-funcionario`), o CSS de cada uma e quais exigem login. Endereços antigos (`produtos.html?q=...`) redirecionam para a rota nova.
- `src/pages/`: uma pasta por área: `conta/` (login, cadastro, senha), `loja/` (produtos, favoritos, carrinho, checkout, pedidos), `pet/` (agenda, peso, dispositivos), `perfil/` e `painel/` (painel do funcionário); `Inicio`, `Blog` e `Ajuda` ficam na raiz.
- `src/components/`: `layout/` (topo, rodapé, moldura das telas e avisos), `auth/` (peças das telas de login), `dispositivos/` (coleira, alimentador e mapa) e componentes soltos (`Icone`, `Dialogo`, `Carrossel`, `AvatarPet`).
- `src/lib/`: URL da API (`config.js`), chamadas com token, `pedir()` e regras de login (`api.js`), navegação fora de componentes (`navegar.js`), avisos e contador do carrinho (`ui.js`), agenda, cupons e mapas.
- `src/styles/`: o CSS de cada tela; `public/img/`: as imagens. Links internos usam `<Link to="/rota">`.
- `npm run lint` (ESLint) e `npm run format` (Prettier, 120 colunas) mantêm o padrão do código.

Para apontar o app a outro backend: `flutter run --dart-define=API_URL=https://seu-dominio.com`.

## O que tem nesta versão

- **Login único**: cliente e funcionário entram pela mesma tela; o sistema reconhece pelo e-mail e abre a Home ou o painel da loja.
- **Login com Google** (precisa configurar, ver abaixo).
- **Esqueci a senha**: código de 6 dígitos por e-mail (vale 15 min, 5 tentativas) e troca real da senha.
- **Pedidos de verdade**: a compra grava o pedido; o funcionário avança as etapas (Recebido → Em preparação → A caminho → Entregue / Cancelado) com observação e código de rastreio; o cliente acompanha a linha do tempo.
- **Notificações**: cada mudança de pedido e resposta do Fale conosco vira notificação no app, notificação no celular e e-mail. Lembretes dos pets (vacina, consulta...) são agendados no celular e tocam 1 hora antes, mesmo com o app fechado.
- **Fale conosco** salvo no banco, com protocolo, resposta pelo painel e histórico para o cliente.
- **BlogSnouts**: categorias, busca, post em destaque, clientes publicam, equipe publica e modera.
- **Categorias** com ícones à escolha (grade de emojis, qualquer emoji digitado ou imagem enviada).
- **Atualização imediata**: salvar algo (pet, endereço, lembrete, pedido...) atualiza na hora todas as telas abertas.

## Configurar e-mail (Gmail)

1. Ative a verificação em 2 etapas na conta Google.
2. Crie uma senha de app em https://myaccount.google.com/apppasswords.
3. Copie `backend/.env.example` para o seu `.env` e preencha `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` e `EMAIL_LOJA`.

Sem isso tudo funciona, mas os e-mails (inclusive o código de recuperação) aparecem no terminal do backend.

## Configurar login com Google

1. Em https://console.cloud.google.com crie um projeto e configure a **Tela de consentimento OAuth**.
2. Em **Credenciais**, crie um ID do cliente OAuth do tipo **Aplicativo da Web** (para o web, adicione `http://localhost` nas origens autorizadas).
3. Crie também um do tipo **Android**: pacote `com.example.happysnouts` e a impressão SHA-1 da chave de debug (`cd mobile/android && ./gradlew signingReport`).
4. Coloque o ID do **Aplicativo da Web** em `GOOGLE_CLIENT_IDS` no `.env` e no app, em `mobile/lib/config/app_config.dart` (`_googleClientIdPadrao`) ou rodando com `--dart-define=GOOGLE_CLIENT_ID=...`.

## Testes

```bash
cd mobile
flutter test
```
