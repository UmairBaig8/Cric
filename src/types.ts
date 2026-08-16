export type Registration = {
  id: string;
  name: string;
  email: string;
  department: string;
  player_type: PlayerType;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  bowling_arm: BowlingArm;
  cricket_experience: string;
  jersey_size: JerseySize;
  availability: string;
  photo_url?: string | null;
  created_at: string;
};

export type PlayerType = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper-batter';
export type BattingStyle = 'Right-hand batter' | 'Left-hand batter';
export type BowlingStyle = 'Right-arm pace' | 'Left-arm pace' | 'Right-arm spin' | 'Left-arm spin' | 'Do not bowl';
export type BowlingArm = 'Right arm' | 'Left arm' | 'Not applicable';
export type JerseySize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type RegistrationInput = Omit<Registration, 'id' | 'created_at'>;

export type SiteSettings = {
  id: number;
  registration_open: string | null;
  registration_deadline: string | null;
  player_capacity: number;
  total_teams: number;
  total_matches: number;
  champion: string | null;
};

export type Team = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};
