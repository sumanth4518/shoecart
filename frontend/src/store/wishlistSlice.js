import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  items: [],
  isLoading: false,
  isError: false,
  message: '',
};

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    if (!token) return [];
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get('/api/wishlist', config);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const addToWishlist = createAsyncThunk('wishlist/addToWishlist', async (productId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post('/api/wishlist/add', { productId }, config);
    thunkAPI.dispatch(fetchWishlist());
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const removeFromWishlist = createAsyncThunk('wishlist/removeFromWishlist', async (productId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(`/api/wishlist/remove/${productId}`, config);
    thunkAPI.dispatch(fetchWishlist());
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
