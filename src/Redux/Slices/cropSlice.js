import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from "reselect";

const STORAGE_KEY = "allCrops";
const safeReadAllCrops = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const safeWriteAllCrops = (crops) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err };
  }
};

const initialState = {
  allCrops: safeReadAllCrops(),
  persistError: null, // { type: "quota" | "unknown", message: string } | null
};

const cropsSlice = createSlice({
  name: "crops",
  initialState,
  reducers: {

    setCrops: (state, action) => {
      const prevPersisted = safeReadAllCrops();
      state.allCrops = action.payload;

      const res = safeWriteAllCrops(state.allCrops);
      if (!res.ok) {
        // Keep Redux state consistent with what is actually persisted.
        state.allCrops = prevPersisted;
        state.persistError = {
          type: res.error?.name === "QuotaExceededError" ? "quota" : "unknown",
          message: String(res.error?.message || res.error || "Persist failed"),
        };
      } else {
        state.persistError = null;
      }
    },

    addCrop: (state, action) => {
      state.allCrops.push(action.payload);

      const res = safeWriteAllCrops(state.allCrops);
      if (!res.ok) {
        // Undo the push so UI doesn't show a crop that wasn't saved.
        state.allCrops.pop();
        state.persistError = {
          type: res.error?.name === "QuotaExceededError" ? "quota" : "unknown",
          message: String(res.error?.message || res.error || "Persist failed"),
        };
      } else {
        state.persistError = null;
      }
    },

    updateCrop: (state, action) => {
      const prevPersisted = safeReadAllCrops();
      const index = state.allCrops.findIndex(
        c => c.id === action.payload.id
      );

      if(index !== -1){
        state.allCrops[index] = action.payload;
      }

      const res = safeWriteAllCrops(state.allCrops);
      if (!res.ok) {
        state.allCrops = prevPersisted;
        state.persistError = {
          type: res.error?.name === "QuotaExceededError" ? "quota" : "unknown",
          message: String(res.error?.message || res.error || "Persist failed"),
        };
      } else {
        state.persistError = null;
      }
    },

    removeCrop: (state, action) => {
      const prevPersisted = safeReadAllCrops();
      state.allCrops = state.allCrops.filter(
        c => c.id !== action.payload
      );

      const res = safeWriteAllCrops(state.allCrops);
      if (!res.ok) {
        state.allCrops = prevPersisted;
        state.persistError = {
          type: res.error?.name === "QuotaExceededError" ? "quota" : "unknown",
          message: String(res.error?.message || res.error || "Persist failed"),
        };
      } else {
        state.persistError = null;
      }
    }

  }
});

export const {
  setCrops,
  addCrop,
  updateCrop,
  removeCrop,
 
} = cropsSlice.actions;

export const selectAllCrops = (state) => state.crops.allCrops;

export const selectUserCrops = createSelector(
  [selectAllCrops, (_, userId) => userId],
 (crops, userId) =>
  userId ? crops.filter((crop) => crop.ownerId === userId) : []
);

export const selectUserCropsWithStatus = createSelector(
  [selectUserCrops],
  (crops) => {
    const now = Date.now();

    return crops.map((crop) => {
      let status = "Not Started";

      if (crop.auctionStartTime && crop.auctionEndTime) {
        if (now >= crop.auctionStartTime && now < crop.auctionEndTime) {
          status = "Active";
        } else if (now >= crop.auctionEndTime) {
          status = "Ended";
        }
      }

      return { ...crop, auctionStatus: status };
    });
  }
);
export default cropsSlice.reducer;
