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
  created_at: string;
};

export type PlayerType = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper-batter';
export type BattingStyle = 'Right-hand batter' | 'Left-hand batter';
export type BowlingStyle = 'Right-arm pace' | 'Left-arm pace' | 'Right-arm spin' | 'Left-arm spin' | 'Do not bowl';
export type BowlingArm = 'Right arm' | 'Left arm' | 'Not applicable';
export type JerseySize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type RegistrationInput = Omit<Registration, 'id' | 'created_at'>;
