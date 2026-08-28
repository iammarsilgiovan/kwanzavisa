# Regras do Projeto KwanzaVisa

## Git — Push Automático após Cada Alteração

Sempre que fizeres qualquer alteração ao código-fonte deste projecto, deves:

1. Fazer `git add` dos ficheiros modificados
2. Fazer `git commit` com uma mensagem descritiva em português
3. Fazer `git push origin main`

Usa sempre o directório raiz do projecto: `c:\Users\NovoUsuario\Documents\Projetos\kwanzavisa`

Formato do comando no PowerShell (não usar `&&`):
```powershell
git -C "c:\Users\NovoUsuario\Documents\Projetos\kwanzavisa" add .
git -C "c:\Users\NovoUsuario\Documents\Projetos\kwanzavisa" commit -m "descrição da alteração"
git -C "c:\Users\NovoUsuario\Documents\Projetos\kwanzavisa" push origin main
```

> IMPORTANTE: Em PowerShell não usar `&&` para encadear comandos. Executar cada `git` separadamente ou usar `;`.
