export type Profile = { id: string; nickname: string; best: number; rounds: number; total: number; gold: number; topLevel: number; sound: boolean };
const key = 'floppy-pepe-profile-v1';
export function readProfile(): Profile {
  const empty: Profile = { id: crypto.randomUUID(), nickname: 'Player', best: 0, rounds: 0, total: 0, gold: 0, topLevel: 1, sound: false };
  try {
    const p = JSON.parse(localStorage.getItem(key) || 'null');
    if (!p || typeof p !== 'object') return empty;
    for (const field of ['best', 'rounds', 'total', 'gold', 'topLevel'] as const) if (Number.isSafeInteger(p[field]) && p[field] >= 0) empty[field] = p[field];
    if (typeof p.id === 'string' && p.id.length < 80) empty.id = p.id;
    if (typeof p.nickname === 'string' && p.nickname.trim()) empty.nickname = p.nickname.slice(0, 20);
    empty.sound = p.sound === true;
  } catch { /* Storage can be unavailable in privacy mode; the game still works. */ }
  return empty;
}
export function saveProfile(p: Profile) { try { localStorage.setItem(key, JSON.stringify(p)); return true; } catch { return false; } }
