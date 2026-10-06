// The browser's one steering session (organism-infra/139). Module-level so a React remount cannot redeem the
// launch code twice; the code is single-use. Production passes sessionStorage: per tab, never sent on its own.
import { useEffect, useState } from "react";
import { createSession, NO_SESSION_MESSAGE } from "./session.mjs";

let shared = null;
const browserSession = () =>
  (shared ??= createSession({
    fetch: window.fetch.bind(window),
    storage: window.sessionStorage,
    location: window.location,
    history: window.history,
  }));

export function useSession() {
  const session = browserSession();
  const [state, setState] = useState(session.state);
  useEffect(() => {
    const off = session.subscribe(setState);
    session.start();
    setState(session.state);
    return off;
  }, [session]);
  return { session, state, message: state === "none" ? NO_SESSION_MESSAGE : null };
}
