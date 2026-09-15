# game-save-state

LocalStorage save manager with automatic Set/Map serialization.

Zero runtime dependencies. Includes TypeScript declarations. Requires browser
`localStorage`; optional buttons and notifications also require the DOM.

## Installation

This package is distributed separately from its private development repository.
The previous npm release was unpublished; no registry version is available as
of September 15, 2026. If you have the package archive, install it in your project:

```bash
npm install /path/to/game-save-state-1.0.1.tgz
```

The imports below work with the installed archive. A local archive does not
require access to the development repository. Questions or bug reports:
[luke@lukesteuber.com](mailto:luke@lukesteuber.com).

## Quick Start

```typescript
import { SaveStateManager } from 'game-save-state';

// Save state (handles Set/Map automatically)
const gameState = {
  level: 5,
  score: 1200,
  inventory: new Set(['sword', 'shield', 'potion']),
  upgrades: new Map([['attack', 3], ['defense', 2]]),
};

const saveManager = new SaveStateManager<typeof gameState>('my-game');
saveManager.save(gameState);

// Load
const data = saveManager.load();
if (data) {
  console.log(data.state.level);                    // 5
  console.log(data.state.inventory.has('sword'));   // true
  console.log(data.state.upgrades.get('attack'));   // 3
  console.log(data.meta.savedAt);                   // "2026-01-20T..."
}
```

## Why?

`JSON.stringify()` destroys Set and Map:

```javascript
JSON.stringify({ items: new Set([1, 2, 3]) });
// {"items":{}}  ← data lost
```

game-save-state preserves them:

```javascript
saveManager.save({ items: new Set([1, 2, 3]) });
saveManager.load().state.items;  // Set { 1, 2, 3 } ✓
```

## API

```typescript
class SaveStateManager<T = unknown> {
  constructor(gameId: string, options?: SaveStateManagerOptions);

  save(state: T, meta?: Partial<SaveMeta>): boolean;
  load(): SaveData<T> | null;
  hasSave(): boolean;
  getMeta(): SaveMeta | null;
  clear(): void;
  export(): string | null;
  import(json: string): boolean;
}

interface SaveStateManagerOptions {
  showToasts?: boolean;    // Toast notifications (default: true)
  toastDuration?: number;  // Duration in ms (default: 2000)
  keyPrefix?: string;      // Storage key prefix (default: 'game_save_')
  version?: string;        // Save format version (default: '1.0')
}
```

## Options

```typescript
const saveManager = new SaveStateManager('my-game', {
  showToasts: false,      // Disable toast notifications
  keyPrefix: 'myapp_',    // Custom storage prefix
  version: '2.0',         // Track save format version
});
```

## TypeScript Generics

```typescript
interface GameState {
  level: number;
  inventory: Set<string>;
  stats: Map<string, number>;
}

const saveManager = new SaveStateManager<GameState>('my-game');
const data = saveManager.load();
// data.state is fully typed
```

## Custom Metadata

```typescript
saveManager.save(gameState, {
  checkpoint: 'boss-battle',
  playtime: 3600,
});

const meta = saveManager.getMeta();
console.log(meta?.checkpoint); // 'boss-battle'
```

## Export/Import

```typescript
// Backup
const json = saveManager.export();
downloadFile('save.json', json);

// Restore
const uploaded = await readFile();
saveManager.import(uploaded);
```

## Quick UI

```typescript
import { SaveStateManager, createSaveUI } from 'game-save-state';

const saveManager = new SaveStateManager('my-game');

createSaveUI(
  saveManager,
  () => game.getState(),
  (state) => game.setState(state),
  'controls'  // container element ID
);
```

## Storage Format

```json
{
  "state": {
    "level": 5,
    "inventory": { "__type": "Set", "data": ["sword", "shield"] },
    "upgrades": { "__type": "Map", "data": [["attack", 3]] }
  },
  "meta": {
    "savedAt": "2026-01-20T12:00:00.000Z",
    "version": "1.0"
  }
}
```

## License

MIT

—Luke Steuber ([@lukesteuber](https://bsky.app/profile/lukesteuber.com))
