# Walkthrough - Resend, Railway Fix, Renomeação de Serviço e Novas Páginas (FAQ & Termos)

Hoje implementámos e corrigimos com sucesso todas as tarefas planeadas para a plataforma KwanzaVisa. O código já foi compilado, verificado localmente via TypeScript compiler (`tsc`) sem erros, e enviado para o GitHub para deploy automático no Railway.

---

## Alterações Realizadas

### 1. Correção de Inicialização no Railway
- **Arquivo Modificado:** [railway.json](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/railway.json)
- **O que mudou:** Alterámos a instrução de deploy `startCommand`. O separador `&&` foi substituído por `;`. Isso garante que o servidor principal Node.js inicie mesmo se o comando de migração/sincronização do banco de dados (`drizzle-kit push`) falhar ou avisar que não há alterações estruturais a aplicar. Desta forma, a plataforma evita cair em estado de erro (retornando 404).

### 2. Configuração de Email de Produção (Resend)
- **Arquivo Modificado:** [email.ts](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/api-server/src/services/email.ts)
- **O que mudou:** Atualizámos a constante de envio `FROM` de `"KwanzaVisa <onboarding@resend.dev>"` para `"KwanzaVisa <noreply@kwanzavisa.com>"`.
- **Importante:** Para que os emails comecem a chegar ao destinatário a partir deste endereço, é essencial garantir que o domínio `kwanzavisa.com` está marcado como **"Verified"** no painel da sua conta do [Resend](https://resend.com/domains). Os registos DNS correspondentes (`resend._domainkey`) já estão ativos no Cloudflare.

### 3. Alteração do Nome de Serviço
- **Arquivos Modificados:**
  - [Home.tsx](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/kwanzavisa/src/pages/Home.tsx) (no formulário de submissão, no mapeamento de rótulos dos serviços e nos depoimentos)
  - [email.ts](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/api-server/src/services/email.ts) (nos rótulos que acompanham as notificações enviadas por e-mail)
- **O que mudou:** O serviço anteriormente designado por **"Transferência Internacional"** agora chama-se **"Auxilio para Envio de Remessas"** em toda a interface do utilizador, notificações e logs do sistema.

### 4. Página Pública de Ajuda & FAQ
- **Arquivo Criado:** [FAQ.tsx](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/kwanzavisa/src/pages/FAQ.tsx)
- **O que contém:** Uma secção dividida por categorias ("Como Funciona", "Serviços", "Pagamentos", "Segurança") com perguntas sanadas através de elementos acordeão (`Accordion`) e botões de contacto direto para suporte via WhatsApp ou Email.
- **Rota:** Disponível sob o caminho `/ajuda`.

### 5. Página Pública de Termos de Uso
- **Arquivo Criado:** [Termos.tsx](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/kwanzavisa/src/pages/Termos.tsx)
- **O que contém:** Declarações legais de acordo com a legislação angolana e as especificidades dos serviços oferecidos pela KwanzaVisa, detalhando as regras de pagamento, cancelamento, política de reembolso e privacidade.
- **Rota:** Disponível sob o caminho `/termos`.

### 6. Integração das Rotas e Menus
- **Arquivo Modificado:** [App.tsx](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/kwanzavisa/src/App.tsx)
  - Adicionadas as rotas do `/ajuda` e `/termos`.
- **Links adicionados em:** [Home.tsx](file:///c:/Users/NovoUsuario/Documents/Projetos/kwanzavisa/artifacts/kwanzavisa/src/pages/Home.tsx)
  - Menu superior de navegação para a secção de Ajuda.
  - Menu mobile com ligação à Ajuda.
  - Links detalhados no rodapé (Footer) para as páginas de **Ajuda & FAQ** e **Termos de Uso**.
  - O ano no aviso de direitos autorais foi atualizado para **2026**.

---

## Verificação e Próximos Passos

### 🛠️ Monitorização do Build no Railway
1. Aceda ao dashboard do Railway.
2. Acompanhe a compilação do último commit (`feat: adicionar ajuda/faq, termos de uso, corrigir startup do railway e atualizar nome do servico`).
3. Uma vez concluído, verifique se a API responde corretamente ao aceder a `https://kwanzavisa.com/api/healthz`.

### 📧 Validação de Emails
Submeta um novo pedido simulado na plataforma usando um email seu de teste e confirme se a mensagem de confirmação de encomenda é entregue com sucesso vinda de `noreply@kwanzavisa.com`.
