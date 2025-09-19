import React, { useState, useEffect } from 'react';

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
      <div style={{
        fontFamily: '"Kulim Park", sans-serif',
        padding: '100px 20px 80px 20px',
        maxWidth: '400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}>
          <div style={{
            fontSize: '16px',
            color: '#6b7280',
            fontFamily: '"Kulim Park", sans-serif'
          }}>
            正在偵測商家...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: '"Kulim Park", sans-serif',
      padding: '100px 20px 80px 20px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      {/* 標題區域 */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: '700',
          margin: '0 0 8px 0',
          color: '#111827',
          fontFamily: '"Kulim Park", sans-serif'
        }}>
          {merchant} 信用卡回饋
        </h1>
      </div>


      {/* 回饋卡片列表 */}
      <div style={{ marginBottom: '20px' }}>
        {rewards && rewards.length > 0 ? (
          rewards.map((reward, index) => (
            <div
              key={reward.card?.id || index}
              style={{
                background: '#f3f4f6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5e7eb';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0',
                  color: '#111827',
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  {reward.card?.name || '卡片名稱待更新'}
                </h2>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#059669',
                fontWeight: '500',
                fontFamily: '"Kulim Park", sans-serif'
              }}>
                {formatRewardRate(reward)}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '40px 20px',
            fontSize: '16px',
            fontFamily: '"Kulim Park", sans-serif',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
目前沒有相關回饋資訊
          </div>
        )}
      </div>

      {/* 重新整理按鈕 */}
      <button
        onClick={handleRefresh}
        style={{
          width: '100%',
          backgroundColor: '#2060b9',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: '"Kulim Park", sans-serif'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#1d4ed8';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#2060b9';
          e.target.style.transform = 'translateY(0)';
        }}
      >
        重新偵測
      </button>
    </div>
  );
}

export default MerchantRewards;