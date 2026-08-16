import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import RegisterPage from './RegisterPage';
import ConfirmationPage from './ConfirmationPage';
import ComingSoonPage from './ComingSoonPage';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/Cric">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/tournaments" element={<ComingSoonPage eyebrow="DPL 2026 / TOURNAMENTS" title="TOURNAMENTS" copy="The DPL 2026 tournament structure, groups, and format will be announced here." />} />
        <Route path="/teams" element={<ComingSoonPage eyebrow="DPL 2026 / TEAMS" title="TEAMS" copy="Meet the DPL 2026 teams, captains, and squads after the auction." icon="🏆" />} />
        <Route path="/fixtures" element={<ComingSoonPage eyebrow="DPL 2026 / FIXTURES" title="FIXTURES" copy="The full match schedule with dates, venues, and results will live here." icon="📅" />} />
        <Route path="/auction" element={<ComingSoonPage eyebrow="DPL 2026 / AUCTION" title="AUCTION" copy="Auction day details and live bid tracking will be published here." icon="⚒" />} />
        <Route path="/leaderboard" element={<ComingSoonPage eyebrow="DPL 2026 / LEADERBOARD" title="LEADERBOARD" copy="Player rankings, run scorers, and wicket takers will be tracked here." icon="📊" />} />
        <Route path="/gallery" element={<ComingSoonPage eyebrow="DPL 2026 / GALLERY" title="GALLERY" copy="Match photos and moments from the season will be collected here." icon="📸" />} />
        <Route path="/about" element={<ComingSoonPage eyebrow="DPL 2026 / ABOUT" title="ABOUT" copy="Everything about the Digitate Premier League — rules, people, and the story — coming soon." icon="✉" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);