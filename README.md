# game-save-state

LocalStorage-based game save state manager with automatic Set/Map serialization and optional toast notifications.

**Zero dependencies. TypeScript-first. ~3KB minified.**

## Features

- **Set/Map Serialization**: Automatically handles JavaScript Set and Map types
- **Metadata Tracking**: Timestamps, version numbers, custom metadata
- **Toast Notifications**: Optional visual feedback for save/load operations
- **Export/Import**: Backup and share save files as JSON
- **TypeScript**: Full type safety with generics
- **Accessible**: Toast notifications include ARIA attributes

## Installation

```bash
npm install game-save-state
# or
pnpm add game-save-state
# or
yarn add game-save-state
```

## Quick Start

```typescript
import { SaveStateManager } from 'game-save-state';

// Create manager for your game
const saveManager = new SaveStateManager('my-awesome-game');

// Your game state (can include Set/Map!)
const gameState = {
  level: 5,
  score: 1200,
  inventory: new Set(['sword', 'shield', 'potion']),
  upgrades: new Map([
    ['attack', 3],
    ['defense', 2],
  ]),
};

// Save
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

## API Reference

### SaveStateManager

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
```

### Options

```typescript
interface SaveStateManagerOptions {
  showToasts?: boolean;    // Show toast notifications (default: true)
  toastDuration?: number;  // Toast duration in ms (default: 2000)
  keyPrefix?: string;      // Storage key prefix (default: 'game_save_')
  version?: string;        // Save format version (default: '1.0')
}
```

### Types

```typescript
interface SaveData<T> {
  state: T;
  meta: SaveMeta;
}

interface SaveMeta {
  savedAt: string;    // ISO timestamp
  version: string;    // Save format version
  [key: string]: unknown;  // Custom metadata
}
```

## Examples

### With Custom Options

```typescript
const saveManager = new SaveStateManager('my-game', {
  showToasts: false,      // Disable toast notifications
  keyPrefix: 'myapp_',    // Custom storage prefix
  version: '2.0',         // Track save format version
});
```

### With TypeScript Generics

```typescript
interface GameState {
  level: number;
  inventory: Set<string>;
  stats: Map<string, number>;
}

const saveManager = new SaveStateManager<GameState>('my-game');

// Now fully type-safe!
const data = saveManager.load();
if (data) {
  const level: number = data.state.level;  // ✓ Type-safe
}
```

### Custom Metadata

```typescript
saveManager.save(gameState, {
  checkpoint: 'boss-battle',
  playtime: 3600,
});

const meta = saveManager.getMeta();
console.log(meta?.checkpoint); // 'boss-battle'
```

### Export/Import (Backup)

```typescript
// Export save to share or backup
const json = saveManager.export();
if (json) {
  // Save to file, send to server, etc.
  downloadFile('save.json', json);
}

// Import save
const uploaded = await readFile();
saveManager.import(uploaded);
```

### Quick UI Setup

```typescript
import { SaveStateManager, createSaveUI } from 'game-save-state';

const saveManager = new SaveStateManager('my-game');

// Creates Save/Load buttons in #controls element
createSaveUI(
  saveManager,
  () => game.getState(),       // Get current state
  (state) => game.setState(state),  // Restore state
  'controls'                   // Container element ID
);
```

### Disabling Toasts (Server-Side)

```typescript
// For SSR or Node.js environments
const saveManager = new SaveStateManager('my-game', {
  showToasts: false,  // Required when no DOM available
});
```

## Why Set/Map Serialization?

JavaScript's `JSON.stringify()` doesn't handle Set or Map:

```javascript
JSON.stringify({ items: new Set([1, 2, 3]) });
// Result: {"items":{}}  ❌ Lost data!
```

game-save-state automatically preserves them:

```javascript
saveManager.save({ items: new Set([1, 2, 3]) });
const data = saveManager.load();
data.state.items;  // Set { 1, 2, 3 }  ✓ Preserved!
```

## Storage Format

Saves are stored as JSON with special markers for Set/Map:

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

## Browser Support

Works in all modern browsers with localStorage support:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge 12+
- IE 8+ (limited)

## License

MIT

## Credits

Author: Luke Steuber ([@lukesteuber](https://bsky.app/profile/lukesteuber.com))

Battle-tested across 10+ browser games at [dr.eamer.dev/games](https://dr.eamer.dev/games)
