import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store/store';
import { logout } from './store/slices/authSlice';
import { attachAuthToken, onUnauthorized } from './api/client';
import './index.css';

// Wire the shared axios client to the store. The client only sees getters,
// so it stays free of React/Redux imports and avoids circular deps.
attachAuthToken(() => store.getState().auth.token);
onUnauthorized(() => store.dispatch(logout()));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
