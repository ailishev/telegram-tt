import { useMemo, useState } from '../../lib/teact/teact';

import { getTestCredentials, signIn } from '../../demo/fakeAuth';

import '../../styles/demoApp.scss';

type Props = {
  onAuthSuccess: () => void;
};

function DemoLogin({ onAuthSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  const credentialsHint = useMemo(() => {
    const credentials = getTestCredentials();
    return `Test account: ${credentials.username} / ${credentials.password}`;
  }, []);

  const handleSignIn = (event: any) => {
    event.preventDefault();

    if (!signIn(username, password)) {
      setError('Invalid username or password.');
      return;
    }

    setError(undefined);
    onAuthSuccess();
  };

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

export default DemoLogin;
