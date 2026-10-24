# masmorras-do-davi

Memória fixa do projeto. É lida no início de toda sessão do Claude.

## ⚠️ PREMISSA Nº 1 — SEGURANÇA E LGPD (Rodrigo, 24/10/2026 — vale para TODOS os projetos)

**Segurança e proteção de dados vêm antes de tudo:** antes de prazo, de facilidade e de funcionalidade nova.
Meta: **brecha zero** — nenhuma abertura para invasão, acesso indevido ao banco, vazamento ou uso indevido de dados.

**LGPD (Lei 13.709/2018):**
- Dado pessoal (nome, CPF, RG, telefone, e-mail, assinatura, foto de pessoa, localização, dado de funcionário ou cliente):
  coletar só o **mínimo necessário**, usar só para a **finalidade** do sistema, acesso **por perfil**.
- Nunca expor dado pessoal em link público, log, mensagem de erro, e-mail, planilha ou arquivo sem necessidade.
- Dados da Orguel pertencem à Orguel: nada sai para uso pessoal, outro projeto ou serviço de terceiro sem autorização.
- Guardar só pelo tempo necessário; registrar quem acessou/alterou o que for sensível.

**Checklist obrigatório antes de entregar qualquer coisa (código, banco, função, página, e-mail):**
1. **Banco:** RLS ligada em toda tabela; política por perfil (nunca "logado = acesso total"); função privilegiada
   (SECURITY DEFINER) com `search_path` fixo e **sem execução para `anon`/`public`** quando não precisa.
2. **Funções de servidor / APIs:** exigem login ou segredo. A chave pública do app **não** é autenticação.
   Rotina automática chama com **segredo guardado no cofre**. Função pública (link de e-mail) só com **token de uso único,
   com prazo**, e devolvendo o mínimo.
3. **Nada de fora é confiável** (e-mail, anexo, formulário, PDF, planilha, resposta de IA): conferir remetente
   (SPF/DKIM/DMARC), **tipo real e tamanho** do arquivo, limpar/escapar texto antes de montar HTML ou SQL.
4. **Segredos** (senhas, tokens, chaves de API) só no cofre/secrets — **nunca** no código, no repositório, no chat ou em log.
5. **Arquivos** em armazenamento privado, abertos só por link assinado com prazo.
6. **Mínimo privilégio** em tudo; apagar função, rota, chave e conta que não são mais usadas.
7. **Não supor:** conferir no código e no banco antes de dizer que está seguro. Achou brecha → avisar o Rodrigo **na hora**,
   com a gravidade e a correção proposta.
8. Qualquer mudança que **reduza** segurança ou amplie acesso a dado pessoal só com **OK explícito do Rodrigo**.

