import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/endpoints';
import { clearSession, getStoredUser, getToken, saveSession } from '../lib/auth';

/**
 * Guards a screen behind a valid token. Renders nothing until `ready`,
 * so a signed-out visitor never sees a flash of the app.
 */
export default function useSession({ redirectTo = '/' } = {}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace(redirectTo);
      return;
    }
    // Show the cached user immediately, then confirm with the server.
    setUser(getStoredUser());
    setReady(true);

    auth.me()
      .then((fresh) => {
        setUser(fresh);
        saveSession({ token: getToken(), user: fresh });
      })
      .catch(() => { /* the api interceptor handles a rejected token */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    router.replace(redirectTo);
  }, [router, redirectTo]);

  return { user, setUser, ready, signOut };
}
