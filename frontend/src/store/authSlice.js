import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Validate and load user session strictly if a valid authentication token exists
const loadStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
      const parsed = JSON.parse(rawUser);
      if (parsed && (parsed.token || parsed.access_token)) {
        return parsed;
      }
      localStorage.removeItem('user');
    }
  } catch (e) {
    localStorage.removeItem('user');
  }
  return null;
};

const initialState = {
  user: loadStoredUser(),
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    const response = await axios.post('/api/auth/register', userData);
    // Note: Do NOT store user in localStorage on register; verification via OTP is required first
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
  try {
    const response = await axios.post('/api/auth/login', userData);
    if (response.data && response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async (otpData, thunkAPI) => {
  try {
    const response = await axios.post('/api/auth/verify-otp', otpData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('user');
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    updateUserState: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Do not set state.user here: registration requires OTP verification before user session is active
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload && action.payload.token) {
          state.user = action.payload;
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { reset, updateUserState } = authSlice.actions;
export default authSlice.reducer;
