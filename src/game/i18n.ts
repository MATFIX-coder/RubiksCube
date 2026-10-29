import type { Difficulty, Language } from './records';

export interface Strings {
  readonly scramble: string;
  readonly scrambling: string;
  readonly solve: string;
  readonly solving: string;
  readonly undo: string;
  readonly redo: string;
  readonly reset: string;
  readonly moves: string;
  readonly difficulty: Record<Difficulty, string>;
  readonly difficultyHint: Record<Difficulty, string>;
  readonly best: string;
  readonly bestMoves: string;
  readonly solves: string;
  readonly noRecord: string;
  readonly ready: string;
  readonly solved: string;
  readonly solvedFree: string;
  readonly solvedAuto: string;
  readonly newRecord: string;
  readonly newMovesRecord: string;
  readonly again: string;
  readonly hintDrag: string;
  readonly hintOrbit: string;
  readonly hintKeys: string;
  readonly help: string;
  readonly helpTitle: string;
  readonly helpRows: readonly (readonly [string, string])[];
  readonly helpNotation: string;
  readonly close: string;
  readonly language: string;
  readonly controls: string;
}

export const STRINGS: Record<Language, Strings> = {
  ru: {
    scramble: 'Перемешать',
    scrambling: 'Мешаю…',
    solve: 'Собрать',
    solving: 'Собираю…',
    undo: 'Назад',
    redo: 'Вперёд',
    reset: 'Сброс',
    moves: 'Ходы',
    difficulty: { easy: 'Легко', medium: 'Средне', hard: 'Сложно' },
    difficultyHint: { easy: '5 ходов перемешивания', medium: '12 ходов перемешивания', hard: '22 хода — как на соревнованиях' },
    best: 'Рекорд',
    bestMoves: 'ходов',
    solves: 'Сборок',
    noRecord: 'Рекорда пока нет',
    ready: 'Первый ход запустит таймер',
    solved: 'Собран!',
    solvedFree: 'Собран',
    solvedAuto: 'Собран автоматически',
    newRecord: 'Новый рекорд времени',
    newMovesRecord: 'Рекорд по ходам',
    again: 'Ещё раз',
    hintDrag: 'Тяни за кубик — повернёшь слой',
    hintOrbit: 'Тяни по фону — повернёшь камеру',
    hintKeys: 'Клавиши R U F L D B',
    help: 'Помощь',
    helpTitle: 'Управление',
    helpRows: [
      ['Тянуть за кубик', 'Повернуть слой'],
      ['Тянуть по фону', 'Повернуть камеру'],
      ['Колесо / щипок', 'Приблизить или отдалить'],
      ['R L U D F B', 'Повернуть грань: правую, левую, верхнюю, нижнюю, переднюю, заднюю'],
      ['M E S', 'Повернуть средний слой'],
      ['Shift + буква', 'Тот же ход в обратную сторону'],
      ['Пробел', 'Перемешать'],
      ['Ctrl+Z / Ctrl+Y', 'Ход назад / вперёд'],
      ['Esc', 'Сбросить кубик'],
      ['H или ?', 'Открыть эту подсказку'],
    ],
    helpNotation: 'Грани называются относительно того, как ты смотришь на кубик: F — ближняя к тебе. Буква без штриха — поворот по часовой стрелке, если смотреть на эту грань; со штрихом (R′) — против часовой.',
    close: 'Закрыть',
    language: 'Язык',
    controls: 'Управление кубиком',
  },
  en: {
    scramble: 'Scramble',
    scrambling: 'Scrambling…',
    solve: 'Solve',
    solving: 'Solving…',
    undo: 'Undo',
    redo: 'Redo',
    reset: 'Reset',
    moves: 'Moves',
    difficulty: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    difficultyHint: { easy: '5-move scramble', medium: '12-move scramble', hard: '22 moves — competition length' },
    best: 'Best',
    bestMoves: 'moves',
    solves: 'Solves',
    noRecord: 'No record yet',
    ready: 'Your first move starts the timer',
    solved: 'Solved!',
    solvedFree: 'Solved',
    solvedAuto: 'Solved automatically',
    newRecord: 'New best time',
    newMovesRecord: 'Fewest moves',
    again: 'Again',
    hintDrag: 'Drag the cube to turn a layer',
    hintOrbit: 'Drag the background to orbit',
    hintKeys: 'Keys R U F L D B',
    help: 'Help',
    helpTitle: 'Controls',
    helpRows: [
      ['Drag on the cube', 'Turn a layer'],
      ['Drag the background', 'Orbit the camera'],
      ['Wheel / pinch', 'Zoom in or out'],
      ['R L U D F B', 'Turn the right, left, up, down, front or back face'],
      ['M E S', 'Turn a middle slice'],
      ['Shift + letter', 'Same move, opposite direction'],
      ['Space', 'Scramble'],
      ['Ctrl+Z / Ctrl+Y', 'Undo / redo'],
      ['Esc', 'Reset the cube'],
      ['H or ?', 'Show this help'],
    ],
    helpNotation: 'Faces are named from your point of view: F is the face closest to you. A plain letter turns that face clockwise as seen from it; a prime (R′) turns it counter-clockwise.',
    close: 'Close',
    language: 'Language',
    controls: 'Cube controls',
  },
};
