import {
  useEffect, useMemo, useState,
} from '../lib/teact/teact';

import { type DemoSession, getStoredSession, getTestCredentials, signIn, signOut } from '../demo/fakeAuth';
import { mockChats, mockUser } from '../demo/mockData';

import '../styles/demoApp.scss';

function DemoMessengerApp() {
  const [session, setSession] = useState<DemoSession | undefined>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  const credentialsHint = useMemo(() => {
    const credentials = getTestCredentials();
    return `Test account: ${credentials.username} / ${credentials.password}`;
  }, []);

  const handleSignIn = (e: any) => {
    e.preventDefault();

    const nextSession = signIn(username, password);

    if (!nextSession) {
      setError('Invalid username or password.');
      return;
    }

    setError(undefined);
    setSession(nextSession);
  };

  const handleLogout = () => {
    signOut();
    setSession(undefined);
    setUsername('');
    setPassword('');
    setError(undefined);
  };

  if (!session) {
    return (
      <div className="demo-login-page">
        <form className="demo-login-card" onSubmit={handleSignIn}>
          <h1>Sign in</h1>
          <p className="demo-subtitle">Local demo access</p>

          <label htmlFor="demo-username">Username</label>
          <input
            id="demo-username"
            autoComplete="username"
            value={username}
            onInput={(e) => setUsername((e.currentTarget as HTMLInputElement).value)}
          />

          <label htmlFor="demo-password">Password</label>
          <input
            id="demo-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onInput={(e) => setPassword((e.currentTarget as HTMLInputElement).value)}
          />

          <button type="submit">Sign in</button>
          <p className="demo-error">{error || '\u00A0'}</p>
          <p className="demo-hint">{credentialsHint}</p>
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
