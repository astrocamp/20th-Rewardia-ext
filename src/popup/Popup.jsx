import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import homeIcon from '../shared/images/account/icon/home.svg';
import giftIcon from '../shared/images/account/icon/gift.svg';
import userIcon from '../shared/images/account/icon/user.svg';
import calculatorIcon from '../shared/images/account/icon/calculator.svg';
import LoginPage from '../shared/components/LoginPage'
import MerchantRewards from '../shared/components/MerchantRewards'
import Calculator from '../shared/components/Calculator'
import '../shared/login.css'

export default function Popup() {
  const [active, setActive] = useState('account') // 預設顯示帳號頁面
  const [showCalculatorOverlay, setShowCalculatorOverlay] = useState(false)

  // 動畫 variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const calculatorVariants = {
    hidden: {
      x: "100%",
      opacity: 0,
      scale: 0.95
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 }
      }
    },
    exit: {
      x: "100%",
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <div style={{
      width: '360px',
      height: '520px',
      background: 'white',
      color: '#111827',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        height: '56px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f2937',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          letterSpacing: '0.025em'
        }}>REWARDIA</div>

        {/* 右上角浮動試算器按鈕 */}
        <motion.button
          onClick={() => setShowCalculatorOverlay(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'absolute',
            right: '16px',
            width: '36px',
            height: '36px',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
          }}
        >
          <img
            src={calculatorIcon}
            alt="試算器"
            style={{
              width: '20px',
              height: '20px',
              filter: 'brightness(0) saturate(100%) invert(100%)'
            }}
          />
        </motion.button>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'white'
      }}>
        {active === 'home' && (
          <section style={{padding: '16px'}}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>REWARDIA 首頁</h2>
            <p style={{
              color: '#6b7280',
              margin: '0 0 20px 0',
              lineHeight: '1.5'
            }}>歡迎回來！這裡會顯示你的常用功能與快速入口。</p>

            {/* 快速功能區域 */}
            <div style={{
              display: 'grid',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {/* 優惠試算按鈕 */}
              <button
                onClick={() => setShowCalculatorOverlay(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1d4ed8';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#2563eb';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                }}
              >
                <img
                  src={calculatorIcon}
                  alt="計算器"
                  style={{
                    width: '20px',
                    height: '20px',
                    filter: 'brightness(0) saturate(100%) invert(100%)'
                  }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>優惠試算</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>計算信用卡回饋金額</div>
                </div>
              </button>

            </div>

            {/* 使用提示 */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              color: '#0369a1'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 使用提示</div>
              <div>點擊「優惠試算」開始計算你的信用卡回饋，或切換到「商家回饋」查看當前網站的優惠資訊。</div>
            </div>
          </section>
        )}
        {active === 'rewards' && (
          <div style={{height: '100%'}}>
            <MerchantRewards />
          </div>
        )}
        {active === 'account' && (
          <div style={{height: '100%'}}>
            <LoginPage />
          </div>
        )}
      </main>

      {/* Navbar */}
      <nav style={{
        height: '64px',
        background: 'white',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        boxSizing: 'border-box',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            color: active === 'home' ? '#2563eb' : '#6b7280',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setActive('home')} aria-label="首頁"
        >
          <img
            src={homeIcon}
            alt="首頁"
            style={{
              width: '16px',
              height: '16px',
              filter: active === 'home' ? 'brightness(0) saturate(100%) invert(28%) sepia(77%) saturate(4475%) hue-rotate(208deg)' : 'brightness(0) saturate(100%) invert(42%)',
              transform: active === 'home' ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s, filter 0.2s'
            }}
          />
          <span>首頁</span>
        </button>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            color: active === 'rewards' ? '#2563eb' : '#6b7280',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setActive('rewards')} aria-label="商家回饋"
        >
          <img
            src={giftIcon}
            alt="商家回饋"
            style={{
              width: '16px',
              height: '16px',
              filter: active === 'rewards' ? 'brightness(0) saturate(100%) invert(28%) sepia(77%) saturate(4475%) hue-rotate(208deg)' : 'brightness(0) saturate(100%) invert(42%)',
              transform: active === 'rewards' ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s, filter 0.2s'
            }}
          />
          <span>商家回饋</span>
        </button>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            color: active === 'account' ? '#2563eb' : '#6b7280',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setActive('account')} aria-label="帳號"
        >
          <img
            src={userIcon}
            alt="帳號"
            style={{
              width: '16px',
              height: '16px',
              filter: active === 'account' ? 'brightness(0) saturate(100%) invert(28%) sepia(77%) saturate(4475%) hue-rotate(208deg)' : 'brightness(0) saturate(100%) invert(42%)',
              transform: active === 'account' ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s, filter 0.2s'
            }}
          />
          <span>帳號</span>
        </button>
      </nav>

      {/* 浮動試算器 Overlay */}
      <AnimatePresence>
        {showCalculatorOverlay && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setShowCalculatorOverlay(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000
              }}
            />

            {/* 試算器面板 */}
            <motion.div
              variants={calculatorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'fixed',
                top: '16px',
                right: '16px',
                width: '320px',
                height: '480px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                zIndex: 1001,
                overflow: 'hidden'
              }}
            >
              {/* 關閉按鈕 */}
              <button
                onClick={() => setShowCalculatorOverlay(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#666',
                  zIndex: 1002
                }}
              >
                ×
              </button>

              {/* 試算器內容 */}
              <Calculator
                isVisible={true}
                onClose={() => setShowCalculatorOverlay(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}