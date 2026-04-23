import { create } from 'zustand';

interface CryptoState {
  // chatId → senderId → chainKey (Uint8Array)
  chainKeys: Map<string, Map<string, Uint8Array>>;
  // messageId → rawKey (Uint8Array) — for direct/per-message encryption
  messageKeys: Map<string, Uint8Array>;
  // chatId → current iteration counter (for our own outgoing messages)
  chainIterations: Map<string, number>;

  setChainKey: (chatId: string, senderId: string, key: Uint8Array) => void;
  getChainKey: (chatId: string, senderId: string) => Uint8Array | undefined;
  setMessageKey: (messageId: string, key: Uint8Array) => void;
  getMessageKey: (messageId: string) => Uint8Array | undefined;
  getNextIteration: (chatId: string) => number;
  incrementIteration: (chatId: string) => void;
  clearAll: () => void;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  chainKeys: new Map(),
  messageKeys: new Map(),
  chainIterations: new Map(),

  setChainKey: (chatId, senderId, key) =>
    set((state) => {
      const updated = new Map(state.chainKeys);
      if (!updated.has(chatId)) {
        updated.set(chatId, new Map());
      }
      updated.get(chatId)!.set(senderId, key);
      return { chainKeys: updated };
    }),

  getChainKey: (chatId, senderId) => get().chainKeys.get(chatId)?.get(senderId),

  setMessageKey: (messageId, key) =>
    set((state) => {
      const updated = new Map(state.messageKeys);
      updated.set(messageId, key);
      return { messageKeys: updated };
    }),

  getMessageKey: (messageId) => get().messageKeys.get(messageId),

  getNextIteration: (chatId) => get().chainIterations.get(chatId) ?? 0,

  incrementIteration: (chatId) =>
    set((state) => {
      const updated = new Map(state.chainIterations);
      updated.set(chatId, (updated.get(chatId) ?? 0) + 1);
      return { chainIterations: updated };
    }),

  clearAll: () =>
    set({
      chainKeys: new Map(),
      messageKeys: new Map(),
      chainIterations: new Map(),
    }),
}));
