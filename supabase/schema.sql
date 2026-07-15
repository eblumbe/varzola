--
-- PostgreSQL database dump
--

\restrict P8HVJ8KKbLwC9YJVZd04Dn0voxKfLghzfYwgxRn63jp6y198bydGTMKgkG8flna

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: generate_pelada_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_pelada_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'VARZ-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM peladas WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.code := new_code;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: peladas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.peladas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    code text DEFAULT ''::text NOT NULL,
    description text,
    location text,
    day_of_week text,
    "time" text,
    match_value numeric(10,2) DEFAULT 0,
    max_players integer DEFAULT 20,
    owner_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: get_pelada_by_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pelada_by_code(p_code text) RETURNS SETOF public.peladas
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select *
    from public.peladas
   where code = upper(trim(p_code))
     and auth.uid() is not null
   limit 1;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_first_login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Jogador'),
    TRUE
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;


--
-- Name: is_pelada_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_pelada_admin(p_pelada_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pelada_members
    WHERE pelada_id = p_pelada_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
END;
$$;


--
-- Name: is_pelada_member(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_pelada_member(p_pelada_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pelada_members
    WHERE pelada_id = p_pelada_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$;


--
-- Name: update_team_score(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_team_score() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE match_teams SET score = score + 1 WHERE id = NEW.match_team_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE match_teams SET score = score - 1 WHERE id = OLD.match_team_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: championships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.championships (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pelada_id uuid NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    frequency text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    scoring_rules jsonb DEFAULT '{"win": 2, "draw": 1, "goal": 1}'::jsonb,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT championships_frequency_check CHECK ((frequency = ANY (ARRAY['weekly'::text, 'biweekly'::text, 'monthly'::text]))),
    CONSTRAINT championships_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_id uuid NOT NULL,
    match_team_id uuid NOT NULL,
    user_id uuid,
    guest_player_id uuid,
    assist_user_id uuid,
    assist_guest_player_id uuid,
    minute integer,
    is_own_goal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT goal_scorer CHECK ((((user_id IS NOT NULL) AND (guest_player_id IS NULL)) OR ((user_id IS NULL) AND (guest_player_id IS NOT NULL))))
);


--
-- Name: guest_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pelada_id uuid NOT NULL,
    name text NOT NULL,
    nickname text,
    phone text,
    "position" text,
    technical_level integer DEFAULT 5,
    status text DEFAULT 'active'::text NOT NULL,
    matched_user_id uuid,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT guest_players_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'matched'::text]))),
    CONSTRAINT guest_players_technical_level_check CHECK (((technical_level >= 1) AND (technical_level <= 10)))
);


--
-- Name: match_team_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_team_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_team_id uuid NOT NULL,
    user_id uuid,
    guest_player_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT player_reference CHECK ((((user_id IS NOT NULL) AND (guest_player_id IS NULL)) OR ((user_id IS NULL) AND (guest_player_id IS NOT NULL))))
);


--
-- Name: match_teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_teams (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#333333'::text,
    score integer DEFAULT 0,
    is_winner boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pelada_id uuid NOT NULL,
    round_id uuid,
    date date NOT NULL,
    location text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT matches_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    nickname text,
    favorite_team text,
    avatar_url text,
    is_first_login boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.profiles FORCE ROW LEVEL SECURITY;


--
-- Name: rounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rounds (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    championship_id uuid NOT NULL,
    round_number integer NOT NULL,
    date date,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rounds_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text])))
);


--
-- Name: championship_rankings; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.championship_rankings WITH (security_invoker='on') AS
 WITH match_results AS (
         SELECT m.id AS match_id,
            r.championship_id,
            c.pelada_id,
            c.scoring_rules,
            mt.id AS team_id,
            mt.is_winner,
            mt.score AS team_score,
            mtp.user_id,
            mtp.guest_player_id
           FROM ((((public.matches m
             JOIN public.rounds r ON ((r.id = m.round_id)))
             JOIN public.championships c ON ((c.id = r.championship_id)))
             JOIN public.match_teams mt ON ((mt.match_id = m.id)))
             JOIN public.match_team_players mtp ON ((mtp.match_team_id = mt.id)))
          WHERE (m.status = 'completed'::text)
        ), player_goals AS (
         SELECT g.match_id,
            g.user_id,
            g.guest_player_id,
            count(*) AS goal_count
           FROM public.goals g
          WHERE (g.is_own_goal = false)
          GROUP BY g.match_id, g.user_id, g.guest_player_id
        ), player_assists AS (
         SELECT g.match_id,
            g.assist_user_id AS user_id,
            g.assist_guest_player_id AS guest_player_id,
            count(*) AS assist_count
           FROM public.goals g
          WHERE ((g.assist_user_id IS NOT NULL) OR (g.assist_guest_player_id IS NOT NULL))
          GROUP BY g.match_id, g.assist_user_id, g.assist_guest_player_id
        )
 SELECT mr.championship_id,
    mr.pelada_id,
    mr.user_id,
    mr.guest_player_id,
    COALESCE(p.full_name, gp.name) AS player_name,
    COALESCE(p.nickname, gp.nickname) AS player_nickname,
    count(DISTINCT mr.match_id) AS matches_played,
    sum(
        CASE
            WHEN mr.is_winner THEN 1
            ELSE 0
        END) AS wins,
    COALESCE(sum(pg.goal_count), (0)::numeric) AS total_goals,
    COALESCE(sum(pa.assist_count), (0)::numeric) AS total_assists,
    ((sum(
        CASE
            WHEN mr.is_winner THEN ((mr.scoring_rules ->> 'win'::text))::integer
            ELSE 0
        END))::numeric + COALESCE(sum((pg.goal_count * ((mr.scoring_rules ->> 'goal'::text))::integer)), (0)::numeric)) AS total_points
   FROM ((((match_results mr
     LEFT JOIN public.profiles p ON ((p.id = mr.user_id)))
     LEFT JOIN public.guest_players gp ON ((gp.id = mr.guest_player_id)))
     LEFT JOIN player_goals pg ON (((pg.match_id = mr.match_id) AND ((pg.user_id = mr.user_id) OR (pg.guest_player_id = mr.guest_player_id)))))
     LEFT JOIN player_assists pa ON (((pa.match_id = mr.match_id) AND ((pa.user_id = mr.user_id) OR (pa.guest_player_id = mr.guest_player_id)))))
  GROUP BY mr.championship_id, mr.pelada_id, mr.user_id, mr.guest_player_id, p.full_name, gp.name, p.nickname, gp.nickname;


--
-- Name: join_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.join_requests (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pelada_id uuid NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    matched_guest_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    CONSTRAINT join_requests_request_type_check CHECK ((request_type = ANY (ARRAY['new'::text, 'match_guest'::text]))),
    CONSTRAINT join_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: match_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_attendance (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_id uuid NOT NULL,
    user_id uuid,
    guest_player_id uuid,
    status text DEFAULT 'confirmed'::text NOT NULL,
    confirmed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT attendance_player CHECK ((((user_id IS NOT NULL) AND (guest_player_id IS NULL)) OR ((user_id IS NULL) AND (guest_player_id IS NOT NULL)))),
    CONSTRAINT match_attendance_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'declined'::text, 'maybe'::text])))
);


--
-- Name: pelada_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pelada_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    pelada_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pelada_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'player'::text]))),
    CONSTRAINT pelada_members_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: pelada_rankings; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.pelada_rankings WITH (security_invoker='on') AS
 SELECT pelada_id,
    user_id,
    guest_player_id,
    player_name,
    player_nickname,
    sum(matches_played) AS total_matches,
    sum(wins) AS total_wins,
    sum(total_goals) AS total_goals,
    sum(total_assists) AS total_assists,
    sum(total_points) AS total_points
   FROM public.championship_rankings
  GROUP BY pelada_id, user_id, guest_player_id, player_name, player_nickname;


--
-- Name: player_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_ratings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    match_id uuid NOT NULL,
    rated_user_id uuid,
    rated_guest_id uuid,
    rater_id uuid NOT NULL,
    technical integer,
    physical integer,
    tactical integer,
    fair_play integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT player_ratings_fair_play_check CHECK (((fair_play >= 1) AND (fair_play <= 10))),
    CONSTRAINT player_ratings_physical_check CHECK (((physical >= 1) AND (physical <= 10))),
    CONSTRAINT player_ratings_tactical_check CHECK (((tactical >= 1) AND (tactical <= 10))),
    CONSTRAINT player_ratings_technical_check CHECK (((technical >= 1) AND (technical <= 10))),
    CONSTRAINT rated_player CHECK ((((rated_user_id IS NOT NULL) AND (rated_guest_id IS NULL)) OR ((rated_user_id IS NULL) AND (rated_guest_id IS NOT NULL))))
);


--
-- Name: round_mvp_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.round_mvp_votes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    round_id uuid NOT NULL,
    voter_user_id uuid NOT NULL,
    voted_user_id uuid,
    voted_guest_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT round_mvp_vote_one_ref CHECK ((((voted_user_id IS NOT NULL) AND (voted_guest_id IS NULL)) OR ((voted_user_id IS NULL) AND (voted_guest_id IS NOT NULL))))
);


--
-- Name: round_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.round_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    round_id uuid NOT NULL,
    user_id uuid,
    guest_player_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT round_player_ref CHECK ((((user_id IS NOT NULL) AND (guest_player_id IS NULL)) OR ((user_id IS NULL) AND (guest_player_id IS NOT NULL))))
);


--
-- Name: championships championships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: guest_players guest_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_players
    ADD CONSTRAINT guest_players_pkey PRIMARY KEY (id);


--
-- Name: join_requests join_requests_pelada_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_pelada_id_user_id_key UNIQUE (pelada_id, user_id);


--
-- Name: join_requests join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_pkey PRIMARY KEY (id);


--
-- Name: match_attendance match_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_attendance
    ADD CONSTRAINT match_attendance_pkey PRIMARY KEY (id);


--
-- Name: match_team_players match_team_players_match_team_id_guest_player_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_team_players
    ADD CONSTRAINT match_team_players_match_team_id_guest_player_id_key UNIQUE (match_team_id, guest_player_id);


--
-- Name: match_team_players match_team_players_match_team_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_team_players
    ADD CONSTRAINT match_team_players_match_team_id_user_id_key UNIQUE (match_team_id, user_id);


--
-- Name: match_team_players match_team_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_team_players
    ADD CONSTRAINT match_team_players_pkey PRIMARY KEY (id);


--
-- Name: match_teams match_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_teams
    ADD CONSTRAINT match_teams_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: pelada_members pelada_members_pelada_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelada_members
    ADD CONSTRAINT pelada_members_pelada_id_user_id_key UNIQUE (pelada_id, user_id);


--
-- Name: pelada_members pelada_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelada_members
    ADD CONSTRAINT pelada_members_pkey PRIMARY KEY (id);


--
-- Name: peladas peladas_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peladas
    ADD CONSTRAINT peladas_code_key UNIQUE (code);


--
-- Name: peladas peladas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peladas
    ADD CONSTRAINT peladas_pkey PRIMARY KEY (id);


--
-- Name: player_ratings player_ratings_match_id_rated_guest_id_rater_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_match_id_rated_guest_id_rater_id_key UNIQUE (match_id, rated_guest_id, rater_id);


--
-- Name: player_ratings player_ratings_match_id_rated_user_id_rater_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_match_id_rated_user_id_rater_id_key UNIQUE (match_id, rated_user_id, rater_id);


--
-- Name: player_ratings player_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: round_mvp_votes round_mvp_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_mvp_votes
    ADD CONSTRAINT round_mvp_votes_pkey PRIMARY KEY (id);


--
-- Name: round_mvp_votes round_mvp_votes_round_id_voter_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_mvp_votes
    ADD CONSTRAINT round_mvp_votes_round_id_voter_user_id_key UNIQUE (round_id, voter_user_id);


--
-- Name: round_players round_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_pkey PRIMARY KEY (id);


--
-- Name: rounds rounds_championship_id_round_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_championship_id_round_number_key UNIQUE (championship_id, round_number);


--
-- Name: rounds rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_pkey PRIMARY KEY (id);


--
-- Name: idx_championships_pelada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_championships_pelada ON public.championships USING btree (pelada_id);


--
-- Name: idx_goals_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_match ON public.goals USING btree (match_id);


--
-- Name: idx_guest_players_pelada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_players_pelada ON public.guest_players USING btree (pelada_id);


--
-- Name: idx_match_attendance_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_attendance_match ON public.match_attendance USING btree (match_id);


--
-- Name: idx_match_team_players_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_team_players_team ON public.match_team_players USING btree (match_team_id);


--
-- Name: idx_match_teams_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_match_teams_match ON public.match_teams USING btree (match_id);


--
-- Name: idx_matches_pelada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_pelada ON public.matches USING btree (pelada_id);


--
-- Name: idx_matches_round; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_round ON public.matches USING btree (round_id);


--
-- Name: idx_pelada_members_pelada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pelada_members_pelada ON public.pelada_members USING btree (pelada_id);


--
-- Name: idx_pelada_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pelada_members_user ON public.pelada_members USING btree (user_id);


--
-- Name: idx_player_ratings_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_ratings_match ON public.player_ratings USING btree (match_id);


--
-- Name: idx_rounds_championship; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rounds_championship ON public.rounds USING btree (championship_id);


--
-- Name: goals on_goal_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_goal_change AFTER INSERT OR DELETE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_team_score();


--
-- Name: peladas set_pelada_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pelada_code BEFORE INSERT ON public.peladas FOR EACH ROW WHEN (((new.code = ''::text) OR (new.code IS NULL))) EXECUTE FUNCTION public.generate_pelada_code();


--
-- Name: championships update_championships_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_championships_updated_at BEFORE UPDATE ON public.championships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: guest_players update_guest_players_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guest_players_updated_at BEFORE UPDATE ON public.guest_players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: matches update_matches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: peladas update_peladas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_peladas_updated_at BEFORE UPDATE ON public.peladas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: championships championships_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: championships championships_pelada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_pelada_id_fkey FOREIGN KEY (pelada_id) REFERENCES public.peladas(id) ON DELETE CASCADE;


--
-- Name: goals goals_assist_guest_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_assist_guest_player_id_fkey FOREIGN KEY (assist_guest_player_id) REFERENCES public.guest_players(id);


--
-- Name: goals goals_assist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_assist_user_id_fkey FOREIGN KEY (assist_user_id) REFERENCES auth.users(id);


--
-- Name: goals goals_guest_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_guest_player_id_fkey FOREIGN KEY (guest_player_id) REFERENCES public.guest_players(id);


--
-- Name: goals goals_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: goals goals_match_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_match_team_id_fkey FOREIGN KEY (match_team_id) REFERENCES public.match_teams(id) ON DELETE CASCADE;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: guest_players guest_players_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_players
    ADD CONSTRAINT guest_players_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: guest_players guest_players_matched_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_players
    ADD CONSTRAINT guest_players_matched_user_id_fkey FOREIGN KEY (matched_user_id) REFERENCES auth.users(id);


--
-- Name: guest_players guest_players_pelada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_players
    ADD CONSTRAINT guest_players_pelada_id_fkey FOREIGN KEY (pelada_id) REFERENCES public.peladas(id) ON DELETE CASCADE;


--
-- Name: join_requests join_requests_matched_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_matched_guest_id_fkey FOREIGN KEY (matched_guest_id) REFERENCES public.guest_players(id);


--
-- Name: join_requests join_requests_pelada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_pelada_id_fkey FOREIGN KEY (pelada_id) REFERENCES public.peladas(id) ON DELETE CASCADE;


--
-- Name: join_requests join_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: join_requests join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.join_requests
    ADD CONSTRAINT join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: match_attendance match_attendance_guest_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_attendance
    ADD CONSTRAINT match_attendance_guest_player_id_fkey FOREIGN KEY (guest_player_id) REFERENCES public.guest_players(id);


--
-- Name: match_attendance match_attendance_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_attendance
    ADD CONSTRAINT match_attendance_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: match_attendance match_attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_attendance
    ADD CONSTRAINT match_attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: match_team_players match_team_players_guest_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_team_players
    ADD CONSTRAINT match_team_players_guest_player_id_fkey FOREIGN KEY (guest_player_id) REFERENCES public.guest_players(id);


--
-- Name: match_team_players match_team_players_match_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_team_players
    ADD CONSTRAINT match_team_players_match_team_id_fkey FOREIGN KEY (match_team_id) REFERENCES public.match_teams(id) ON DELETE CASCADE;


--
-- Name: match_team_players match_team_players_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_team_players
    ADD CONSTRAINT match_team_players_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: match_teams match_teams_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_teams
    ADD CONSTRAINT match_teams_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: matches matches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: matches matches_pelada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pelada_id_fkey FOREIGN KEY (pelada_id) REFERENCES public.peladas(id) ON DELETE CASCADE;


--
-- Name: matches matches_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE SET NULL;


--
-- Name: pelada_members pelada_members_pelada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelada_members
    ADD CONSTRAINT pelada_members_pelada_id_fkey FOREIGN KEY (pelada_id) REFERENCES public.peladas(id) ON DELETE CASCADE;


--
-- Name: pelada_members pelada_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelada_members
    ADD CONSTRAINT pelada_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: peladas peladas_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.peladas
    ADD CONSTRAINT peladas_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);


--
-- Name: player_ratings player_ratings_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: player_ratings player_ratings_rated_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rated_guest_id_fkey FOREIGN KEY (rated_guest_id) REFERENCES public.guest_players(id);


--
-- Name: player_ratings player_ratings_rated_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES auth.users(id);


--
-- Name: player_ratings player_ratings_rater_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_ratings
    ADD CONSTRAINT player_ratings_rater_id_fkey FOREIGN KEY (rater_id) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: round_mvp_votes round_mvp_votes_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_mvp_votes
    ADD CONSTRAINT round_mvp_votes_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;


--
-- Name: round_mvp_votes round_mvp_votes_voted_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_mvp_votes
    ADD CONSTRAINT round_mvp_votes_voted_guest_id_fkey FOREIGN KEY (voted_guest_id) REFERENCES public.guest_players(id);


--
-- Name: round_mvp_votes round_mvp_votes_voted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_mvp_votes
    ADD CONSTRAINT round_mvp_votes_voted_user_id_fkey FOREIGN KEY (voted_user_id) REFERENCES auth.users(id);


--
-- Name: round_mvp_votes round_mvp_votes_voter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_mvp_votes
    ADD CONSTRAINT round_mvp_votes_voter_user_id_fkey FOREIGN KEY (voter_user_id) REFERENCES auth.users(id);


--
-- Name: round_players round_players_guest_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_guest_player_id_fkey FOREIGN KEY (guest_player_id) REFERENCES public.guest_players(id);


--
-- Name: round_players round_players_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;


--
-- Name: round_players round_players_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: rounds rounds_championship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE;


--
-- Name: round_mvp_votes Members can view votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view votes" ON public.round_mvp_votes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.rounds r
     JOIN public.championships c ON ((c.id = r.championship_id)))
     JOIN public.pelada_members pm ON ((pm.pelada_id = c.pelada_id)))
  WHERE ((r.id = round_mvp_votes.round_id) AND (pm.user_id = auth.uid()) AND (pm.status = 'active'::text)))));


--
-- Name: round_mvp_votes Members can vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can vote" ON public.round_mvp_votes FOR INSERT WITH CHECK (((auth.uid() = voter_user_id) AND (EXISTS ( SELECT 1
   FROM ((public.rounds r
     JOIN public.championships c ON ((c.id = r.championship_id)))
     JOIN public.pelada_members pm ON ((pm.pelada_id = c.pelada_id)))
  WHERE ((r.id = round_mvp_votes.round_id) AND (pm.user_id = auth.uid()) AND (pm.status = 'active'::text))))));


--
-- Name: round_mvp_votes Voter can delete own vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Voter can delete own vote" ON public.round_mvp_votes FOR DELETE USING ((auth.uid() = voter_user_id));


--
-- Name: match_attendance attendance_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY attendance_insert ON public.match_attendance FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_attendance.match_id) AND public.is_pelada_member(m.pelada_id)))));


--
-- Name: match_attendance attendance_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY attendance_select ON public.match_attendance FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_attendance.match_id) AND public.is_pelada_member(m.pelada_id)))));


--
-- Name: match_attendance attendance_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY attendance_update ON public.match_attendance FOR UPDATE USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_attendance.match_id) AND public.is_pelada_admin(m.pelada_id))))));


--
-- Name: championships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;

--
-- Name: championships champs_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY champs_insert ON public.championships FOR INSERT WITH CHECK (public.is_pelada_admin(pelada_id));


--
-- Name: championships champs_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY champs_select ON public.championships FOR SELECT USING (public.is_pelada_member(pelada_id));


--
-- Name: championships champs_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY champs_update ON public.championships FOR UPDATE USING (public.is_pelada_admin(pelada_id));


--
-- Name: goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

--
-- Name: goals goals_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY goals_delete ON public.goals FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = goals.match_id) AND public.is_pelada_admin(m.pelada_id)))));


--
-- Name: goals goals_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY goals_insert ON public.goals FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = goals.match_id) AND public.is_pelada_admin(m.pelada_id)))));


--
-- Name: goals goals_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY goals_select ON public.goals FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = goals.match_id) AND public.is_pelada_member(m.pelada_id)))));


--
-- Name: guest_players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guest_players ENABLE ROW LEVEL SECURITY;

--
-- Name: guest_players guests_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY guests_insert ON public.guest_players FOR INSERT WITH CHECK (public.is_pelada_admin(pelada_id));


--
-- Name: guest_players guests_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY guests_select ON public.guest_players FOR SELECT USING (public.is_pelada_member(pelada_id));


--
-- Name: guest_players guests_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY guests_update ON public.guest_players FOR UPDATE USING (public.is_pelada_admin(pelada_id));


--
-- Name: join_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: match_attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: match_team_players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_team_players ENABLE ROW LEVEL SECURITY;

--
-- Name: match_teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.match_teams ENABLE ROW LEVEL SECURITY;

--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: matches matches_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_insert ON public.matches FOR INSERT WITH CHECK (public.is_pelada_admin(pelada_id));


--
-- Name: matches matches_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_select ON public.matches FOR SELECT USING (public.is_pelada_member(pelada_id));


--
-- Name: matches matches_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY matches_update ON public.matches FOR UPDATE USING (public.is_pelada_admin(pelada_id));


--
-- Name: pelada_members members_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_delete ON public.pelada_members FOR DELETE USING (public.is_pelada_admin(pelada_id));


--
-- Name: pelada_members members_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_insert ON public.pelada_members FOR INSERT WITH CHECK ((public.is_pelada_admin(pelada_id) OR (user_id = auth.uid())));


--
-- Name: pelada_members members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_select ON public.pelada_members FOR SELECT USING (public.is_pelada_member(pelada_id));


--
-- Name: pelada_members members_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_update ON public.pelada_members FOR UPDATE USING (public.is_pelada_admin(pelada_id));


--
-- Name: pelada_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pelada_members ENABLE ROW LEVEL SECURITY;

--
-- Name: peladas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.peladas ENABLE ROW LEVEL SECURITY;

--
-- Name: peladas peladas_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY peladas_insert ON public.peladas FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: peladas peladas_select_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY peladas_select_member ON public.peladas FOR SELECT USING (public.is_pelada_member(id));


--
-- Name: peladas peladas_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY peladas_update ON public.peladas FOR UPDATE USING (public.is_pelada_admin(id));


--
-- Name: player_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles profiles_select_peers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_peers ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.pelada_members pm1
     JOIN public.pelada_members pm2 ON ((pm1.pelada_id = pm2.pelada_id)))
  WHERE ((pm1.user_id = auth.uid()) AND (pm2.user_id = profiles.id)))));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: player_ratings ratings_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ratings_insert ON public.player_ratings FOR INSERT WITH CHECK (((rater_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = player_ratings.match_id) AND public.is_pelada_member(m.pelada_id))))));


--
-- Name: player_ratings ratings_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ratings_select ON public.player_ratings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = player_ratings.match_id) AND public.is_pelada_member(m.pelada_id)))));


--
-- Name: join_requests requests_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY requests_insert ON public.join_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: join_requests requests_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY requests_select ON public.join_requests FOR SELECT USING (((user_id = auth.uid()) OR public.is_pelada_admin(pelada_id)));


--
-- Name: join_requests requests_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY requests_update ON public.join_requests FOR UPDATE USING (public.is_pelada_admin(pelada_id));


--
-- Name: round_mvp_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.round_mvp_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: round_players; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.round_players ENABLE ROW LEVEL SECURITY;

--
-- Name: round_players round_players_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY round_players_delete ON public.round_players FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.rounds r
     JOIN public.championships c ON ((c.id = r.championship_id)))
  WHERE ((r.id = round_players.round_id) AND public.is_pelada_admin(c.pelada_id)))));


--
-- Name: round_players round_players_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY round_players_insert ON public.round_players FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.rounds r
     JOIN public.championships c ON ((c.id = r.championship_id)))
  WHERE ((r.id = round_players.round_id) AND public.is_pelada_admin(c.pelada_id)))));


--
-- Name: round_players round_players_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY round_players_select ON public.round_players FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.rounds r
     JOIN public.championships c ON ((c.id = r.championship_id)))
  WHERE ((r.id = round_players.round_id) AND public.is_pelada_member(c.pelada_id)))));


--
-- Name: rounds; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

--
-- Name: rounds rounds_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rounds_insert ON public.rounds FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = rounds.championship_id) AND public.is_pelada_admin(c.pelada_id)))));


--
-- Name: rounds rounds_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rounds_select ON public.rounds FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = rounds.championship_id) AND public.is_pelada_member(c.pelada_id)))));


--
-- Name: rounds rounds_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY rounds_update ON public.rounds FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = rounds.championship_id) AND public.is_pelada_admin(c.pelada_id)))));


--
-- Name: match_team_players team_players_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_players_insert ON public.match_team_players FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.match_teams mt
     JOIN public.matches m ON ((m.id = mt.match_id)))
  WHERE ((mt.id = match_team_players.match_team_id) AND public.is_pelada_admin(m.pelada_id)))));


--
-- Name: match_team_players team_players_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_players_select ON public.match_team_players FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.match_teams mt
     JOIN public.matches m ON ((m.id = mt.match_id)))
  WHERE ((mt.id = match_team_players.match_team_id) AND public.is_pelada_member(m.pelada_id)))));


--
-- Name: match_teams teams_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_insert ON public.match_teams FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_teams.match_id) AND public.is_pelada_admin(m.pelada_id)))));


--
-- Name: match_teams teams_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_select ON public.match_teams FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_teams.match_id) AND public.is_pelada_member(m.pelada_id)))));


--
-- Name: match_teams teams_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_update ON public.match_teams FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.matches m
  WHERE ((m.id = match_teams.match_id) AND public.is_pelada_admin(m.pelada_id)))));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION generate_pelada_code(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.generate_pelada_code() TO anon;
GRANT ALL ON FUNCTION public.generate_pelada_code() TO authenticated;
GRANT ALL ON FUNCTION public.generate_pelada_code() TO service_role;


--
-- Name: TABLE peladas; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.peladas TO anon;
GRANT ALL ON TABLE public.peladas TO authenticated;
GRANT ALL ON TABLE public.peladas TO service_role;


--
-- Name: FUNCTION get_pelada_by_code(p_code text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_pelada_by_code(p_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_pelada_by_code(p_code text) TO authenticated;
GRANT ALL ON FUNCTION public.get_pelada_by_code(p_code text) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION is_pelada_admin(p_pelada_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_pelada_admin(p_pelada_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_pelada_admin(p_pelada_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_pelada_admin(p_pelada_id uuid) TO service_role;


--
-- Name: FUNCTION is_pelada_member(p_pelada_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_pelada_member(p_pelada_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_pelada_member(p_pelada_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_pelada_member(p_pelada_id uuid) TO service_role;


--
-- Name: FUNCTION update_team_score(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_team_score() TO anon;
GRANT ALL ON FUNCTION public.update_team_score() TO authenticated;
GRANT ALL ON FUNCTION public.update_team_score() TO service_role;


--
-- Name: FUNCTION update_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at() TO service_role;


--
-- Name: TABLE championships; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.championships TO anon;
GRANT ALL ON TABLE public.championships TO authenticated;
GRANT ALL ON TABLE public.championships TO service_role;


--
-- Name: TABLE goals; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.goals TO anon;
GRANT ALL ON TABLE public.goals TO authenticated;
GRANT ALL ON TABLE public.goals TO service_role;


--
-- Name: TABLE guest_players; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.guest_players TO anon;
GRANT ALL ON TABLE public.guest_players TO authenticated;
GRANT ALL ON TABLE public.guest_players TO service_role;


--
-- Name: TABLE match_team_players; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.match_team_players TO anon;
GRANT ALL ON TABLE public.match_team_players TO authenticated;
GRANT ALL ON TABLE public.match_team_players TO service_role;


--
-- Name: TABLE match_teams; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.match_teams TO anon;
GRANT ALL ON TABLE public.match_teams TO authenticated;
GRANT ALL ON TABLE public.match_teams TO service_role;


--
-- Name: TABLE matches; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.matches TO anon;
GRANT ALL ON TABLE public.matches TO authenticated;
GRANT ALL ON TABLE public.matches TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE rounds; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.rounds TO anon;
GRANT ALL ON TABLE public.rounds TO authenticated;
GRANT ALL ON TABLE public.rounds TO service_role;


--
-- Name: TABLE championship_rankings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.championship_rankings TO anon;
GRANT ALL ON TABLE public.championship_rankings TO authenticated;
GRANT ALL ON TABLE public.championship_rankings TO service_role;


--
-- Name: TABLE join_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.join_requests TO anon;
GRANT ALL ON TABLE public.join_requests TO authenticated;
GRANT ALL ON TABLE public.join_requests TO service_role;


--
-- Name: TABLE match_attendance; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.match_attendance TO anon;
GRANT ALL ON TABLE public.match_attendance TO authenticated;
GRANT ALL ON TABLE public.match_attendance TO service_role;


--
-- Name: TABLE pelada_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pelada_members TO anon;
GRANT ALL ON TABLE public.pelada_members TO authenticated;
GRANT ALL ON TABLE public.pelada_members TO service_role;


--
-- Name: TABLE pelada_rankings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pelada_rankings TO anon;
GRANT ALL ON TABLE public.pelada_rankings TO authenticated;
GRANT ALL ON TABLE public.pelada_rankings TO service_role;


--
-- Name: TABLE player_ratings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.player_ratings TO anon;
GRANT ALL ON TABLE public.player_ratings TO authenticated;
GRANT ALL ON TABLE public.player_ratings TO service_role;


--
-- Name: TABLE round_mvp_votes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.round_mvp_votes TO anon;
GRANT ALL ON TABLE public.round_mvp_votes TO authenticated;
GRANT ALL ON TABLE public.round_mvp_votes TO service_role;


--
-- Name: TABLE round_players; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.round_players TO anon;
GRANT ALL ON TABLE public.round_players TO authenticated;
GRANT ALL ON TABLE public.round_players TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict P8HVJ8KKbLwC9YJVZd04Dn0voxKfLghzfYwgxRn63jp6y198bydGTMKgkG8flna



--
-- Objetos FORA do schema public (nao capturados por pg_dump --schema=public).
-- Adicionados a mao a partir da auditoria de 2026-07-14.
--
-- Trigger em auth.users que cria a linha em public.profiles a cada novo
-- cadastro (chama public.handle_new_user, que ja consta acima). Sem ele,
-- novos usuarios NAO ganham profile.
--

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
