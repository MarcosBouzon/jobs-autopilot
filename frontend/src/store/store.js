import { configureStore } from "@reduxjs/toolkit";
import { api } from "./apiSlice.js";
import setupReducer from "./setupSlice.js";

const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    setup: setupReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export default store;
