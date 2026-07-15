# Banco de dados (Supabase / Postgres)

Até 14/07/2026 o schema do Varzola vivia **só no dashboard do Supabase** — nada
versionado. Uma auditoria de segurança daquele dia (views ignorando RLS,
listagem pública de peladas, squatting de perfil) precisou ser feita por
inspeção direta do banco, porque não havia fonte de verdade no repositório.
Este diretório resolve isso.

## O que é cada coisa

- **`schema.sql`** — retrato **completo e atual** do schema `public` (todas as
  tabelas, views, funções, policies, RLS e triggers), gerado por `pg_dump`. É a
  **fonte de verdade** para revisão em code review e para recriar o banco do
  zero. Deve ser **regenerado após cada migration** (comando abaixo), para
  continuar refletindo o estado real.

- **`migrations/`** — mudanças **incrementais**, em ordem cronológica pelo prefixo
  de timestamp. Cada arquivo traz o bloco de rollback comentado no rodapé. É por
  aqui que **toda mudança nova** deve passar — não mais direto no SQL Editor.

Os dois se complementam: as migrations são o histórico do que mudou; o
`schema.sql` é a foto de como o banco está agora (já com todas as migrations
aplicadas).

## Fluxo para uma mudança nova

1. Escreva `migrations/AAAAMMDDHHMMSS_descricao.sql` (com rollback no rodapé).
2. Aplique no banco e **teste** (para RLS, validar com usuário anônimo,
   membro e não-membro — ver histórico em `migrations/`).
3. Regenere o retrato:
   ```sh
   pg_dump --schema-only --schema=public --no-owner "$DATABASE_URL" > supabase/schema.sql
   ```
   (append manual do trigger de `auth.users` ao final — ver observação abaixo.)
4. Commit da migration + do `schema.sql` atualizado juntos.

`pg_dump` não está instalado na máquina; foi usado via Docker:
`docker run --rm -e PGURL postgres:17-alpine sh -c 'pg_dump --schema-only --schema=public --no-owner "$PGURL"'`.

## Observações sobre replay

O `schema.sql` é fiel ao que o `pg_dump --schema=public` produz. Para **recriar
o banco** a partir dele, dois pontos:

- Contém `CREATE SCHEMA public;` — num projeto Supabase novo o schema `public`
  já existe, então rode com `psql` após um `drop schema public cascade;`, ou
  remova essa linha antes de aplicar.
- Contém metacomandos `\restrict` / `\unrestrict` do `pg_dump` 17: aplique com
  **`psql`** (não pelo SQL Editor do dashboard, que não os entende).

- O **trigger `on_auth_user_created`** (em `auth.users`) fica **fora** do schema
  `public`, então o `pg_dump --schema=public` não o captura. Ele está anexado à
  mão no fim do `schema.sql`, numa seção comentada. Sem esse trigger, novos
  cadastros não criam a linha em `profiles`.

## Acesso ao banco

Credencial (session pooler, IPv4) em `C:\Users\eblum\.varzola-db.env` — arquivo
local, fora do repositório. Nunca commitar.
