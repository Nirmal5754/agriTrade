import { configureStore } from "@reduxjs/toolkit";

import authReducer from './Slices/authSlice'
import chatsReducer from './Slices/chatSlice'
import bidsReducer from './Slices/bidSlice'
import cropsReducer from './Slices/cropSlice'


export const store = configureStore({
  reducer: {
    auth: authReducer,
    crops: cropsReducer,
    bids: bidsReducer,
    chats: chatsReducer
  },
  devTools : true
});