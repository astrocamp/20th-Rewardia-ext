// 跨頁面登入狀態同步工具

/**
 * 登入狀態變更事件
 */
const LOGIN_STATUS_EVENT = "rewardia_login_status_changed";

/**
 * 觸發登入狀態變更事件
 * @param {Object} loginData - 登入資料
 */
export const notifyLoginStatusChange = (loginData) => {
  // 儲存到 localStorage，觸發 storage event
  localStorage.setItem(
    "rewardia_login_event",
    JSON.stringify({
      timestamp: Date.now(),
      data: loginData,
    })
  );

  // 也可以使用 custom event（同頁面內）
  window.dispatchEvent(
    new CustomEvent(LOGIN_STATUS_EVENT, {
      detail: loginData,
    })
  );
};

/**
 * 監聽登入狀態變更
 * @param {Function} callback - 回調函數
 * @returns {Function} 取消監聽的函數
 */
export const onLoginStatusChange = (callback) => {
  // 監聽 localStorage 變更（跨頁面）
  const handleStorageChange = (event) => {
    if (event.key === "rewardia_login_event" && event.newValue) {
      try {
        const eventData = JSON.parse(event.newValue);

        callback(eventData.data);
      } catch (error) {}
    }
  };

  // 監聽 custom event（同頁面內）
  const handleCustomEvent = (event) => {
    callback(event.detail);
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(LOGIN_STATUS_EVENT, handleCustomEvent);

  // 返回取消監聽的函數
  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(LOGIN_STATUS_EVENT, handleCustomEvent);
  };
};

/**
 * 檢查當前是否在 Rewardia 會員頁面
 * @returns {boolean} 是否在會員頁面
 */
export const isOnRewardiaMemberPage = () => {
  return window.location.href === "https://rewardia.net/users/member/";
};

/**
 * 在 Rewardia 網站上執行的腳本
 * 模擬 Chrome 擴充功能的 content script 行為
 */
export const initRewardiaPageDetection = () => {
  // 只在 Rewardia 網站上執行
  if (!window.location.hostname.includes("rewardia.net")) {
    return;
  }

  // 檢查是否在會員頁面
  if (isOnRewardiaMemberPage()) {
    // 延遲一點時間確保頁面載入完成
    setTimeout(() => {
      notifyLoginStatusChange({
        isLoggedIn: true,
        source: "member_page_detection",
        timestamp: Date.now(),
      });
    }, 1000);
  }

  // 監聽 URL 變化（SPA 應用）
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      if (isOnRewardiaMemberPage()) {
        notifyLoginStatusChange({
          isLoggedIn: true,
          source: "url_change_detection",
          timestamp: Date.now(),
        });
      }
    }
  };

  // 定期檢查 URL 變化
  setInterval(checkUrlChange, 1000);

  // 監聽 popstate 事件（瀏覽器前進後退）
  window.addEventListener("popstate", checkUrlChange);
};
