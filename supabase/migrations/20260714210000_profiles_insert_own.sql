-- Fecha o squatting de perfil na tabela profiles.
--
-- A policy profiles_insert_trigger usava WITH CHECK (true): qualquer usuario
-- autenticado podia inserir uma linha em profiles com id de OUTRA pessoa (nome,
-- apelido e time a escolha), desde que aquele id ainda nao tivesse profile.
--
-- O nome sugeria que existia para o trigger de cadastro, mas o trigger
-- handle_new_user e SECURITY DEFINER e ignora RLS — nao precisa da policy. E o
-- app nunca insere profile pelo client (o callback so faz SELECT, o /profile/setup
-- so faz UPDATE). Logo, apertar para "so o proprio" nao quebra nada.

begin;

drop policy if exists "profiles_insert_trigger" on public.profiles;

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

commit;


-- ============================== ROLLBACK ==============================
-- begin;
-- drop policy if exists "profiles_insert_own" on public.profiles;
-- create policy "profiles_insert_trigger" on public.profiles
--   for insert with check (true);
-- commit;
