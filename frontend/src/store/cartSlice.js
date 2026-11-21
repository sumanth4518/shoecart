import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  cartItems: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    if (!token) return [];
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get('/api/cart', config);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ productId, variantId, size, quantity = 1 }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post('/api/cart/add', { productId, variantId, size, quantity }, config);
    thunkAPI.dispatch(fetchCart());
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (productId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(`/api/cart/remove/${productId}`, config);
    thunkAPI.dispatch(fetchCart());
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartState: (state) => {
      state.cartItems = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.cartItems = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
