# Axion

Recados por voz para quem anda em obra. É uma app web que se instala no ecrã principal do Android e do iPhone. Tem contas, sincronização entre telemóveis e avisos 30 min antes, 10 min antes e na hora, mesmo com a app fechada.

Endereço (depois do passo 1): **https://nevescamarate-tech.github.io/axion/**

## O que está aqui

| Ficheiro | Para quê |
| --- | --- |
| `index.html` | A app |
| `config.js` | Ligação ao Supabase e PINs de acesso |
| `manifest.webmanifest`, `icons/` | Nome, ícone e instalação no telemóvel |
| `sw.js` | Funciona sem rede e mostra os avisos |
| `supabase/1-tabelas.sql` | Tabelas e regras de acesso |
| `supabase/functions/send-due/index.ts` | Função que envia os avisos |
| `supabase/3-agendar-avisos.sql` | Corre a função a cada minuto |

Sem o passo 2 a app já funciona, mas só no telemóvel onde foi usada e sem avisos com a app fechada.

## 1. GitHub (já tratado com o Claude)

O código fica no repositório `nevescamarate-tech/axion`. O GitHub Pages publica-o no endereço acima.

## 2. Supabase: contas, sincronização e avisos (feito)

- Organização **NBT Software**, projeto `lxoeuyrlbopqatsqaprz`, região Europa, plano grátis.
- Tabelas e regras de acesso: `supabase/1-tabelas.sql`.
- Função `send-due` publicada, sem verificação JWT. Gera sozinha as chaves dos avisos e guarda-as na tabela `app_keys`, que só o servidor lê. Nenhum segredo fica no GitHub.
- Agendamento a cada minuto: `supabase/3-agendar-avisos.sql`.
- Entrada por email: Site URL e Redirect URL apontam para o endereço da app.
- O plano grátis só envia poucos emails de entrada por hora. Antes de abrir a muita gente, ligar um serviço de envio de emails (Authentication › Emails › SMTP).

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
