import type { ReactNode } from 'react';
import type { Strings } from '../game/i18n';

interface ControlsProps {
  t: Strings;
  moves: number;
  scrambling: boolean;
  solving: boolean;
  canScramble: boolean;
  canSolve: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onScramble: () => void;
  onSolve: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const icons = {
  scramble: (
    <Icon>
      <path d="M4 7h3.5c2.2 0 3.6 1.2 4.5 3l1 2c.9 1.8 2.3 3 4.5 3H20" />
      <path d="M4 17h3.5c1.4 0 2.5-.5 3.3-1.3M13.2 8.3C14 7.5 15.1 7 16.5 7H20" />
      <path d="m17.5 4.5 2.5 2.5-2.5 2.5M17.5 12.5l2.5 2.5-2.5 2.5" />
    </Icon>
  ),
  solve: (
    <Icon>
      <path d="M12 3.5 13.6 8 18 9.5l-4.4 1.6L12 15.5l-1.6-4.4L6 9.5 10.4 8z" />
      <path d="M18.5 15.5 19.2 17.3 21 18l-1.8.7-.7 1.8-.7-1.8L16 18l1.8-.7z" />
    </Icon>
  ),
  undo: (
    <Icon>
      <path d="M9 7 5 11l4 4" />
      <path d="M5 11h9.5a4.5 4.5 0 0 1 0 9H12" />
    </Icon>
  ),
  redo: (
    <Icon>
      <path d="m15 7 4 4-4 4" />
      <path d="M19 11H9.5a4.5 4.5 0 0 0 0 9H12" />
    </Icon>
  ),
  reset: (
    <Icon>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </Icon>
  ),
};

// Mouse clicks should not leave focus on a button, otherwise Space would press it again.
const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();

function ControlButton({ label, icon, onClick, disabled = false, wide = false }: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={wide ? 'control-button control-button--wide' : 'control-button'}
      onClick={onClick}
      onMouseDown={keepFocus}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
      <span className="control-label">{label}</span>
    </button>
  );
}

export function Controls({
  t,
  moves,
  scrambling,
  solving,
  canScramble,
  canSolve,
  canUndo,
  canRedo,
  onScramble,
  onSolve,
  onReset,
  onUndo,
  onRedo,
}: ControlsProps) {
  return (
    <div className="control-shell glass" role="toolbar" aria-label={t.controls}>
      <ControlButton label={scrambling ? t.scrambling : t.scramble} icon={icons.scramble} onClick={onScramble} disabled={!canScramble} wide />
      <ControlButton label={solving ? t.solving : t.solve} icon={icons.solve} onClick={onSolve} disabled={!canSolve} />
      <span className="control-divider" />
      <ControlButton label={t.undo} icon={icons.undo} onClick={onUndo} disabled={!canUndo} />
      <ControlButton label={t.redo} icon={icons.redo} onClick={onRedo} disabled={!canRedo} />
      <ControlButton label={t.reset} icon={icons.reset} onClick={onReset} />
      <span className="control-divider" />
      <span className="move-count" aria-live="polite">
        <span className="move-count__label">{t.moves}</span>
        <span className="move-count__value">{moves}</span>
      </span>
    </div>
  );
}
