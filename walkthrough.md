# Walkthrough - Resend Restaurado e Pronto para Deploy no Railway

Restauramos com sucesso o serviço de e-mail do Resend que havia sido removido anteriormente e integramos os gatilhos de volta nas rotas de pedidos. O projeto está totalmente preparado para compilar e rodar no Railway.

## Alterações Realizadas

### 1. Dependência do Servidor de API (Backend)
- Modificado o arquivo [package.json](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/api-server/package.json) para incluir a dependência `"resend": "^6.12.3"` em `dependencies`.

### 2. Restauração do Serviço de E-mail
- Criado o arquivo [email.ts](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/api-server/src/services/email.ts) para definir os layouts HTML e tipos de e-mails transacionais para:
  - `emailOrderCreatedCliente` (Notificação quando o cliente cria um pedido)
  - `emailOrderCreatedAdmin` (Notificação enviada ao Admin sobre o novo pedido)
  - `emailStatusPagoCliente` & `emailStatusPagoAdmin` (Confirmação de pagamento)
  - `emailStatusEmExecucaoCliente` (Status em processamento)
  - `emailStatusConcluidoCliente` (Status concluído com sucesso)
  - `emailStatusCanceladoCliente` (Status cancelado)
  - `emailComprovativoAdmin` (Notificação ao Admin quando o cliente envia um comprovativo)

### 3. Integração das Chamadas de E-mail
- Modificado o arquivo [orders.ts](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/api-server/src/routes/orders.ts) para disparar as funções de e-mail em segundo plano (fire-and-forget, sem bloquear a resposta HTTP do cliente e tratando erros de forma segura) nos endpoints:
  - Criação de pedido (`POST /orders`).
  - Upload de comprovativo de pagamento (`POST /orders/:id/comprovativo`).
  - Atualização do status do pedido pelo administrador (`PATCH /admin/orders/:id/status`).

---

## Como Fazer Commit e Push das Alterações no Git

Siga as instruções abaixo no seu terminal (PowerShell ou CMD) para salvar as alterações e enviá-las ao seu repositório remoto no GitHub:

1. **Abra o terminal** na pasta raiz do seu projeto (`c:\Users\NovoUsuario\Documents\Projetos\kwanzavisa`).
2. **Verifique o status** dos arquivos modificados para ter certeza das alterações:
   ```bash
   git status
   ```
3. **Adicione todos os arquivos** modificados e criados à área de preparação (staging):
   ```bash
   git add .
   ```
4. **Faça o commit** registrando a mensagem de alteração:
   ```bash
   git commit -m "feat: restaurar servico de email do resend e preparar deploy"
   ```
5. **Envie as alterações (push)** para o repositório remoto no GitHub:
   ```bash
   git push origin main
   ```
   *(Substitua `main` pelo nome da sua branch atual se for diferente).*

---

## Lista de Verificação (Checklist) para Deploy no Railway

Para colocar o site em produção com o domínio `kwanzavisa.com` no Railway:

### Passo 1: Criar um banco de dados PostgreSQL no Railway
1. No dashboard do seu projeto no Railway, clique em **+ New** > **Database** > **Add PostgreSQL**.
2. Vá até as configurações do serviço PostgreSQL criado, acesse a aba **Variables** e copie o valor da variável `DATABASE_URL`.

### Passo 2: Configurar as Variáveis de Ambiente da Aplicação
No serviço da sua aplicação web no Railway (conectado ao repositório do GitHub), acesse a aba **Variables** e adicione as seguintes variáveis:
1. `DATABASE_URL`: A URL do PostgreSQL copiada no Passo 1.
2. `RESEND_API_KEY`: A sua chave de API de produção do Resend.
3. `DASHBOARD_URL`: Configure como `https://kwanzavisa.com/admin/dashboard`.
4. `NODE_ENV`: Configure como `production`.

### Passo 3: Configurar o Domínio Personalizado
1. No serviço do seu aplicativo no Railway, acesse a aba **Settings**.
2. Sob a seção **Domains**, clique em **Custom Domain**.
3. Insira `kwanzavisa.com` (ou `www.kwanzavisa.com`) e clique em **Add**.
4. O Railway exibirá os registros DNS necessários (geralmente do tipo CNAME ou A). Vá até o painel da entidade onde você comprou o seu domínio (GoDaddy, Namecheap, Cloudflare, etc.) e configure esses apontamentos DNS.

### Passo 4: Verificação
Uma vez concluído o build no Railway:
- As dependências serão instaladas e o build do frontend e backend será executado de forma totalmente automatizada.
- Os e-mails do Resend estarão 100% operacionais e as atualizações de status ou de pedidos no banco de dados funcionarão perfeitamente no domínio `kwanzavisa.com`!
