-- Corrige os 2 issues CRITICAL do Supabase Advisor (views SECURITY DEFINER)
-- e a RLS permissiva da tabela peladas.
--
-- Auditoria de 2026-07-14:
--
-- 1. championship_rankings e pelada_rankings foram criadas sem security_invoker.
--    Uma view assim roda com os privilegios do owner (postgres) e portanto IGNORA o
--    RLS das tabelas base. Como anon e authenticated tem SELECT nelas, qualquer um
--    veria o ranking de qualquer pelada. Hoje nao vaza apenas porque goals e
--    match_team_players estao vazias: e bomba-relogio, nao vazamento ativo.
--
--    Ligar security_invoker NAO quebra o ranking de quem e membro: as policies de
--    matches/goals/match_teams ja permitem is_pelada_member, profiles_select_peers
--    deixa o membro ver o perfil de quem divide pelada com ele, e todos os joins da
--    view sao LEFT JOIN (nome ausente nao elimina a linha).
--
-- 2. A policy peladas_select_by_code usava USING (true): liberava SELECT de TODAS as
--    peladas para qualquer um, inclusive anonimo — e inclusive da coluna `code`, o
--    codigo de convite. A intencao era permitir achar uma pelada pelo codigo para
--    entrar nela, mas RLS filtra linha a linha e nao distingue "buscou pelo codigo"
--    de "listou tudo". Esse fluxo passa a ser servido por uma funcao dedicada.

begin;

-- 1. Views do ranking passam a respeitar o RLS de quem consulta.
--    As DUAS precisam mudar: pelada_rankings le championship_rankings, e uma view
--    definer lendo uma invoker resolveria como postgres, anulando o efeito.
alter view public.championship_rankings set (security_invoker = on);
alter view public.pelada_rankings       set (security_invoker = on);

-- 2. peladas: SELECT apenas para membro (o dono ja entra em pelada_members
--    como role=owner/status=active, entao nao perde acesso a propria pelada).
drop policy if exists "peladas_select_by_code" on public.peladas;

create policy "peladas_select_member"
  on public.peladas
  for select
  using (is_pelada_member(id));

-- 3. Busca por codigo (fluxo "entrar na pelada", em que o usuario ainda NAO e membro
--    e portanto nao passa pela policy acima). Diferente da policy antiga:
--      - exige usuario autenticado, entao anonimo nao busca nada;
--      - exige o codigo EXATO, entao nao da para listar nem enumerar peladas.
create or replace function public.get_pelada_by_code(p_code text)
returns setof public.peladas
language sql
stable
security definer
set search_path = public
as $$
  select *
    from public.peladas
   where code = upper(trim(p_code))
     and auth.uid() is not null
   limit 1;
$$;

revoke all on function public.get_pelada_by_code(text) from public;
revoke all on function public.get_pelada_by_code(text) from anon;
grant execute on function public.get_pelada_by_code(text) to authenticated;

commit;


-- ============================== ROLLBACK ==============================
-- begin;
-- alter view public.championship_rankings set (security_invoker = off);
-- alter view public.pelada_rankings       set (security_invoker = off);
-- drop policy if exists "peladas_select_member" on public.peladas;
-- create policy "peladas_select_by_code" on public.peladas for select using (true);
-- drop function if exists public.get_pelada_by_code(text);
-- commit;
