import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ApiSession } from "@/lib/api-client";

export interface AuthState {
  session: ApiSession | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  status: "idle",
  error: null
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<ApiSession | null>) => {
      state.session = action.payload;
    },
    logout: (state) => {
      state.session = null;
    }
  }
});

export const { setSession, logout } = authSlice.actions;
export default authSlice.reducer;
