import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import RegisterPage from './RegisterPage';
import ConfirmationPage from './ConfirmationPage';
import AuctionPage from './AuctionPage';
import ComingSoonPage from './ComingSoonPage';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/D2P">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/teams" element={<ComingSoonPage eyebrow="DPL 2026 / TEAMS" title="TEAMS" copy="Meet the DPL 2026 teams, captains, and squads after the auction." icon="🏆" />} />
        <Route path="/fixtures" element={<ComingSoonPage eyebrow="DPL 2026 / FIXTURES" title="FIXTURES" copy="The full match schedule with dates, venues, and results will live here." icon="📅" />} />
        <Route path="/auction" element={<AuctionPage />} />
        <Route path="/leaderboard" element={<ComingSoonPage eyebrow="DPL 2026 / LEADERBOARD" title="LEADERBOARD" copy="Player rankings, run scorers, and wicket takers will be tracked here." icon="📊" />} />
        <Route path="/gallery" element={<ComingSoonPage eyebrow="DPL 2026 / GALLERY" title="GALLERY" copy="Match photos and moments from the season will be collected here." icon="📸" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);