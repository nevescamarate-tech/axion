# Axion

Recados por voz para quem anda em obra. É uma app web que se instala no ecrã principal do Android e do iPhone. Tem contas, sincronização entre telemóveis e avisos 30 min antes, 10 min antes e na hora, mesmo com a app fechada.

Endereço (depois do passo 1): **https://nevescamarate-tech.github.io/axion/**

## O que está aqui

| Ficheiro | Para quê |
| --- | --- |
| `index.html` | A app |
| `config.js` | Ligação ao Supabase (preencher no passo 2.6) |
| `manifest.webmanifest`, `icons/` | Nome, ícone e instalação no telemóvel |
| `sw.js` | Funciona sem rede e mostra os avisos |
| `supabase/1-tabelas.sql` | Tabelas e regras de acesso |
| `supabase/functions/send-due/index.ts` | Função que envia os avisos |
| `supabase/3-agendar-avisos.sql` | Corre a função a cada minuto |

Sem o passo 2 a app já funciona, mas só no telemóvel onde foi usada e sem avisos com a app fechada.

## 1. GitHub (já tratado com o Claude)

O código fica no repositório `nevescamarate-tech/axion`. O GitHub Pages publica-o no endereço acima.

## 2. Supabase: contas, sincronização e avisos (cerca de 20 minutos, grátis)

1. Entra em **supabase.com**, cria conta e carrega em **New project**.
   - Nome: `axion`
   - Região: **West EU (Ireland)** ou **Central EU (Frankfurt)**
   - Guarda a password da base de dados num sítio seguro.
2. **SQL Editor › New query**: cola o conteúdo de `supabase/1-tabelas.sql` e carrega em **Run**.
3. **Authentication › URL Configuration**:
   - Site URL: `https://nevescamarate-tech.github.io/axion/`
   - Redirect URLs: acrescenta o mesmo endereço.
4. **Edge Functions › Secrets**: cria os três valores que estão no ficheiro `segredos-axion.txt`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`. Esse ficheiro **não** vai para o GitHub.
5. **Edge Functions › Deploy a new function › Via Editor**:
   - Nome: `send-due`
   - Apaga o exemplo, cola o conteúdo de `supabase/functions/send-due/index.ts` e carrega em **Deploy**.
6. **Project Settings › API**: copia o **Project URL** e a chave **anon public**. Manda-as ao Claude para ele as pôr no `config.js`, ou edita tu o ficheiro no GitHub.
7. **SQL Editor**: abre `supabase/3-agendar-avisos.sql`, troca `O_TEU_PROJETO` e `A_TUA_CHAVE_ANON` pelos teus valores e carrega em **Run**.

## 3. Instalar nos telemóveis

- **Android (Chrome):** abre o endereço, carrega em **Instalar app** (ou no menu ⋮ › Instalar app).
- **iPhone (Safari, iOS 16.4 ou mais recente):** abre o endereço, toca em **Partilhar › Adicionar ao ecrã principal** e abre o Axion pelo ícone.

Depois, em cada telemóvel, vai a **Conta, avisos e cópias de segurança**:

1. Escreve o teu email e carrega em **Enviar link de entrada**.
2. Abre o link do email **nesse telemóvel**.
3. Carrega em **Ativar avisos neste telemóvel** e aceita as notificações.

## Notas

- **Voz:** usa o reconhecimento de voz do próprio telemóvel, em português de Portugal. Se o botão Falar não aparecer, usa o microfone do teclado.
- **Os teus dados:** cada pessoa só vê os seus recados (regras de acesso no passo 2.2). Os dados ficam no servidor Supabase da região escolhida.
- **Plano gratuito do Supabase:** chega para começar. Um projeto sem uso durante 7 dias fica em pausa e reativa-se no painel.
