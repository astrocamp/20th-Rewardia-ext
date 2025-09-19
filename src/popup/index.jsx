import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import { initRewardiaPageDetection } from '../shared/utils/login-sync';

// 初始化登入狀態偵測
initRewardiaPageDetection();

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}