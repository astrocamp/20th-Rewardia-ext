import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function MerchantRewards() {
  const [merchant, setMerchant] = useState('');
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  // 商家對應表
  const merchantMap = {
    momo: "momo購物",
    pchome: "pchome",
    eslite: "誠品",
    coupang: "Coupang",
    foodpanda: "foodpanda",
    kkday: "KKday",
    klook: "Klook",
    ".tw": "國內",
  };

  useEffect(() => {
    getMerchantCards();
  }, []);

  // get_current_url 函數
  async function getCurrentUrl() {
    let queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
  }

  // get_rewards 函數
  async function getRewards(merchant) {
    const url = `https://rewardia.net/api/rewards/scope/${merchant}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  // get_merchant_cards 函數邏輯（適配 React）
  async function getMerchantCards() {
    setLoading(true);

    try {
      let curUrl = await getCurrentUrl();
      let merchantKey = Object.keys(merchantMap).find((key) => {
        return curUrl.includes(key);
      });

      let finalMerchant;
      if (curUrl.includes(merchantKey)) {
        finalMerchant = merchantMap[merchantKey];
      } else {
        finalMerchant = "海外";
      }

      setMerchant(finalMerchant);
      const cards = await getRewards(finalMerchant);
      setRewards(cards);
    } catch (error) {
      console.error('載入商家回饋失敗:', error);
      setMerchant('未知商家');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }

  // format_card_rate
  const formatRewardRate = (reward) => {
    if (reward.min_rate && reward.max_rate) {
      return `${reward.min_rate} - ${reward.max_rate}% 回饋`;
    } else if (reward.min_rate == null) {
      return `最高 ${reward.max_rate}% 回饋`;
    } else if (reward.max_rate == null) {
      return `最低 ${reward.min_rate}% 回饋`;
    }
    return '回饋資訊待更新';
  };

  const handleRefresh = () => {
    getMerchantCards();
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          fontFamily: '"Kulim Park", sans-serif',
          padding: '100px 20px 80px 20px',
          maxWidth: '400px',
          margin: '0 auto',
          textAlign: 'center'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}>
          {/* 載入動畫圓點 */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                />
              ))}
            </div>
          </div>

          <motion.div
            style={{
              fontSize: '16px',
              color: '#6b7280',
              fontFamily: '"Kulim Park", sans-serif'
            }}
            animate={{
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          >
            正在偵測商家...
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        fontFamily: '"Kulim Park", sans-serif',
        padding: '100px 20px 80px 20px',
        maxWidth: '400px',
        margin: '0 auto'
      }}
    >
      {/* 標題區域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ marginBottom: '20px', textAlign: 'center' }}
      >
        <h1 style={{
          fontSize: '20px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          color: '#111827',
          fontFamily: '"Kulim Park", sans-serif'
        }}>
          {merchant} 信用卡回饋
        </h1>
      </motion.div>


      {/* 回饋卡片列表 */}
      <div style={{ marginBottom: '20px' }}>
        <AnimatePresence>
          {rewards && rewards.length > 0 ? (
            rewards.map((reward, index) => (
              <motion.div
                key={reward.card?.id || index}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  background: "rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  backdropFilter: "blur(15px)"
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer'
                }}
              >
              <div style={{ marginBottom: '6px' }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0',
                  color: '#1f2937',
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  {reward.card?.name || '卡片名稱待更新'}
                </h2>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#047857',
                fontWeight: '500',
                fontFamily: '"Kulim Park", sans-serif'
              }}>
                {formatRewardRate(reward)}
              </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                textAlign: 'center',
                color: '#4b5563',
                padding: '40px 20px',
                fontSize: '16px',
                fontFamily: '"Kulim Park", sans-serif',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              目前沒有相關回饋資訊
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 重新整理按鈕 */}
      <motion.button
        onClick={handleRefresh}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        whileHover={{
          scale: 1.03,
          background: "rgba(59, 130, 246, 0.35)",
          boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
          backdropFilter: "blur(15px)"
        }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%',
          background: 'rgba(59, 130, 246, 0.25)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '14px 20px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          fontFamily: '"Kulim Park", sans-serif',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)'
        }}
      >
        重新偵測
      </motion.button>
    </motion.div>
  );
}

export default MerchantRewards;