import { useState } from 'react';
import Leaderboard from './components/Leaderboard';
import Scoring from './components/Scoring';
import './App.css';

function App() {
  const [tab, setTab] = useState('leaderboard');

  return (
    <div className="app">
      <header>
        <h1>AI 实践评选</h1>
        <nav className="tabs">
          <button
            className={tab === 'leaderboard' ? 'active' : ''}
            onClick={() => setTab('leaderboard')}
          >
            排行榜
          </button>
          <button
            className={tab === 'scoring' ? 'active' : ''}
            onClick={() => setTab('scoring')}
          >
            打分
          </button>
        </nav>
      </header>
      <main>
        {tab === 'leaderboard' ? <Leaderboard /> : <Scoring />}
      </main>
    </div>
  );
}

export default App;
