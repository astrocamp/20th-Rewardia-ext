// 回饋資料 API 層

const API_BASE_URL = 'https://rewardia.net/api';

/**
 * 取得特定商家的信用卡回饋資料
 * @param {string} merchantName - 商家名稱
 * @returns {Promise<Array>} 回饋資料陣列
 */
export const getMerchantRewards = async (merchantName) => {
  console.log('🔍 [API] 開始取得商家回饋資料:', merchantName);

  try {
    // 使用正確的 API 端點格式（參考 Chrome 擴充功能）
    const response = await fetch(`${API_BASE_URL}/rewards/scope/${encodeURIComponent(merchantName)}`);

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [API] 成功取得真實資料:', data);

    // 檢查回傳資料格式（這應該是陣列）
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.rewards && Array.isArray(data.rewards)) {
      return data.rewards;
    } else {
      console.warn('⚠️ [API] 回傳資料格式不正確，使用模擬資料');
      throw new Error('API 資料格式錯誤');
    }
  } catch (error) {
    console.warn('⚠️ [API] 無法取得回饋資料，使用模擬資料:', error);

    // 回傳模擬資料
    const mockData = getMockRewards(merchantName);
    console.log('🎭 [API] 回傳模擬資料:', mockData);
    return mockData;
  }
};

/**
 * 取得所有信用卡列表
 * @returns {Promise<Array>} 信用卡列表
 */
export const getCreditCards = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cards`);

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    return data.cards || [];
  } catch (error) {
    console.warn('無法取得信用卡資料，使用模擬資料:', error);

    // 回傳模擬資料
    return getMockCreditCards();
  }
};

/**
 * 模擬回饋資料
 * @param {string} merchantName - 商家名稱
 * @returns {Array} 模擬回饋資料
 */
const getMockRewards = (merchantName) => {
  const baseRewards = [
    {
      id: 1,
      cardName: '台新玫瑰 Giving 卡',
      bankName: '台新銀行',
      rewardRate: '3%',
      category: '網購',
      conditions: '每月上限 300 元回饋',
      color: '#E91E63'
    },
    {
      id: 2,
      cardName: '富邦 J卡',
      bankName: '富邦銀行',
      rewardRate: '2%',
      category: '一般消費',
      conditions: '無上限',
      color: '#2196F3'
    },
    {
      id: 3,
      cardName: '中信英雄聯盟卡',
      bankName: '中國信託',
      rewardRate: '5%',
      category: '指定通路',
      conditions: '每月上限 200 元',
      color: '#FF9800'
    }
  ];

  // 根據商家調整回饋率
  if (merchantName) {
    const lowerMerchant = merchantName.toLowerCase();

    if (lowerMerchant.includes('momo') || lowerMerchant.includes('shopee')) {
      baseRewards[0].rewardRate = '5%';
      baseRewards[0].conditions = '網購加碼回饋';
    } else if (lowerMerchant.includes('pchome') || lowerMerchant.includes('yahoo')) {
      baseRewards[1].rewardRate = '4%';
      baseRewards[1].conditions = '電商平台加碼';
    }
  }

  return baseRewards;
};

/**
 * 模擬信用卡資料
 * @returns {Array} 模擬信用卡列表
 */
const getMockCreditCards = () => {
  return [
    {
      id: 1,
      name: '台新玫瑰 Giving 卡',
      bank: '台新銀行',
      annualFee: '首年免年費',
      features: ['網購回饋', '指定通路優惠'],
      color: '#E91E63'
    },
    {
      id: 2,
      name: '富邦 J卡',
      bank: '富邦銀行',
      annualFee: '永久免年費',
      features: ['現金回饋', '數位支付優惠'],
      color: '#2196F3'
    },
    {
      id: 3,
      name: '中信英雄聯盟卡',
      bank: '中國信託',
      annualFee: '2000元',
      features: ['遊戲回饋', '娛樂優惠'],
      color: '#FF9800'
    }
  ];
};