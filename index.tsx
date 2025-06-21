
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store'; // Assuming store is configured in store/index.ts
import App from './App';

// Log environment variable for Gemini API key (for debugging purposes, remove in production)
// console.log("Gemini API Key (process.env.API_KEY):", process.env.API_KEY ? "Loaded" : "Not Loaded or Empty");
// if (!process.env.API_KEY) {
//   alert("Gemini API Key (API_KEY) is not set in the environment. AI features will be disabled.");
// }

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to. Ensure an element with id='root' exists in your HTML.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Provider store={store} children={<App />} />
  </React.StrictMode>
);