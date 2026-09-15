/**
 * Game Save State Manager
 *
 * Provides localStorage-based save/load functionality for games
 * with automatic serialization of Set and Map types.
 *
 * @packageDocumentation
 */
/**
 * Type guard for serialized Set
 */
function isSerializedSet(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.__type === 'Set' &&
        Array.isArray(value.data));
}
/**
 * Type guard for serialized Map
 */
function isSerializedMap(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.__type === 'Map' &&
        Array.isArray(value.data));
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
export class SaveStateManager {
    /**
     * Create a new SaveStateManager
     *
     * @param gameId - Unique identifier for your game
     * @param options - Configuration options
     */
    constructor(gameId, options = {}) {
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
    save(state, meta = {}) {
        try {
            const saveData = {
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
        }
        catch (e) {
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
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data)
                return null;
            const saveData = JSON.parse(data);
            return {
                state: this.deserialize(saveData.state),
                meta: saveData.meta,
            };
        }
        catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }
    /**
     * Check if a save exists
     */
    hasSave() {
        return localStorage.getItem(this.storageKey) !== null;
    }
    /**
     * Get save metadata without loading full state
     */
    getMeta() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data)
                return null;
            return JSON.parse(data).meta;
        }
        catch {
            return null;
        }
    }
    /**
     * Delete the save
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        this.toast('Save cleared', 'info');
    }
    /**
     * Export save as JSON string (for backup/sharing)
     */
    export() {
        const data = localStorage.getItem(this.storageKey);
        return data;
    }
    /**
     * Import save from JSON string
     *
     * @param json - JSON string from export()
     * @returns true if import succeeded
     */
    import(json) {
        try {
            // Validate it's valid JSON
            JSON.parse(json);
            localStorage.setItem(this.storageKey, json);
            this.toast('Save imported!', 'success');
            return true;
        }
        catch (e) {
            console.error('Import failed:', e);
            this.toast('Import failed!', 'error');
            return false;
        }
    }
    /**
     * Serialize state, converting Set/Map to storable format
     */
    serialize(state) {
        return JSON.parse(JSON.stringify(state, (_key, value) => {
            if (value instanceof Set) {
                return { __type: 'Set', data: [...value] };
            }
            if (value instanceof Map) {
                return { __type: 'Map', data: [...value] };
            }
            return value;
        }));
    }
    /**
     * Deserialize state, restoring Set/Map from storage format
     */
    deserialize(state) {
        return JSON.parse(JSON.stringify(state), (_key, value) => {
            if (isSerializedSet(value)) {
                return new Set(value.data);
            }
            if (isSerializedMap(value)) {
                return new Map(value.data);
            }
            return value;
        });
    }
    /**
     * Show a toast notification
     */
    toast(message, type) {
        if (!this.options.showToasts)
            return;
        if (typeof document === 'undefined')
            return;
        const colors = {
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
export function createSaveUI(saveManager, getState, setState, container) {
    const el = typeof container === 'string'
        ? document.getElementById(container)
        : container;
    if (!el)
        return null;
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '💾 Save';
    saveBtn.setAttribute('aria-label', 'Save game');
    saveBtn.onclick = () => {
        if (saveManager.save(getState()))
            loadBtn.disabled = false;
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
