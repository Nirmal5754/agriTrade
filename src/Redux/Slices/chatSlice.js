import { createSlice } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

const readChat = (key) => {
  if (!key) return [];
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const writeChat = (key, messages) => {
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(messages));
};

const initialState = {
  byKey: {}
};

const chatSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    hydrateChat: (state, action) => {
      const { key } = action.payload;
      state.byKey[key] = readChat(key);
    },

    setChatMessages: (state, action) => {
      const { key, messages } = action.payload;
      state.byKey[key] = messages;
      writeChat(key, messages);
    },

    appendChatMessage: (state, action) => {
      const { key, message } = action.payload;
      const current = state.byKey[key] ?? readChat(key);
      const next = [...current, message];
      state.byKey[key] = next;
      writeChat(key, next);
    }
  }
});

export const { hydrateChat, setChatMessages, appendChatMessage } = chatSlice.actions;

// Selectors must return stable references. Do not read localStorage in selectors.
// Components should dispatch hydrateChat({ key }) once they know the key.
export const selectChatMessages = (state, key) =>
  key ? state.chats.byKey[key] || EMPTY_ARRAY : EMPTY_ARRAY;

export default chatSlice.reducer;
