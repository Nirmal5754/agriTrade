import { createSlice } from "@reduxjs/toolkit";

const readList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const writeList = (key, list) => {
  localStorage.setItem(key, JSON.stringify(list));
};

const initialState = {
  user: JSON.parse(localStorage.getItem("loggedInUser")) || null,
  farmers: readList("farmers"),
  buyers: readList("buyers"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateUsers: (state) => {
      state.farmers = readList("farmers");
      state.buyers = readList("buyers");
    },

    registerUser: (state, action) => {
      const { role, user } = action.payload;

      if (role === "farmer") {
        state.farmers.push(user);
        writeList("farmers", state.farmers);
        // Keep old key structure (even if you later stop using it)
        localStorage.setItem(`farmerCrops_${user.id}`, JSON.stringify([]));
      } else {
        state.buyers.push(user);
        writeList("buyers", state.buyers);
        // Keep old key structure (even if you later stop using it)
        localStorage.setItem(`buyerData_${user.id}`, JSON.stringify([]));
      }
    },

    loginUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("loggedInUser", JSON.stringify(action.payload));
    },

    logoutUser: (state) => {
      state.user = null;
      localStorage.removeItem("loggedInUser");
    },
  },
});

export const {
  hydrateUsers,
  registerUser,
  loginUser,
  logoutUser,
} = authSlice.actions;

export const selectFarmers = (state) => state.auth.farmers;
export const selectBuyers = (state) => state.auth.buyers;

export default authSlice.reducer;
