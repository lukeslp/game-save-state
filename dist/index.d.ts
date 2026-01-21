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
export declare class SaveStateManager<T = unknown> {
    private readonly storageKey;
    private readonly options;
    /**
     * Create a new SaveStateManager
     *
     * @param gameId - Unique identifier for your game
     * @param options - Configuration options
     */
    constructor(gameId: string, options?: SaveStateManagerOptions);
    /**
     * Save game state to localStorage
     *
     * @param state - Game state to save (can include Set/Map)
     * @param meta - Optional additional metadata
     * @returns true if save succeeded, false otherwise
     */
    save(state: T, meta?: Partial<SaveMeta>): boolean;
    /**
     * Load game state from localStorage
     *
     * @returns Save data with state and metadata, or null if no save exists
     */
    load(): SaveData<T> | null;
    /**
     * Check if a save exists
     */
    hasSave(): boolean;
    /**
     * Get save metadata without loading full state
     */
    getMeta(): SaveMeta | null;
    /**
     * Delete the save
     */
    clear(): void;
    /**
     * Export save as JSON string (for backup/sharing)
     */
    export(): string | null;
    /**
     * Import save from JSON string
     *
     * @param json - JSON string from export()
     * @returns true if import succeeded
     */
    import(json: string): boolean;
    /**
     * Serialize state, converting Set/Map to storable format
     */
    private serialize;
    /**
     * Deserialize state, restoring Set/Map from storage format
     */
    private deserialize;
    /**
     * Show a toast notification
     */
    private toast;
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
export declare function createSaveUI<T>(saveManager: SaveStateManager<T>, getState: () => T, setState: (state: T) => void, container: HTMLElement | string): {
    saveBtn: HTMLButtonElement;
    loadBtn: HTMLButtonElement;
} | null;
export default SaveStateManager;
//# sourceMappingURL=index.d.ts.map