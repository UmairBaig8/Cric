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

export const TEAMS: TeamInfo[] = [
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

export type TeamPlayer = {
  name: string;
  role: string;
  bat: string;
  bowl: string;
  location: 'CZ' | 'SP' | 'Other';
  dpl: boolean;
  captain?: boolean;
};

const ROLES = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper-batter'] as const;
const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Ishaan', 'Karthik', 'Rahul', 'Rohan', 'Nikhil', 'Siddharth', 'Vikas', 'Amit', 'Suresh', 'Deepak', 'Manish', 'Pravin', 'Sameer', 'Kunal', 'Jayesh', 'Nitin', 'Amol', 'Rajesh'];
const LAST = ['Sharma', 'Patel', 'Verma', 'Reddy', 'Iyer', 'Joshi', 'Kulkarni', 'Deshmukh', 'Kadam', 'Salunkhe', 'More', 'Gawade', 'Pawar', 'Chavan', 'Jadhav', 'Rane', 'Kamble', 'Shinde', 'Gokhale', 'Borkar'];

export function teamPlayers(team: TeamInfo): TeamPlayer[] {
  const list: TeamPlayer[] = [];
  const n = team.players;
  for (let i = 0; i < n; i++) {
    const first = FIRST[(team.code.length * 7 + i * 3) % FIRST.length];
    const last = LAST[(team.code.length * 5 + i * 2 + 1) % LAST.length];
    const role = i === 0 ? 'All-rounder' : ROLES[(i * 2) % ROLES.length];
    list.push({
      name: `${first} ${last}`,
      role,
      bat: i % 2 === 0 ? 'Right-hand batter' : 'Left-hand batter',
      bowl: ['Right-arm pace', 'Right-arm spin', 'Left-arm spin', 'Do not bowl'][(i * 3) % 4],
      location: (['CZ', 'SP', 'Other'] as const)[i % 3],
      dpl: i % 3 !== 0,
      captain: i === 0,
    });
  }
  return list;
}