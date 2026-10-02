interface ControlsProps {
  moves: number;
  busy: boolean;
  canUndo: boolean;
  scrambling: boolean;
  onScramble: () => void;
  onReset: () => void;
  onUndo: () => void;
}

export function Controls({ moves, busy, canUndo, scrambling, onScramble, onReset, onUndo }: ControlsProps) {
  return (
    <div className="control-shell" aria-label="Cube controls">
      <button type="button" onClick={onScramble} disabled={busy}>
        {scrambling ? 'Scrambling' : 'Scramble'}
      </button>
      <span className="control-divider" />
      <button type="button" onClick={onReset}>Reset</button>
      <button type="button" onClick={onUndo} disabled={busy || !canUndo}>Undo</button>
      <span className="move-count">Moves&nbsp; {moves}</span>
    </div>
  );
}
