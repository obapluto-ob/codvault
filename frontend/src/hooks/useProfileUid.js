import { useState } from 'react';

const KEY = 'codvault_uid';

export function useProfileUid() {
  const [uid, setUidState] = useState(() => localStorage.getItem(KEY) || '');
  const setUid = (v) => { localStorage.setItem(KEY, v); setUidState(v); };
  const clearUid = () => { localStorage.removeItem(KEY); setUidState(''); };
  return { uid, setUid, clearUid };
}
