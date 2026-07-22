# Frota — app de gestão de veículos e tarefas

App feito sob medida com base na estrutura que você descreveu: colaboradores
fazem login, marcam tarefas do dia, retiram veículos (com km inicial/final) e
fazem o checklist semanal. O administrador tem um painel separado para
gerenciar tudo.

Tecnologia: **React** (código real, seu, sem trava de créditos) + **Firebase**
(login e banco de dados, plano gratuito).

---

## Passo 1 — Criar o projeto no Firebase (grátis)

1. Acesse **https://console.firebase.google.com**
2. Clique em **Adicionar projeto**, dê um nome (ex: `frota-fazz`) e siga os passos (pode desativar o Google Analytics, não é necessário).
3. Dentro do projeto, no menu lateral, clique no ícone **</>** (Web) para registrar um app da web. Dê um apelido (ex: `frota-web`) e clique em **Registrar app**.
4. O Firebase vai mostrar um bloco `firebaseConfig` com várias chaves (`apiKey`, `authDomain`, etc). **Copie esses valores.**

## Passo 2 — Colar as chaves no projeto

Abra o arquivo `src/firebase.js` e substitua os valores `"COLE_AQUI"` pelos
valores que você copiou no passo anterior.

## Passo 3 — Ativar login (Authentication)

1. No menu lateral do Firebase, vá em **Build → Authentication → Get started**.
2. Na aba **Sign-in method**, ative:
   - **Google** (clique, ative, selecione um e-mail de suporte, salve)
   - **E-mail/senha** (clique, ative, salve)

## Passo 4 — Criar o banco de dados (Firestore)

1. No menu lateral, vá em **Build → Firestore Database → Create database**.
2. Escolha a localização mais próxima (ex: `southamerica-east1` para o Brasil).
3. Comece em **modo de produção** (as regras de segurança já estão prontas no arquivo `firestore.rules` deste projeto — veja o Passo 7).

## Passo 5 — Instalar e rodar localmente (opcional, pra testar antes)

Você vai precisar do [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
npm install
npm run dev
```

Isso abre o app em `http://localhost:5173`. O **primeiro** e-mail que fizer
login vira automaticamente **administrador**. Todos os próximos logins viram
colaboradores comuns. Se quiser trocar quem é admin depois, você pode editar
manualmente o documento em `Firestore → users → (uid da pessoa) → role`.

Ao entrar como admin pela primeira vez, vá em **Colaboradores** ou
**Config. veículos** — vai aparecer um botão **"Carregar dados iniciais"**
que já cadastra os nomes e veículos que você me passou.

## Passo 6 — Publicar de graça (hospedagem)

A forma mais simples é o **Firebase Hosting**, que é gratuito e já é do mesmo
lugar onde está seu banco de dados.

```bash
npm install -g firebase-tools
firebase login
npm run build
firebase init hosting
```

No `firebase init`, responda:
- "What do you want to use as your public directory?" → `dist`
- "Configure as a single-page app?" → `Yes`
- "Set up automatic builds with GitHub?" → `No` (a não ser que você queira)

Depois, sempre que quiser publicar uma atualização:

```bash
npm run build
firebase deploy
```

Ele vai te dar um link tipo `https://frota-fazz.web.app` — esse é o seu site,
de graça, sem limite de créditos.

## Passo 7 — Aplicar as regras de segurança

No console do Firebase, vá em **Firestore Database → Regras**, apague o que
tiver lá e cole o conteúdo do arquivo `firestore.rules` deste projeto. Clique
em **Publicar**.

---

## Como o app funciona (resumo)

- **Login**: Google ou e-mail/senha.
- **Primeiro acesso de um colaborador**: escolhe seu nome numa lista — depois
  disso o nome fica vinculado ao login dele e some da lista pra outras pessoas.
- **Tarefas do dia**: mostra as tarefas que o admin atribuiu para aquela
  pessoa naquele dia, com botão de concluir.
- **Veículos**: lista todos, com status disponível/em uso. Ao selecionar um
  disponível, ele fica reservado, pede km inicial → km final → volta a ficar
  disponível. Dá pra navegar entre as abas no meio do processo sem perder o
  progresso.
- **Checklist**: mostra todos os veículos e se o checklist da semana já foi
  feito ou está pendente. Ao abrir um pendente, mostra as tarefas daquele
  tipo de veículo (moto/carro/caminhão) pra marcar.
- **Painel admin**: status dos veículos, colaboradores (histórico +
  gerenciar), KM por veículo, atribuição de tarefas + histórico por período,
  gerenciar os modelos de checklist e ver os realizados, e cadastro de
  veículos.

## Personalização

- Cores e fontes: `src/index.css` (identidade preto/laranja/rosa baseada na
  sua logo).
- Para trocar a logo, adicione o arquivo de imagem em `public/` e referencie
  no lugar que quiser (ex: tela de login em `src/screens/Login.jsx`).

## Dúvidas comuns

- **"Missing or insufficient permissions"**: as regras do Firestore (Passo 7)
  ainda não foram publicadas, ou você não fez login.
- **Login com Google não abre popup**: alguns navegadores bloqueiam popups —
  permita popups para o seu domínio.
- **Quero adicionar outro administrador**: no Firestore, crie/edite o
  documento em `users/{uid da pessoa}` com `{ role: "admin", colaboradorId: null }`.
  Você encontra o `uid` em **Authentication → Users**.
