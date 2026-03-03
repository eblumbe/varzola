export type MemberRole = 'owner' | 'admin' | 'player'
export type MemberStatus = 'active' | 'inactive'
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type ChampionshipStatus = 'active' | 'completed' | 'cancelled'
export type RoundStatus = 'pending' | 'in_progress' | 'completed'
export type Frequency = 'weekly' | 'biweekly' | 'monthly'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'
export type AttendanceStatus = 'confirmed' | 'declined' | 'maybe'
export type PlayerPosition = 'goleiro' | 'zagueiro' | 'meia' | 'atacante'
export type GuestStatus = 'active' | 'inactive' | 'matched'

export interface Profile {
  id: string
  full_name: string
  nickname: string | null
  favorite_team: string | null
  avatar_url: string | null
  is_first_login: boolean
  created_at: string
  updated_at: string
}

export interface Pelada {
  id: string
  name: string
  code: string
  description: string | null
  location: string | null
  day_of_week: string | null
  time: string | null
  match_value: number
  max_players: number
  owner_id: string
  created_at: string
  updated_at: string
}

export interface PeladaMember {
  id: string
  pelada_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  joined_at: string
  profile?: Profile
}

export interface GuestPlayer {
  id: string
  pelada_id: string
  name: string
  nickname: string | null
  phone: string | null
  position: PlayerPosition | null
  technical_level: number
  status: GuestStatus
  matched_user_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface JoinRequest {
  id: string
  pelada_id: string
  user_id: string
  request_type: 'new' | 'match_guest'
  matched_guest_id: string | null
  status: JoinRequestStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  profile?: Profile
}

export interface ScoringRules {
  win: number
  draw: number
  goal: number
}

export interface Championship {
  id: string
  pelada_id: string
  name: string
  start_date: string
  end_date: string | null
  frequency: Frequency
  status: ChampionshipStatus
  scoring_rules: ScoringRules
  created_by: string
  created_at: string
  updated_at: string
  rounds?: Round[]
}

export interface Round {
  id: string
  championship_id: string
  round_number: number
  date: string | null
  status: RoundStatus
  created_at: string
  matches?: Match[]
}

export interface Match {
  id: string
  pelada_id: string
  round_id: string | null
  date: string
  location: string | null
  status: MatchStatus
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  teams?: MatchTeam[]
}

export interface MatchTeam {
  id: string
  match_id: string
  name: string
  color: string
  score: number
  is_winner: boolean
  created_at: string
  players?: MatchTeamPlayer[]
}

export interface MatchTeamPlayer {
  id: string
  match_team_id: string
  user_id: string | null
  guest_player_id: string | null
  profile?: Profile
  guest?: GuestPlayer
}

export interface Goal {
  id: string
  match_id: string
  match_team_id: string
  user_id: string | null
  guest_player_id: string | null
  assist_user_id: string | null
  assist_guest_player_id: string | null
  minute: number | null
  is_own_goal: boolean
  created_at: string
}

export interface PlayerRating {
  id: string
  match_id: string
  rated_user_id: string | null
  rated_guest_id: string | null
  rater_id: string
  technical: number | null
  physical: number | null
  tactical: number | null
  fair_play: number | null
  created_at: string
}

export interface MatchAttendance {
  id: string
  match_id: string
  user_id: string | null
  guest_player_id: string | null
  status: AttendanceStatus
  confirmed_at: string
}

export interface RankingEntry {
  championship_id?: string
  pelada_id: string
  user_id: string | null
  guest_player_id: string | null
  player_name: string
  player_nickname: string | null
  matches_played: number
  wins: number
  total_goals: number
  total_assists: number
  total_points: number
}
