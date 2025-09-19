// 商家偵測工具

/**
 * 商家偵測規則
 * 定義各大商家的網址模式和識別規則
 */
const MERCHANT_RULES = {
  'momo購物網': {
    domains: ['momo.com.tw', 'momoshop.com.tw'],
    keywords: ['momo'],
    category: '電商'
  },
  'Shopee蝦皮購物': {
    domains: ['shopee.tw'],
    keywords: ['shopee'],
    category: '電商'
  },
  'PChome 24h購物': {
    domains: ['24h.pchome.com.tw', 'shopping.pchome.com.tw'],
    keywords: ['pchome'],
    category: '電商'
  },
  'Yahoo購物中心': {
    domains: ['buy.yahoo.com.tw'],
    keywords: ['yahoo'],
    category: '電商'
  },
  'foodpanda': {
    domains: ['foodpanda.com.tw'],
    keywords: ['foodpanda'],
    category: '餐飲'
  },
  'KKday': {
    domains: ['kkday.com'],
    keywords: ['kkday'],
    category: '旅遊'
  },
  'Klook': {
    domains: ['klook.com'],
    keywords: ['klook'],
    category: '旅遊'
  },
  '誠品': {
    domains: ['eslite.com'],
    keywords: ['eslite', '誠品'],
    category: '書店'
  },
  'Coupang': {
    domains: ['coupang.com.tw'],
    keywords: ['coupang'],
    category: '電商'
  },
  '全家便利商店': {
    domains: ['family.com.tw'],
    keywords: ['familymart', '全家'],
    category: '便利商店'
  },
  '7-ELEVEN': {
    domains: ['7-eleven.com.tw'],
    keywords: ['7-eleven', '711'],
    category: '便利商店'
  },
  '全聯福利中心': {
    domains: ['px-pay.com'],
    keywords: ['全聯', 'pxpay'],
    category: '超市'
  },
  '好市多': {
    domains: ['costco.com.tw'],
    keywords: ['costco', '好市多'],
    category: '量販店'
  },
  '家樂福': {
    domains: ['carrefour.com.tw'],
    keywords: ['carrefour', '家樂福'],
    category: '量販店'
  },
  '星巴克': {
    domains: ['starbucks.com.tw'],
    keywords: ['starbucks', '星巴克'],
    category: '餐飲'
  },
  '麥當勞': {
    domains: ['mcdonalds.com.tw'],
    keywords: ['mcdonalds', '麥當勞'],
    category: '餐飲'
  }
};

/**
 * 從當前分頁取得商家資訊
 * @returns {Promise<Object>} 商家資訊物件
 */
export const getCurrentMerchant = async () => {
  console.log('🕵️ [商家偵測] 開始偵測當前商家...');

  try {
    // 檢查是否在擴充功能環境中
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      console.log('⚠️ [商家偵測] Chrome API 不可用');
      return { name: '未知商家', category: '一般', confidence: 0 };
    }

    // 取得當前活躍分頁
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('📱 [商家偵測] 取得分頁資訊:', tabs);

    if (!tabs || tabs.length === 0) {
      console.log('❌ [商家偵測] 沒有找到活躍分頁');
      return { name: '未知商家', category: '一般', confidence: 0 };
    }

    const currentTab = tabs[0];
    const url = currentTab.url;
    const title = currentTab.title || '';
    console.log('🌐 [商家偵測] 當前網址:', url);
    console.log('📄 [商家偵測] 網頁標題:', title);

    const result = detectMerchantFromUrl(url, title);
    console.log('🎯 [商家偵測] 偵測結果:', result);
    return result;
  } catch (error) {
    console.error('💥 [商家偵測] 取得當前商家失敗:', error);
    return { name: '未知商家', category: '一般', confidence: 0 };
  }
};

/**
 * 從網址和標題偵測商家
 * @param {string} url - 網址
 * @param {string} title - 網頁標題
 * @returns {Object} 商家資訊
 */
export const detectMerchantFromUrl = (url, title = '') => {
  if (!url) {
    return { name: '未知商家', category: '一般', confidence: 0 };
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname.toLowerCase();
    const titleLower = title.toLowerCase();

    // 逐一檢查商家規則（參考原始 rewardia 的直接匹配方式）
    for (const [merchantName, rules] of Object.entries(MERCHANT_RULES)) {

      // 檢查網域名稱（優先，類似原始 rewardia）
      for (const merchantDomain of rules.domains) {
        if (domain.includes(merchantDomain.toLowerCase())) {
          console.log(`🎯 [商家偵測] 網域匹配成功: ${domain} 包含 ${merchantDomain} → ${merchantName}`);
          return {
            name: merchantName,
            category: rules.category,
            confidence: 100,
            url: url,
            domain: domain
          };
        }
      }

      // 檢查關鍵字（次要，類似原始 rewardia 的關鍵字匹配）
      for (const keyword of rules.keywords) {
        const keywordLower = keyword.toLowerCase();

        // 直接檢查 URL 是否包含關鍵字（模仿原始行為）
        if (url.toLowerCase().includes(keywordLower)) {
          console.log(`🎯 [商家偵測] 關鍵字匹配成功: ${url} 包含 ${keyword} → ${merchantName}`);
          return {
            name: merchantName,
            category: rules.category,
            confidence: 90,
            url: url,
            domain: domain
          };
        }
      }
    }

    // 如果沒有匹配到已知商家，嘗試從網域推測
    const domainParts = domain.split('.');
    const mainDomain = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domain;

    return {
      name: getDisplayName(mainDomain, title),
      category: '一般',
      confidence: 30,
      url: url,
      domain: domain
    };

  } catch (error) {
    console.error('偵測商家時發生錯誤:', error);
    return { name: '未知商家', category: '一般', confidence: 0 };
  }
};

/**
 * 取得適合顯示的商家名稱
 * @param {string} domain - 網域名稱
 * @param {string} title - 網頁標題
 * @returns {string} 顯示名稱
 */
const getDisplayName = (domain, title) => {
  // 如果標題包含明顯的商家名稱，優先使用
  const titleWords = title.split(/[\s\-|]+/);
  for (const word of titleWords) {
    if (word.length >= 2 && word.length <= 10) {
      // 過濾掉一些常見的非商家詞彙
      const excludeWords = ['購物', 'shop', 'store', 'mall', 'buy', 'sale', '官網', 'www'];
      if (!excludeWords.some(exclude => word.toLowerCase().includes(exclude))) {
        return word;
      }
    }
  }

  // 否則使用網域名稱
  return domain.charAt(0).toUpperCase() + domain.slice(1);
};

/**
 * 取得商家類別的中文名稱
 * @param {string} category - 類別代碼
 * @returns {string} 中文類別名稱
 */
export const getCategoryDisplayName = (category) => {
  const categoryMap = {
    '電商': '線上購物',
    '便利商店': '便利商店',
    '超市': '超市量販',
    '量販店': '超市量販',
    '餐飲': '餐飲美食',
    '一般': '一般消費'
  };

  return categoryMap[category] || '一般消費';
};