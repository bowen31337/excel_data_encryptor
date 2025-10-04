/**
 * Main entry point for Excel Data Encryptor
 */

import { ConfigProvider } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

// Configure Ant Design theme
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
