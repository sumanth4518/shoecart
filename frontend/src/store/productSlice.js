import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  products: [],
  product: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const getProducts = createAsyncThunk(
  'products/getAll',
  async (filters = {}, thunkAPI) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search.trim());
    if (filters.category && filters.category !== 'All') params.append('category', filters.category.trim());
    if (filters.brand) params.append('brand', filters.brand.trim());
    if (filters.size) params.append('size', filters.size.trim());
    if (filters.min_price) params.append('min_price', filters.min_price);
    if (filters.max_price) params.append('max_price', filters.max_price);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.is_featured) params.append('is_featured', 'true');
    if (filters.is_trending) params.append('is_trending', 'true');
    if (filters.is_new_arrival) params.append('is_new_arrival', 'true');

    const url = `/api/products?${params.toString()}`;
    const maxRetries = 2; // Up to 3 attempts total for waking serverless instances

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          signal: thunkAPI.signal,
          timeout: 45000 // 45s allows waking Render free-tier containers
        });
        return response.data;
      } catch (error) {
        if (axios.isCancel(error) || error.name === 'CanceledError') {
          return thunkAPI.rejectWithValue('ABORTED');
        }

        // Check if server is waking up (Render 502/503/504 or network timeout)
        const isServerWaking = !error.response || 
          error.response.status >= 500 || 
          error.code === 'ECONNABORTED' || 
          error.message?.includes('timeout') || 
          error.message?.includes('Network Error');

        if (attempt < maxRetries && isServerWaking && !thunkAPI.signal.aborted) {
          // Pause 2 seconds before retry to give container time to finish booting
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const message = error.response?.data?.detail || error.message || 'Error fetching products';
        return thunkAPI.rejectWithValue(message);
      }
    }
  }
);

export const getProduct = createAsyncThunk('products/getOne', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`/api/products/${id}`, {
      timeout: 45000
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    return thunkAPI.rejectWithValue(message);
  }
});

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = '';
    },
    clearProduct: (state) => {
      state.product = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.products = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload === 'ABORTED') {
          return;
        }
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.product = action.payload;
      })
      .addCase(getProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearProduct } = productSlice.actions;
export default productSlice.reducer;
