// 跨頁面登入狀態同步工具

/**
 * 登入狀態變更事件
 */
const LOGIN_STATUS_EVENT = 'rewardia_login_status_changed';

/**
 * 觸發登入狀態變更事件
 * @param {Object} loginData - 登入資料
 */
export const notifyLoginStatusChange = (loginData) => {
  console.log('📡 [LoginSync] 通知登入狀態變更:', loginData);

  // 儲存到 localStorage，觸發 storage event
  localStorage.setItem('rewardia_login_event', JSON.stringify({
    timestamp: Date.now(),
    data: loginData
  }));

  // 也可以使用 custom event（同頁面內）
  window.dispatchEvent(new CustomEvent(LOGIN_STATUS_EVENT, {
    detail: loginData
  }));
};

/**
 * 監聽登入狀態變更
 * @param {Function} callback - 回調函數
 * @returns {Function} 取消監聽的函數
 */
export const onLoginStatusChange = (callback) => {
  console.log('👂 [LoginSync] 開始監聽登入狀態變更');

  // 監聽 localStorage 變更（跨頁面）
  const handleStorageChange = (event) => {
    if (event.key === 'rewardia_login_event' && event.newValue) {
      try {
        const eventData = JSON.parse(event.newValue);
        console.log('📨 [LoginSync] 收到登入狀態變更事件:', eventData);
        callback(eventData.data);
      } catch (error) {
        console.error('💥 [LoginSync] 解析登入事件失敗:', error);
      }
    }
  };

  // 監聽 custom event（同頁面內）
  const handleCustomEvent = (event) => {
    console.log('📨 [LoginSync] 收到自定義登入事件:', event.detail);
    callback(event.detail);
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener(LOGIN_STATUS_EVENT, handleCustomEvent);

  // 返回取消監聽的函數
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener(LOGIN_STATUS_EVENT, handleCustomEvent);
    console.log('🔇 [LoginSync] 停止監聽登入狀態變更');
  };
};

/**
 * 檢查當前是否在 Rewardia 會員頁面
 * @returns {boolean} 是否在會員頁面
 */
export const isOnRewardiaMemberPage = () => {
  return window.location.href === 'https://rewardia.net/users/member/';
};

/**
 * 在 Rewardia 網站上執行的腳本
 * 模擬 Chrome 擴充功能的 content script 行為
 */
export const initRewardiaPageDetection = () => {
  // 只在 Rewardia 網站上執行
  if (!window.location.hostname.includes('rewardia.net')) {
    return;
  }

  console.log('🔍 [LoginSync] 初始化 Rewardia 頁面偵測');

  // 檢查是否在會員頁面
  if (isOnRewardiaMemberPage()) {
    console.log('✅ [LoginSync] 偵測到在會員頁面，觸發登入事件');

    // 延遲一點時間確保頁面載入完成
    setTimeout(() => {
      notifyLoginStatusChange({
        isLoggedIn: true,
        source: 'member_page_detection',
        timestamp: Date.now()
      });
    }, 1000);
  }

  // 監聽 URL 變化（SPA 應用）
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('🔄 [LoginSync] URL 變更:', currentUrl);

      if (isOnRewardiaMemberPage()) {
        console.log('✅ [LoginSync] 切換到會員頁面，觸發登入事件');
        notifyLoginStatusChange({
          isLoggedIn: true,
          source: 'url_change_detection',
          timestamp: Date.now()
        });
      }
    }
  };

  // 定期檢查 URL 變化
  setInterval(checkUrlChange, 1000);

  // 監聽 popstate 事件（瀏覽器前進後退）
  window.addEventListener('popstate', checkUrlChange);
};