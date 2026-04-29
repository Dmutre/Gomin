import { create } from 'zustand';

interface CryptoState {
  // chatId → senderId → chainKey
  chainKeys: Map<string, Map<string, Uint8Array<ArrayBuffer>>>;
  // messageId → rawKey — for direct/per-message encryption
  messageKeys: Map<string, Uint8Array<ArrayBuffer>>;
  // chatId → current iteration counter (for our own outgoing messages)
  chainIterations: Map<string, number>;

  setChainKey: (chatId: string, senderId: string, key: Uint8Array<ArrayBuffer>) => void;
  getChainKey: (chatId: string, senderId: string) => Uint8Array<ArrayBuffer> | undefined;
  setMessageKey: (messageId: string, key: Uint8Array<ArrayBuffer>) => void;
  getMessageKey: (messageId: string) => Uint8Array<ArrayBuffer> | undefined;
  getNextIteration: (chatId: string) => number;
  incrementIteration: (chatId: string) => void;
  clearChat: (chatId: string) => void;
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

  clearChat: (chatId) =>
    set((state) => {
      const chainKeys = new Map(state.chainKeys);
      chainKeys.delete(chatId);
      const chainIterations = new Map(state.chainIterations);
      chainIterations.delete(chatId);
      return { chainKeys, chainIterations };
    }),

  clearAll: () =>
    set({
      chainKeys: new Map(),
      messageKeys: new Map(),
      chainIterations: new Map(),
    }),
}));
