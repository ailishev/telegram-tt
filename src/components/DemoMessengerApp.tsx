import {
  useEffect, useState,
} from '../lib/teact/teact';

import { type DemoSession, getStoredSession, restoreSession, signOut } from '../demo/fakeAuth';
import { mockChats, mockUser } from '../demo/mockData';

import '../styles/demoApp.scss';

function DemoMessengerApp() {
  const [session, setSession] = useState<DemoSession | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void restoreSession().then((restored) => {
      setSession(restored || getStoredSession());
    });
  }, []);

  const handleLogout = () => {
    signOut();
    setSession(undefined);
    setError(undefined);
  };

  if (!session) {
    return (
      <div className="demo-login-page">
        <div className="demo-login-card">
          <h1>Sign in</h1>
          <p className="demo-subtitle">Use Telegram-style auth flow to sign in.</p>
          <p className="demo-error">{error || '\u00A0'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <div className="demo-profile">
          <strong>{mockUser.name}</strong>
          <span>{mockUser.username}</span>
        </div>

        <h2>Chats</h2>
        <ul>
          {mockChats.map((chat) => (
            <li key={chat}>{chat}</li>
          ))}
        </ul>

        <button type="button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="demo-main">
        <h1>Messenger Demo</h1>
        <p>Demo mode: Telegram features disabled</p>
      </main>
    </div>
  );
}

export default DemoMessengerApp;
