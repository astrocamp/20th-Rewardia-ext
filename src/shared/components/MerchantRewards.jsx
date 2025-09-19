import React, { useState, useEffect } from 'react';
import { getCurrentMerchant } from '../utils/merchant-detector';

function MerchantRewards() {
  const [merchant, setMerchant] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 商家名稱對應 API 的對照表（參考原始程式碼）
  const merchantApiMap = {
    'momo購物網': 'momo購物',
    'Shopee蝦皮購物': 'Shopee',
    'PChome 24h購物': 'pchome',
    'Yahoo購物中心': 'Yahoo購物中心',
    'foodpanda': 'foodpanda',
    'KKday': 'KKday',
    'Klook': 'Klook',
    '誠品': '誠品',
    'Coupang': 'Coupang',
    '全家便利商店': '全家',
    '7-ELEVEN': '7-11',
    '全聯福利中心': '全聯',
    '好市多': '好市多',
    '家樂福': '家樂福',
    '星巴克': '星巴克',
    '麥當勞': '麥當勞'
  };

  useEffect(() => {
    detectCurrentMerchantAndFetchRewards();
  }, []);

  const detectCurrentMerchantAndFetchRewards = async () => {
    console.log('🔍 [商家回饋] 開始偵測商家並取得回饋資訊...');
    setLoading(true);
    setError(null);

    try {
      // 偵測當前商家
      const detectedMerchant = await getCurrentMerchant();
      console.log('🏪 [商家回饋] 偵測到商家:', detectedMerchant);
      setMerchant(detectedMerchant);

      // 取得 API 用的商家名稱
      const apiMerchantName = merchantApiMap[detectedMerchant.name] || detectedMerchant.name;
      console.log('📡 [商家回饋] 使用 API 商家名稱:', apiMerchantName);

      // 如果是未知商家，使用「海外」作為預設
      let finalMerchantName = apiMerchantName;
      if (detectedMerchant.name === '未知商家' || detectedMerchant.confidence < 30) {
        finalMerchantName = '海外';
        console.log('🌍 [商家回饋] 使用預設「海外」分類');
      }

      // 取得該商家的回饋資訊
      await fetchRewardsForMerchant(finalMerchantName);

    } catch (error) {
      console.error('💥 [商家回饋] 偵測商家失敗:', error);
      setError('無法偵測當前商家');
      setMerchant({ name: '未知商家', category: '一般' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardsForMerchant = async (merchantName) => {
    console.log(`💳 [商家回饋] 取得「${merchantName}」的回饋資訊...`);

    try {
      const response = await fetch(`https://rewardia.net/api/rewards/scope/${encodeURIComponent(merchantName)}`);

      if (response.ok) {
        const rewardsData = await response.json();
        console.log('✅ [商家回饋] 成功取得回饋資料:', rewardsData);
        setRewards(rewardsData);
      } else {
        console.warn('⚠️ [商家回饋] API 回應錯誤:', response.status);
        // 如果失敗，嘗試使用「海外」作為備選
        if (merchantName !== '海外') {
          console.log('🔄 [商家回饋] 嘗試使用「海外」分類...');
          await fetchRewardsForMerchant('海外');
        } else {
          setError('無法取得回饋資訊');
          setRewards([]);
        }
      }
    } catch (error) {
      console.error('💥 [商家回饋] 取得回饋資料失敗:', error);
      setError('載入回饋資訊時發生錯誤');
      setRewards([]);
    }
  };

  const formatRewardRate = (card) => {
    if (card.min_rate && card.max_rate) {
      return `${card.min_rate} - ${card.max_rate}% 回饋`;
    } else if (card.min_rate == null) {
      return `最高 ${card.max_rate}% 回饋`;
    } else if (card.max_rate == null) {
      return `最低 ${card.min_rate}% 回饋`;
    }
    return '回饋資訊待更新';
  };

  const handleRefresh = () => {
    detectCurrentMerchantAndFetchRewards();
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
          {merchant?.name || '商家'} 信用卡回饋
        </h1>
        {merchant?.category && (
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: '"Kulim Park", sans-serif'
          }}>
            {merchant.category}
          </div>
        )}
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#dc2626',
          fontSize: '14px',
          textAlign: 'center',
          fontFamily: '"Kulim Park", sans-serif'
        }}>
          {error}
        </div>
      )}

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
            {error ? '載入失敗' : '目前沒有相關回饋資訊'}
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