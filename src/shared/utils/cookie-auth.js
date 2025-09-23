// Cookie 基礎認證檢查工具
// 直接監聽 cookie 變化來偵測登入/登出狀態

/**
 * 常見的認證 cookie 名稱
 */
const AUTH_COOKIE_NAMES = [
  "sessionid", // Django 預設
  "csrftoken", // Django CSRF
  "auth_token",
  "user_id",
  "jwt",
  "access_token",
  "refresh_token",
  "sid",
  "PHPSESSID",
  "JSESSIONID",
  "session",
  "_session",
];

/**
 * 取得特定 cookie 值
 * @param {string} name - cookie 名稱
 * @returns {string|null} cookie 值
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
};

/**
 * 解析所有 cookies
 * @returns {Object} cookie 物件
 */
export const parseAllCookies = () => {
  return document.cookie.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      acc[name] = value;
    }
    return acc;
  }, {});
};

/**
 * 檢查是否有認證 cookies
 * @returns {Object} 認證狀態資訊
 */
export const checkAuthCookies = () => {
  const allCookies = parseAllCookies();
  const authCookies = {};
  let hasAuthCookie = false;

  AUTH_COOKIE_NAMES.forEach((name) => {
    if (allCookies[name]) {
      authCookies[name] = allCookies[name];
      hasAuthCookie = true;
    }
  });

  return {
    isLoggedIn: hasAuthCookie,
    authCookies: authCookies,
    allCookies: allCookies,
    timestamp: Date.now(),
  };
};

/**
 * 監聽 cookie 變化
 * @param {Function} callback - 當 cookie 變化時的回調函數
 * @returns {Function} 停止監聽的函數
 */
export const onCookieChange = (callback) => {
  let lastCookieString = document.cookie;
  let lastAuthStatus = checkAuthCookies();

  const checkChanges = () => {
    const currentCookieString = document.cookie;

    if (currentCookieString !== lastCookieString) {
      const currentAuthStatus = checkAuthCookies();

      // 檢查認證狀態是否變化
      if (currentAuthStatus.isLoggedIn !== lastAuthStatus.isLoggedIn) {
        callback({
          isLoggedIn: currentAuthStatus.isLoggedIn,
          source: "cookie_change_detection",
          previous: lastAuthStatus,
          current: currentAuthStatus,
          timestamp: Date.now(),
        });
      }

      lastCookieString = currentCookieString;
      lastAuthStatus = currentAuthStatus;
    }
  };

  // 每秒檢查一次
  const interval = setInterval(checkChanges, 1000);

  // 返回停止監聽的函數
  return () => {
    clearInterval(interval);
  };
};

/**
 * 快速檢查登入狀態（不依賴 API）
 * @returns {Promise<Object>} 登入狀態
 */
export const quickLoginCheck = async () => {
  const cookieAuth = checkAuthCookies();

  // 同時檢查 localStorage 的 token
  const hasLocalToken = localStorage.getItem("authToken");

  const isLoggedIn = cookieAuth.isLoggedIn || !!hasLocalToken;

  return {
    isLoggedIn: isLoggedIn,
    source: "quick_cookie_check",
    cookieAuth: cookieAuth,
    hasLocalToken: !!hasLocalToken,
    timestamp: Date.now(),
  };
};

/**
 * 智能登入狀態檢查
 * 先用 cookie 快速檢查，如果需要再用 API
 * @param {Function} apiCheckFunction - API 檢查函數
 * @returns {Promise<Object>} 登入狀態
 */
export const smartLoginCheck = async (apiCheckFunction) => {
  // 1. 先做快速 cookie 檢查
  const quickResult = await quickLoginCheck();

  // 2. 如果 cookie 顯示未登入，直接返回
  if (!quickResult.isLoggedIn) {
    return {
      isLoggedIn: false,
      source: "smart_check_cookie_negative",
      quickResult: quickResult,
    };
  }

  // 3. 如果 cookie 顯示已登入，用 API 確認

  try {
    const apiResult = await Promise.race([
      apiCheckFunction(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API 檢查超時")), 5000)
      ),
    ]);

    return {
      ...apiResult,
      source: "smart_check_api_confirmed",
      quickResult: quickResult,
    };
  } catch (error) {
    // API 失敗時，回退到 cookie 結果
    return {
      isLoggedIn: quickResult.isLoggedIn,
      source: "smart_check_api_fallback",
      quickResult: quickResult,
      apiError: error.message,
    };
  }
};
