import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 創建 Toast Context
const ToastContext = createContext();

// Toast 動畫variants
const toastVariants = {
  hidden: {
    y: -100,
    opacity: 0,
    scale: 0.95
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.4
    }
  },
  exit: {
    y: -100,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.3
    }
  }
};

// Toast 樣式配置
const toastStyles = {
  success: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    textColor: '#065f46',
    icon: '✓'
  },
  error: {
    backgroundColor: '#fecaca',
    borderColor: '#ef4444',
    textColor: '#991b1b',
    icon: '!'
  },
  warning: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    textColor: '#92400e',
    icon: '⚠'
  },
  info: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    textColor: '#1e40af',
    icon: 'i'
  }
};

// Toast Provider 元件
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    // 自動移除
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    showToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast 容器 */}
      <div style={{
        position: 'fixed',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = toastStyles[toast.type] || toastStyles.info;

            return (
              <motion.div
                key={toast.id}
                variants={toastVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => removeToast(toast.id)}
                style={{
                  backgroundColor: style.backgroundColor,
                  border: `1px solid ${style.borderColor}`,
                  color: style.textColor,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: '"Kulim Park", sans-serif',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '250px',
                  maxWidth: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  position: 'relative'
                }}
              >
                {/* 圖示 */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: style.borderColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {style.icon}
                </div>

                {/* 訊息 */}
                <div style={{ flex: 1, lineHeight: '1.4' }}>
                  {toast.message}
                </div>

                {/* 關閉按鈕 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: style.textColor,
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '16px',
                    opacity: 0.7,
                    lineHeight: 1,
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Hook 來使用 Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;