import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createRound, hop, step, STEP, WIDTH, HEIGHT } from './engine';
import { draw } from './art';
import { readProfile, saveProfile } from './storage';
import type { Profile } from './storage';
import { tone } from './sound';
import './styles.css';

type Phase = 'ready' | 'playing' | 'paused' | 'over';
type Modal = 'info' | 'stats' | 'name' | 'share' | null;
const prize = 'The competition lasts 10 days. The player ranked #1 at the end will receive 5 IMD. The reward will be sent manually by the organizer after the competition ends.';
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    arrow: 'M5 12h14m-6-6 6 6-6 6', share: 'M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8',
    reset: 'M4 9a8 8 0 1 1 0 7M4 3v6h6', info: 'M12 10v7m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    stats: 'M5 20V12m7 8V4m7 16V8', sound: 'm11 5-6 4H2v6h3l6 4V5m4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
    mute: 'm11 5-6 4H2v6h3l6 4V5m5 4 6 6m0-6-6 6', trophy: 'M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H3v3a4 4 0 0 0 5 4m8-7h5v3a4 4 0 0 1-5 4m-4 2v6m-4 0h8',
    external: 'M13 4h7v7m0-7L10 14M10 4H4v16h16v-6', close: 'm6 6 12 12M18 6 6 18', edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
    pause: 'M8 5v14M16 5v14', play: 'm8 4 12 8-12 8V4Z', check: 'm5 12 4 4L19 6',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg>;
}

function App() {
  const [profile, setProfile] = useState<Profile>(readProfile);
  const profileRef = useRef(profile);
  const [storageOk, setStorageOk] = useState(true);
  const [phase, setPhase] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready');
  const round = useRef(createRound());
  const canvas = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [nickname, setNickname] = useState(profile.nickname);
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [newBest, setNewBest] = useState(false);
  const paint = useCallback(() => {
    const context = canvas.current?.getContext('2d');
    if (context) draw(context, round.current, phaseRef.current === 'ready');
  }, []);
  const changePhase = useCallback((value: Phase) => { phaseRef.current = value; setPhase(value); }, []);
  const persist = useCallback((p: Profile) => {
    profileRef.current = p; setProfile(p); setStorageOk(saveProfile(p));
  }, []);
  const beep = useCallback((kind: 'hop' | 'point' | 'end') => { if (profileRef.current.sound) tone(kind); }, []);
  const start = useCallback(() => {
    round.current = createRound(); hop(round.current); setScore(0); setLevel(1); setNewBest(false); setMessage(''); changePhase('playing');
    canvas.current?.focus({ preventScroll: true }); beep('hop'); paint();
  }, [beep, changePhase, paint]);
  const flap = useCallback(() => {
    if (phaseRef.current === 'playing') { hop(round.current); beep('hop'); }
  }, [beep]);
  const pause = useCallback(() => { if (phaseRef.current === 'playing') changePhase('paused'); }, [changePhase]);
  const resume = () => { changePhase('playing'); canvas.current?.focus({ preventScroll: true }); };
  const open = (type: Modal) => { pause(); setMessage(''); setModal(type); };

  useEffect(() => { setStorageOk(saveProfile(profileRef.current)); paint(); }, [paint]);
  useEffect(() => {
    let frame = 0, previous = performance.now(), elapsed = 0;
    function tick(now: number) {
      const dt = Math.min(now - previous, 100); previous = now;
      if (phaseRef.current === 'playing') {
        elapsed += dt;
        while (elapsed >= STEP && round.current.alive) {
          const oldScore = round.current.score;
          step(round.current); elapsed -= STEP;
          if (round.current.score !== oldScore) { setScore(round.current.score); setLevel(round.current.level); beep('point'); }
        }
        paint();
        if (!round.current.alive) {
          changePhase('over'); beep('end');
          const r = round.current, p = profileRef.current;
          setNewBest(r.score > p.best);
          persist({ ...p, best: Math.max(p.best, r.score), rounds: p.rounds + 1, total: p.total + r.score, gold: p.gold + r.gold, topLevel: Math.max(p.topLevel, r.level) });
        }
      } else elapsed = 0;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [beep, changePhase, paint, persist]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (dialog.current?.open) return;
      const target = event.target as HTMLElement;
      if (event.code === 'Escape') { pause(); return; }
      if (target.closest('input,textarea,button,a,summary')) return;
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        if (!event.repeat) { if (phaseRef.current === 'playing') flap(); else if (phaseRef.current === 'ready') start(); }
      }
    };
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('keydown', keydown);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility); };
  }, [flap, start, pause]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);

  const shareText = `I scored ${profile.best} in FLOPPY PEPE practice mode. One more hop?`;
  const share = async () => {
    pause();
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try { await navigator.share({ title: 'FLOPPY PEPE', text: shareText, url }); return; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${shareText} ${url}`); setMessage('Game link copied. Ready to share.'); }
    catch { setModal('share'); }
  };
  const sound = () => {
    const enabled = !profile.sound;
    if (enabled && !tone('on')) { setMessage('Sound is unavailable in this browser. You can keep playing.'); return; }
    persist({ ...profile, sound: enabled });
  };

  return <>
    <a className="skip-link" href="#game">Skip to game</a>
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#" aria-label="FLOPPY PEPE home"><img src="./pepe.svg" width="30" height="30" alt="" /><span>FLOPPY PEPE</span></a>
        <span className="topbar-note">ONE FROG. INFINITE RETRIES.</span>
        <a className="board-link" href="#leaderboard"><Icon name="trophy" /><span>Leaderboard</span><span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <section className="intro" aria-labelledby="title">
          <div><div className="eyebrow"><span className="tiny-square" />THE INTERNET’S LITTLE ARCADE</div><h1 id="title">FLOPPY <span>PEPE</span><span className="title-spark" aria-hidden="true">✳</span></h1><p>Small frog. Big hops. <span>How far can you go?</span></p></div>
          <div className="intro-side"><span className="mode-badge"><span />Practice mode</span><span>FREE TO PLAY · NO LOGIN</span></div>
        </section>

        <div className="play-layout">
          <aside className="claim-panel" aria-labelledby="claim-title">
            <div className="panel-kicker"><span>YOUR DAILY LITTLE WIN</span><span aria-hidden="true">✦</span></div>
            <div className="claim-heading"><h2 id="claim-title">Daily Claim</h2><span className="day-tag">DAY 1</span></div>
            <img className="chest" src="./chest.svg" width="112" height="88" alt="A little golden treasure chest" />
            <p className="claim-subtitle">Come back. Keep the streak.</p>
            <div className="streak" aria-label="Streak preview: Day 1, Day 2, Day 3, and onward"><div className="first-day"><span>01</span><small>DAY</small></div><div><span>02</span><small>DAY</small></div><div><span>03</span><small>DAY</small></div><div><span>···</span><small>MORE</small></div></div>
            <button className="claim-button" disabled>Claims not open yet <Icon name="pause" size={15} /></button>
            <p className="claim-explainer">Daily claims need shared storage.<br /> Nothing is being claimed or saved.</p>
            <div className="claim-foot"><Icon name="info" size={14} /><span>A daily streak. No IMD or score bonus.</span></div>
          </aside>

          <section id="game" className="cabinet" aria-label="FLOPPY PEPE arcade" tabIndex={-1}>
            <div className="cabinet-top"><span><span className="power-light" />FLOPPY PEPE</span><span>ARCADE / 01</span></div>
            <div className="scoreboard">
              <div><span>SCORE</span><strong id="score">{String(score).padStart(2, '0')}</strong></div>
              <div><span><Icon name="trophy" size={12} /> BEST</span><strong>{String(profile.best).padStart(2, '0')}</strong></div>
              <div><span>LEVEL</span><strong id="level">{String(level).padStart(2, '0')}</strong></div>
              <button className="pause-button" onClick={phase === 'paused' ? resume : pause} disabled={phase !== 'playing' && phase !== 'paused'} aria-label={phase === 'paused' ? 'Resume game' : 'Pause game'}><Icon name={phase === 'paused' ? 'play' : 'pause'} /></button>
            </div>
            <div className="screen" data-phase={phase}>
              <canvas ref={canvas} width={WIDTH} height={HEIGHT} tabIndex={0} role="img" aria-label="Game field. Tap, click, or press Space to hop. Avoid RAM, the ceiling and the ground." aria-describedby="game-help" onPointerDown={event => { event.preventDefault(); canvas.current?.focus({ preventScroll: true }); if (phase === 'ready') start(); else flap(); }}>Your browser needs canvas support to play.</canvas>
              <span className="screen-label" aria-hidden="true">PRACTICE / {phase === 'playing' ? 'GO GO GO' : 'NO PRESSURE'}</span>
              {phase !== 'playing' && <div className={`game-overlay ${phase === 'ready' ? 'welcome' : ''}`}>
                {phase === 'ready' ? <><span className="overlay-kicker">READY, LITTLE FROG?</span><h2>One more<br /><span>hop.</span></h2><p>Stay floppy. Dodge the RAM.</p><button className="primary" onClick={start}>Play <Icon name="play" size={16} /></button><span className="overlay-hint">TAP / CLICK / SPACE</span></> :
                  phase === 'paused' ? <><span className="overlay-kicker">TAKE A BREATHER</span><h2>Paused.</h2><p>Your round is right here.</p><button className="primary" onClick={resume}>Resume <Icon name="play" size={16} /></button></> :
                    <><span className="overlay-kicker">{newBest ? 'A NEW PERSONAL BEST!' : 'THERE’S ALWAYS ANOTHER HOP'}</span><h2>Nice try.</h2><p className="round-result"><b>{score}</b> POINTS <span>LEVEL {level}</span></p><button className="primary" onClick={start}>Play again <Icon name="reset" size={17} /></button><span className="overlay-hint">{round.current.reason.toUpperCase()} COLLISION · PRACTICE ROUND</span></>}
              </div>}
            </div>
            <div className="level-track"><div role="progressbar" aria-label="Points toward next level" aria-valuemin={0} aria-valuemax={10} aria-valuenow={score % 10}><span style={{ width: `${(score % 10) * 10}%` }} /></div><span>{10 - score % 10} TO LEVEL {level + 1}</span></div>
            <nav className="arcade-controls" aria-label="Arcade controls">
              <button onClick={share}><Icon name="share" /><span>SHARE</span></button>
              <button onClick={start}><Icon name="reset" /><span>RESET</span></button>
              <a href="https://imd.fun" target="_blank" rel="noreferrer" aria-label="IMD (opens in a new tab)"><Icon name="external" /><span>IMD</span></a>
              <button onClick={() => open('info')}><Icon name="info" /><span>INFO</span></button>
              <button onClick={() => open('stats')}><Icon name="stats" /><span>STATS</span></button>
              <button className="sound-button" onClick={sound} aria-label="Sound" aria-pressed={profile.sound}><Icon name={profile.sound ? 'sound' : 'mute'} /><span>{profile.sound ? 'ON' : 'OFF'}</span></button>
            </nav>
          </section>

          <div className="how-to" id="game-help"><span className="eyebrow">A QUICK FIELD GUIDE</span><h2>Simple hops.<br />Serious reflexes.</h2><div><span className="guide-icon">↥</span><p><b>Tap to take flight</b><span>Click or press <kbd>Space</kbd> to hop.</span></p></div><div><span className="ram-icon" aria-hidden="true" /><p><b>Find your gap</b><span>Green RAM +1. Gold RAM +3.</span></p></div><div><span className="guide-icon">⌁</span><p><b>Keep your cool</b><span>Every 10 points, things speed up.<br />Moving gaps start at level 3.</span></p></div></div>
        </div>

        <div className="under-game"><span><span className="small-dot" />Practice freely. Your best stays on this device.</span><span>NO COINS. JUST COMMITMENT.</span></div>
        <div role="status" className={`notification ${message || !storageOk ? 'visible' : ''}`}>{message || (!storageOk ? 'Device storage is unavailable. Your stats will last for this visit only.' : '')}</div>

        <section id="leaderboard" className="leaderboard" aria-labelledby="board-title">
          <div className="board-header"><div className="board-title"><Icon name="trophy" size={23} /><h2 id="board-title">10-DAY LEADERBOARD</h2><span className="status-chip">Not started</span></div><div className="player-name"><span>PLAYING AS</span><button onClick={() => { setNickname(profile.nickname); setNameError(''); open('name'); }}>{profile.nickname}<Icon name="edit" size={14} /></button></div></div>
          <div className="table-wrap"><table><thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">Score</th><th scope="col">Level</th></tr></thead><tbody><tr><td colSpan={4}><div className="board-empty"><span className="empty-icon"><Icon name="trophy" size={26} /></span><div><h3>The board is taking a breather.</h3><p>Shared score recording isn’t connected.<br />Enjoy practice rounds while the competition gets ready.</p></div></div></td></tr></tbody></table></div>
          <div className="competition-note"><span className="prize-label"><Icon name="trophy" size={17} /><strong>ONE WINNER. 5 IMD.</strong></span><p>{prize}</p></div>
          <div className="competition-status"><span>Competition not operational. Launch time has not been set.</span><button className="text-button" onClick={() => open('info')}>How it works <Icon name="arrow" size={14} /></button></div>
        </section>
      </main>
      <footer><a className="footer-brand" href="#">FLOPPY PEPE<span aria-hidden="true">✳</span></a><span>Made for “one more try.”</span><span>HOP. FAIL. REPEAT.</span></footer>
    </div>
    <div className="sr-only" role="status">{phase === 'over' ? `Round over. ${score} points. Level ${level}. ${newBest ? 'New best.' : ''}` : phase === 'paused' ? 'Game paused.' : ''}</div>
    <dialog ref={dialog} onCancel={() => setModal(null)} onClose={() => setModal(null)} aria-labelledby="dialog-title" onClick={event => { if (event.target === dialog.current) setModal(null); }}>
      <div className="dialog-content"><div className="dialog-heading"><h2 id="dialog-title">{modal === 'stats' ? 'Your practice stats' : modal === 'name' ? 'Pick your player name' : modal === 'share' ? 'Share a little floppy' : 'A little arcade know-how'}</h2><button className="icon-button" aria-label="Close dialog" onClick={() => setModal(null)}><Icon name="close" /></button></div>
        {modal === 'stats' && <><p>Saved on this device. These are practice records, not competition entries.</p><dl className="stats-grid"><div><dt>BEST SCORE</dt><dd>{profile.best}</dd></div><div><dt>TOP LEVEL</dt><dd>{profile.topLevel}</dd></div><div><dt>ROUNDS PLAYED</dt><dd>{profile.rounds}</dd></div><div><dt>GOLD RAM PASSED</dt><dd>{profile.gold}</dd></div></dl><p className="small-text">RESET starts a fresh round and keeps these stats. Clearing browser storage removes your practice profile.</p></>}
        {modal === 'name' && <form onSubmit={event => { event.preventDefault(); const value = nickname.trim(); if (!value) { setNameError('Enter a name between 1 and 20 characters.'); event.currentTarget.querySelector('input')?.focus(); return; } persist({ ...profile, nickname: value }); setModal(null); setMessage('Player name saved on this device.'); }}><label htmlFor="nickname">Player name</label><input id="nickname" name="nickname" autoComplete="nickname" maxLength={20} value={nickname} autoFocus onChange={event => { setNickname(event.target.value); setNameError(''); }} aria-invalid={Boolean(nameError)} aria-describedby="nickname-help" /><p id="nickname-help" className={nameError ? 'error' : 'small-text'}>{nameError || '1–20 characters. Your practice name stays on this device.'}</p><button className="primary" type="submit">Save name <Icon name="check" /></button></form>}
        {modal === 'share' && <><p>Copy this message and send a friend a new high-score challenge.</p><label htmlFor="share-message">Game link and score</label><textarea id="share-message" readOnly rows={4} onFocus={event => event.target.select()} value={`${shareText} ${window.location.href.split('#')[0]}`} /></>}
        {modal === 'info' && <div className="info-content"><h3>How to play</h3><p>Tap the game, click, or press Space / ↑ to hop. Avoid the ceiling, ground and RAM. Green RAM gives 1 point; gold RAM gives 3. Every 10 points raises your level: speed increases, gaps narrow, and moving gaps begin at level 3.</p><p>Use Pause or Escape to take a break. Switching tabs pauses your round. RESET starts only the current round again.</p><h3>Practice mode is open</h3><p>No login, wallet or entry fee. Nicknames, best scores and stats are saved only on this device. They are not verified competition records.</p><h3>The 10-day competition</h3><p>{prize}</p><p>The competition has not started. Shared identities, verified scores, rankings and claims require a persistent backend. Hosting access to a score service with durable storage is still required; no launch time is configured.</p><p>Once connected, a public launch time starts exactly 10 days. Each player’s highest verified score ranks; equal scores use earliest achievement. Scores freeze at the end, and practice stays open.</p><h3>Daily Claim</h3><p>Claims are disabled until they can be saved server-side. One claim per UTC calendar day starts at Day 1. Consecutive days increase your streak; missing a day resets it to Day 1. Claims give no IMD and no game-score bonus.</p></div>}
      </div>
    </dialog>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
