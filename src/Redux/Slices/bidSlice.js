import { createSlice } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

const readUserBids = (userId) => {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(`myBids_${userId}`)) || [];
  } catch {
    return [];
  }
};

const writeUserBids = (userId, bids) => {
  localStorage.setItem(`myBids_${userId}`, JSON.stringify(bids));
};

const initialState = {
  byUser: {},
  deletedByUser: {},
};
const readDeleted = (userId) => {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(`deletedBidCrops_${userId}`)) || [];
  } catch {
    return [];
  }
};

const writeDeleted = (userId, ids) => {
  localStorage.setItem(`deletedBidCrops_${userId}`, JSON.stringify(ids));
};


const bidSlice = createSlice({
  name: "bids",
  initialState,
  reducers: {
    hydrateUserBids: (state, action) => {
      const { userId } = action.payload;
      state.byUser[userId] = readUserBids(userId);
    },

    setUserBids: (state, action) => {
      const { userId, bids } = action.payload;
      state.byUser[userId] = bids;
      writeUserBids(userId, bids);
    },

    upsertUserBid: (state, action) => {
      const { userId, entry } = action.payload;
      const current = state.byUser[userId] ?? readUserBids(userId);
      const idx = current.findIndex((b) => b.id === entry.id);
      if (idx >= 0) current[idx] = entry;
      else current.push(entry);
      state.byUser[userId] = current;
      writeUserBids(userId, current);
    },

    removeUserBid: (state, action) => {
      const { userId, cropId } = action.payload;
      const current = state.byUser[userId] ?? readUserBids(userId);
      const next = current.filter((b) => b.id !== cropId);
      state.byUser[userId] = next;
      writeUserBids(userId, next);
    },
    hydrateDeleted: (state, action) => {
  const { userId } = action.payload;
  state.deletedByUser[userId] = readDeleted(userId);
},

markDeleted: (state, action) => {
  const { userId, cropId } = action.payload;
  const current = state.deletedByUser[userId] ?? readDeleted(userId);
  if (!current.includes(cropId)) current.push(cropId);
  state.deletedByUser[userId] = current;
  writeDeleted(userId, current);
},

unmarkDeleted: (state, action) => {
  const { userId, cropId } = action.payload;
  const current = state.deletedByUser[userId] ?? readDeleted(userId);
  const next = current.filter((id) => id !== cropId);
  state.deletedByUser[userId] = next;
  writeDeleted(userId, next);
},

  }
});

export const {hydrateDeleted, markDeleted, unmarkDeleted , hydrateUserBids, setUserBids, upsertUserBid, removeUserBid } = bidSlice.actions;

// Selectors must return stable references. Do not read localStorage in selectors.
// We hydrate the user's bids/deleted list once when the user becomes available.
export const selectUserBids = (state, userId) => {
  if (!userId) return EMPTY_ARRAY;
  return state.bids.byUser[userId] || EMPTY_ARRAY;
};

export const selectDeletedBidCrops = (state, userId) => {
  if (!userId) return EMPTY_ARRAY;
  return state.bids.deletedByUser[userId] || EMPTY_ARRAY;
};

export default bidSlice.reducer;
