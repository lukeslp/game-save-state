/**
 * Game Save State Manager
 *
 * Provides localStorage-based save/load functionality for games
 * with automatic serialization of Set and Map types.
 *
 * @packageDocumentation
 */

/**
 * Metadata stored alongside game state
 */
export interface SaveMeta {
  /** ISO timestamp of save */
  savedAt: string;
  /** Save format version */
  version: string;
  /** Custom metadata from user */
  [key: string]: unknown;
}

/**
 * Complete save data structure
 */
export interface SaveData<T = unknown> {
  /** The saved game state */
  state: T;
  /** Save metadata */
  meta: SaveMeta;
}

/**
 * Configuration options for SaveStateManager
 */
export interface SaveStateManagerOptions {
  /** Show toast notifications (default: true, requires DOM) */
  showToasts?: boolean;
  /** Toast duration in milliseconds (default: 2000) */
  toastDuration?: number;
  /** Storage key prefix (default: 'game_save_') */
  keyPrefix?: string;
  /** Save format version (default: '1.0') */
  version?: string;
}

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info';

/**
 * Internal marker for Set serialization
 */
interface SerializedSet<T = unknown> {
  __type: 'Set';
  data: T[];
}

/**
 * Internal marker for Map serialization
 */
interface SerializedMap<K = unknown, V = unknown> {
  __type: 'Map';
  data: [K, V][];
}

/**
 * Type guard for serialized Set
 */
function isSerializedSet(value: unknown): value is SerializedSet {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as SerializedSet).__type === 'Set' &&
    Array.isArray((value as SerializedSet).data)
  );
}

/**
 * Type guard for serialized Map
 */
function isSerializedMap(value: unknown): value is SerializedMap {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as SerializedMap).__type === 'Map' &&
    Array.isArray((value as SerializedMap).data)
  );
}

/**
 * Game Save State Manager
 *
 * Handles saving and loading game state to localStorage with:
 * - Automatic Set/Map serialization
 * - Metadata tracking (timestamps, versions)
 * - Optional toast notifications
 *
 * @example
 * ```ts
 * const saveManager = new SaveStateManager('my-game');
 *
 * // Save game state
 * saveManager.save({
 *   level: 5,
 *   inventory: new Set(['sword', 'shield']),
 *   stats: new Map([['health', 100], ['mana', 50]])
 * });
 *
 * // Load game state
 * const data = saveManager.load();
 * if (data) {
 *   console.log(data.state.level); // 5
 *   console.log(data.state.inventory.has('sword')); // true
 *   console.log(data.meta.savedAt); // "2026-01-20T..."
 * }
 * ```
 */
export class SaveStateManager<T = unknown> {
  private readonly storageKey: string;
  private readonly options: Required<SaveStateManagerOptions>;

  /**
   * Create a new SaveStateManager
   *
   * @param gameId - Unique identifier for your game
   * @param options - Configuration options
   */
  constructor(gameId: string, options: SaveStateManagerOptions = {}) {
    this.options = {
      showToasts: options.showToasts ?? true,
      toastDuration: options.toastDuration ?? 2000,
      keyPrefix: options.keyPrefix ?? 'game_save_',
      version: options.version ?? '1.0',
    };
    this.storageKey = `${this.options.keyPrefix}${gameId}`;
  }

  /**
   * Save game state to localStorage
   *
   * @param state - Game state to save (can include Set/Map)
   * @param meta - Optional additional metadata
   * @returns true if save succeeded, false otherwise
   */
  save(state: T, meta: Partial<SaveMeta> = {}): boolean {
    try {
      const saveData: SaveData<T> = {
        state: this.serialize(state),
        meta: {
          ...meta,
          savedAt: new Date().toISOString(),
          version: this.options.version,
        },
      };
      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      this.toast('Game saved!', 'success');
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      this.toast('Save failed!', 'error');
      return false;
    }
  }

  /**
   * Load game state from localStorage
   *
   * @returns Save data with state and metadata, or null if no save exists
   */
  load(): SaveData<T> | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const saveData = JSON.parse(data) as SaveData<T>;
      return {
        state: this.deserialize(saveData.state),
        meta: saveData.meta,
      };
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  /**
   * Check if a save exists
   */
  hasSave(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Get save metadata without loading full state
   */
  getMeta(): SaveMeta | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      return (JSON.parse(data) as SaveData<T>).meta;
    } catch {
      return null;
    }
  }

  /**
   * Delete the save
   */
  clear(): void {
    localStorage.removeItem(this.storageKey);
    this.toast('Save cleared', 'info');
  }

  /**
   * Export save as JSON string (for backup/sharing)
   */
  export(): string | null {
    const data = localStorage.getItem(this.storageKey);
    return data;
  }

  /**
   * Import save from JSON string
   *
   * @param json - JSON string from export()
   * @returns true if import succeeded
   */
  import(json: string): boolean {
    try {
      // Validate it's valid JSON
      JSON.parse(json);
      localStorage.setItem(this.storageKey, json);
      this.toast('Save imported!', 'success');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      this.toast('Import failed!', 'error');
      return false;
    }
  }

  /**
   * Serialize state, converting Set/Map to storable format
   */
  private serialize(state: T): T {
    return JSON.parse(
      JSON.stringify(state, (_key, value) => {
        if (value instanceof Set) {
          return { __type: 'Set', data: [...value] } as SerializedSet;
        }
        if (value instanceof Map) {
          return { __type: 'Map', data: [...value] } as SerializedMap;
        }
        return value;
      })
    );
  }

  /**
   * Deserialize state, restoring Set/Map from storage format
   */
  private deserialize(state: T): T {
    return JSON.parse(
      JSON.stringify(state),
      (_key, value) => {
        if (isSerializedSet(value)) {
          return new Set(value.data);
        }
        if (isSerializedMap(value)) {
          return new Map(value.data);
        }
        return value;
      }
    );
  }

  /**
   * Show a toast notification
   */
  private toast(message: string, type: ToastType): void {
    if (!this.options.showToasts) return;
    if (typeof document === 'undefined') return;

    const colors: Record<ToastType, string> = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
    };

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${colors[type]};
      color: white;
      border-radius: 4px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.2s ease-out;
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('game-save-state-styles')) {
      const style = document.createElement('style');
      style.id = 'game-save-state-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), this.options.toastDuration);
  }
}

/**
 * Create a save/load UI with buttons
 *
 * @param saveManager - SaveStateManager instance
 * @param getState - Function that returns current game state
 * @param setState - Function to restore game state
 * @param container - Container element or element ID
 * @returns Object with button references, or null if container not found
 *
 * @example
 * ```ts
 * const saveManager = new SaveStateManager('my-game');
 *
 * createSaveUI(
 *   saveManager,
 *   () => game.getState(),
 *   (state) => game.setState(state),
 *   'save-ui-container'
 * );
 * ```
 */
export function createSaveUI<T>(
  saveManager: SaveStateManager<T>,
  getState: () => T,
  setState: (state: T) => void,
  container: HTMLElement | string
): { saveBtn: HTMLButtonElement; loadBtn: HTMLButtonElement } | null {
  const el = typeof container === 'string'
    ? document.getElementById(container)
    : container;

  if (!el) return null;

  const saveBtn = document.createElement('button');
  saveBtn.innerHTML = '💾 Save';
  saveBtn.setAttribute('aria-label', 'Save game');
  saveBtn.onclick = () => {
    if (saveManager.save(getState())) loadBtn.disabled = false;
  };

  const loadBtn = document.createElement('button');
  loadBtn.innerHTML = '📂 Load';
  loadBtn.setAttribute('aria-label', 'Load game');
  loadBtn.disabled = !saveManager.hasSave();
  loadBtn.onclick = () => {
    const data = saveManager.load();
    if (data) {
      setState(data.state);
      loadBtn.disabled = false;
    }
  };

  const div = document.createElement('div');
  div.style.cssText = 'display: flex; gap: 8px; margin: 8px 0;';
  div.appendChild(saveBtn);
  div.appendChild(loadBtn);
  el.appendChild(div);

  return { saveBtn, loadBtn };
}

// Default export for convenience
export default SaveStateManager;
