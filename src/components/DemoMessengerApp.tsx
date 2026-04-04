import {
  useEffect, useState,
} from '../lib/teact/teact';

import { type DemoSession, getStoredSession, signInWithPhone, signOut } from '../demo/fakeAuth';
import { mockChats, mockUser } from '../demo/mockData';

import '../styles/demoApp.scss';

function DemoMessengerApp() {
  const [session, setSession] = useState<DemoSession | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);


  const handleSignIn = async (e: any) => {
    e.preventDefault();

    setError(undefined);
    setIsLoading(true);

    try {
      const nextSession = await signInWithPhone('+10000000000');
      setSession(nextSession);
    } catch {
      setError('Failed to sign in to demo backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    setSession(undefined);
    setError(undefined);
  };

  if (!session) {
    return (
      <div className="demo-login-page">
        <form className="demo-login-card" onSubmit={handleSignIn}>
          <h1>Sign in</h1>
          <p className="demo-subtitle">Supabase demo access</p>

          <button type="submit" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in to demo'}</button>
          <p className="demo-error">{error || '\u00A0'}</p>
        </form>
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
