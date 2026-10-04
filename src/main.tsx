import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main>
      <header>
        <p className="eyebrow">Publication status</p>
        <h1>FLOPPY PEPE</h1>
        <p className="status">Blocked — original game files needed</p>
      </header>

      <section aria-labelledby="source-heading">
        <h2 id="source-heading">The game is not available in this export</h2>
        <p>
          Access to the original reference was denied, and this workspace has no game
          source or original assets. To preserve FLOPPY PEPE’s appearance and gameplay,
          the original files are needed before work can continue.
        </p>
        <p>
          Please provide the source files or an accessible repository, including the
          original Pepe, RAM, treasure-chest images and sounds.
        </p>
        <a className="reference-link" href="https://floppy-pepe.bikemcanerkoc.chatgpt.site/">
          Open the original reference
        </a>
        <p className="secondary">The reference may require access from its owner.</p>
      </section>

      <section aria-labelledby="competition-heading">
        <h2 id="competition-heading">The competition is not ready</h2>
        <p>
          Shared scores, player records and daily claims require a connected persistent
          backend. A backend and IPFS publishing connection have not been supplied.
        </p>
        <dl>
          <div><dt>Start date</dt><dd>Not configured</dd></div>
          <div><dt>End date</dt><dd>Not configured</dd></div>
          <div><dt>Published IPFS URL</dt><dd>Not published</dd></div>
        </dl>
        <details>
          <summary>View the required competition setup</summary>
          <div className="details-content">
            <p>
              The launch time must be set on the backend. The competition ends exactly
              10 days later. Final rankings must then freeze, with practice rounds still
              available in the completed game.
            </p>
            <p className="reward">
              The competition lasts 10 days. The player ranked #1 at the end will receive
              5 IMD. The reward will be sent manually by the organizer after the competition ends.
            </p>
            <p>
              This is one total prize of 5 IMD. Daily claims do not transfer IMD or
              increase game scores.
            </p>
            <p>
              The backend must keep stable player identities, verify rounds using
              deterministic input replay, and store rankings and daily claims for all players.
            </p>
          </div>
        </details>
      </section>

      <footer>
        This status page records the missing requirements. The original game has not
        been recreated or published.
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
