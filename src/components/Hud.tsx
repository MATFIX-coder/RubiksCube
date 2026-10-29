import { useEffect, useState } from 'react';
import type { CubeMove } from '../cube/types';
import type { Strings } from '../game/i18n';
import { DIFFICULTIES, formatTime, type AllRecords, type Difficulty, type Language } from '../game/records';
import type { Phase, SolveResult } from '../game/session';

const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();

interface TopBarProps {
  t: Strings;
  language: Language;
  difficulty: Difficulty;
  difficultyLocked: boolean;
  onDifficulty: (difficulty: Difficulty) => void;
  onLanguage: (language: Language) => void;
  onHelp: () => void;
}

export function TopBar({ t, language, difficulty, difficultyLocked, onDifficulty, onLanguage, onHelp }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="segmented glass" role="radiogroup">
        {DIFFICULTIES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === difficulty}
            className={option === difficulty ? 'segment segment--active' : 'segment'}
            onClick={() => onDifficulty(option)}
            onMouseDown={keepFocus}
            disabled={difficultyLocked}
            title={t.difficultyHint[option]}
          >
            {t.difficulty[option]}
          </button>
        ))}
      </div>
      <div className="pill-group glass">
        <button
          type="button"
          className="pill-button"
          onClick={() => onLanguage(language === 'ru' ? 'en' : 'ru')}
          onMouseDown={keepFocus}
          aria-label={t.language}
          title={t.language}
        >
          {language === 'ru' ? 'RU' : 'EN'}
        </button>
        <span className="pill-divider" />
        <button type="button" className="pill-button" onClick={onHelp} onMouseDown={keepFocus} aria-label={t.help} title={t.help}>
          ?
        </button>
      </div>
    </div>
  );
}

function LiveTime({ startAt, endAt }: { startAt: number | null; endAt: number | null }) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (startAt === null || endAt !== null) return;
    let frame = 0;
    const tick = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [startAt, endAt]);

  const elapsed = startAt === null ? 0 : (endAt ?? now) - startAt;
  return <>{formatTime(elapsed)}</>;
}

interface StatusPanelProps {
  t: Strings;
  phase: Phase;
  startAt: number | null;
  endAt: number | null;
  result: SolveResult | null;
  records: AllRecords;
  difficulty: Difficulty;
  onAgain: () => void;
}

function RecordLine({ t, records, difficulty }: { t: Strings; records: AllRecords; difficulty: Difficulty }) {
  const entry = records[difficulty];
  if (entry.bestTimeMs === null) return <div className="status-sub">{t.noRecord}</div>;
  return (
    <div className="status-sub">
      {t.best} {formatTime(entry.bestTimeMs)}
      {entry.bestMoves !== null && <> · {entry.bestMoves} {t.bestMoves}</>}
      <span className="status-dot">·</span>
      {t.solves} {entry.solves}
    </div>
  );
}

export function StatusPanel({ t, phase, startAt, endAt, result, records, difficulty, onAgain }: StatusPanelProps) {
  if (phase === 'solved' && result && result.kind !== 'free') {
    const timed = result.kind === 'timed';
    return (
      <div key={result.key} className="status-panel status-panel--card glass">
        <div className="status-title">{timed ? t.solved : t.solvedAuto}</div>
        {timed && result.timeMs !== null && <div className="status-time status-time--big">{formatTime(result.timeMs)}</div>}
        <div className="status-sub">
          {t.moves}: {result.moves} · {t.difficulty[result.difficulty]}
        </div>
        {(result.newBestTime || result.newBestMoves) && (
          <div className="record-badges">
            {result.newBestTime && <span className="record-badge">★ {t.newRecord}</span>}
            {result.newBestMoves && <span className="record-badge">★ {t.newMovesRecord}</span>}
          </div>
        )}
        <button type="button" className="again-button" onClick={onAgain} onMouseDown={keepFocus}>
          {t.again}
        </button>
      </div>
    );
  }

  const timerVisible = phase === 'ready' || phase === 'running';
  return (
    <div className="status-panel">
      {timerVisible && (
        <div className={phase === 'running' ? 'status-time' : 'status-time status-time--muted'}>
          <LiveTime startAt={phase === 'running' ? startAt : null} endAt={endAt} />
        </div>
      )}
      {phase === 'ready' ? <div className="status-sub status-sub--accent">{t.ready}</div> : <RecordLine t={t} records={records} difficulty={difficulty} />}
    </div>
  );
}

export function SolvedToast({ t, result }: { t: Strings; result: SolveResult | null }) {
  if (!result || result.kind !== 'free') return null;
  return (
    <div key={result.key} className="solved-toast">
      {t.solvedFree}
    </div>
  );
}

export function MoveStrip({ moves, scramble }: { moves: readonly CubeMove[]; scramble: boolean }) {
  const visible = moves.slice(-14);
  const hidden = moves.length - visible.length;
  return (
    <div className={scramble ? 'move-strip move-strip--scramble' : 'move-strip'} aria-hidden="true">
      {hidden > 0 && <span className="move-strip__more">…</span>}
      {visible.map((move, index) => (
        <span
          key={hidden + index}
          className={index === visible.length - 1 ? 'move-token move-token--last' : 'move-token'}
        >
          {move.notation.replace("'", '′')}
        </span>
      ))}
    </div>
  );
}

export function Hint({ t }: { t: Strings }) {
  return (
    <div className="hint">
      <span>{t.hintDrag}</span>
      <span className="hint__dot">·</span>
      <span>{t.hintOrbit}</span>
      <span className="hint__dot hint__desktop">·</span>
      <span className="hint__desktop">{t.hintKeys}</span>
    </div>
  );
}

export function HelpOverlay({ t, onClose }: { t: Strings; onClose: () => void }) {
  return (
    <div className="help-backdrop" onClick={onClose}>
      <div className="help-card glass" role="dialog" aria-modal="true" aria-label={t.helpTitle} onClick={(event) => event.stopPropagation()}>
        <div className="help-head">
          <h2>{t.helpTitle}</h2>
          <button type="button" className="pill-button" onClick={onClose} aria-label={t.close} autoFocus>
            ✕
          </button>
        </div>
        <dl className="help-list">
          {t.helpRows.map(([key, action]) => (
            <div key={key} className="help-row">
              <dt><kbd>{key}</kbd></dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
        <p className="help-note">{t.helpNotation}</p>
      </div>
    </div>
  );
}
