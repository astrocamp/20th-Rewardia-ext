// 簡單的 cookie 監聽工具

/**
 * 檢查是否有 sessionid cookie（Rewardia 使用 Django）
 */
export const hasSessionCookie = () => {
  const cookies = document.cookie;
  return cookies.includes("sessionid=") || cookies.includes("csrftoken=");
};

/**
 * 簡單的 cookie 監聽
 * @param {Function} callback - 當 cookie 變化時呼叫
 */
export const startCookieMonitor = (callback) => {
  let lastCookieState = hasSessionCookie();

  const checkCookies = () => {
    const currentCookieState = hasSessionCookie();

    if (currentCookieState !== lastCookieState) {
      callback({
        hasSession: currentCookieState,
        isLoggedOut: !currentCookieState && lastCookieState,
      });

      lastCookieState = currentCookieState;
    }
  };

  // 每 2 秒檢查一次
  const interval = setInterval(checkCookies, 2000);

  // 返回停止監聽的函數
  return () => {
    clearInterval(interval);
  };
};
