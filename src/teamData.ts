export type TeamInfo = {
  name: string;
  code: string;
  img: string;
  theme: string;
  players: number;
  champion: boolean;
  owner: string;
  captain: string;
};

export const FALLBACK_TEAMS: TeamInfo[] = [
  { name: 'Digi Super Kings', code: 'DSK', img: '/D2P/teams/dsk.png', theme: 'kings', players: 12, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Sahyadriche Mavale', code: 'SM', img: '/D2P/teams/mavale.png', theme: 'mavale', players: 11, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Digi Mitra Mandal', code: 'DMM', img: '/D2P/teams/mitra.png', theme: 'mitra', players: 12, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Bhakarwadi Blasters', code: 'BB', img: '/D2P/teams/blaster.png', theme: 'blaster', players: 10, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Digi Dhadakebaaz', code: 'DD', img: '/D2P/teams/dhada.png', theme: 'dhada', players: 11, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Cricket Wala', code: 'CW', img: '/D2P/teams/wala.png', theme: 'wala', players: 12, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Digi Titans', code: 'DT', img: '/D2P/teams/titans.png', theme: 'titans', players: 11, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Digi Yodhas', code: 'DY', img: '/D2P/teams/yodhas.png', theme: 'yodhas', players: 10, champion: false, owner: 'TBD', captain: 'TBD' },
  { name: 'Gallit Maramari', code: 'GM', img: '/D2P/teams/gallit.png', theme: 'gallit', players: 12, champion: true, owner: 'TBD', captain: 'TBD' },
  { name: 'Digi Dhurandhars', code: 'DDH', img: '/D2P/teams/dhurandhars.png', theme: 'dhurandhars', players: 11, champion: false, owner: 'TBD', captain: 'TBD' },
];