// 登入狀態檢查 API

import { notifyLoginStatusChange } from "../utils/login-sync";
import { smartLoginCheck } from "../utils/cookie-auth";

const REWARDIA_URL = "https://rewardia.net";
const TOKEN_URL = "https://rewardia.net/users/api/get_token/";
const API_BASE_URL = "https://rewardia.net/api";

/**
 * 從本地儲存取得認證 token
 * @returns {Promise<string|null>} 認證 token
 */
const getAuthToken = async () => {
  return localStorage.getItem("authToken");
};

/**
 * 從本地儲存取得用戶名稱
 * @returns {Promise<string|null>} 用戶名稱
 */
const getUsername = async () => {
  return localStorage.getItem("username");
};

/**
 * 從本地儲存取得用戶 ID
 * @returns {Promise<string|null>} 用戶 ID
 */
const getUserID = async () => {
  return localStorage.getItem("userID");
};

/**
 * 從伺服器取得認證 token
 * @returns {Promise<Object|null>} token 資料
 */
const fetchToken = async () => {
  console.log("🔐 [Auth] 嘗試從伺服器取得 token...");

  try {
    const response = await fetch(TOKEN_URL, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("🌐 [Auth] Token API 回應狀態:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("🎫 [Auth] Token 資料:", data);

      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userID", data.user_id);

        // 通知登入狀態變更
        notifyLoginStatusChange({
          isLoggedIn: true,
          userId: data.user_id,
          userName: data.username,
          source: "token_fetch",
          timestamp: Date.now(),
        });

        return {
          token: data.token,
          username: data.username,
          userID: data.user_id,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("💥 [Auth] 取得 token 失敗:", error);
    return null;
  }
};

/**
 * 取得用戶卡片資料
 * @param {string} token - 認證 token
 * @param {string} userID - 用戶 ID
 * @returns {Promise<Array>} 用戶卡片列表
 */
const getUserCards = async (token, userID) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userID}/cards/`, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const cards = await response.json();
      return Array.isArray(cards) ? cards : [];
    }
    return [];
  } catch (error) {
    console.error("💥 [Auth] 取得用戶卡片失敗:", error);
    return [];
  }
};

/**
 * 原始的 API 檢查函數（較慢但準確）
 * @returns {Promise<Object>} 登入狀態資訊
 */
const fullApiCheck = async () => {
  console.log("🌐 [Auth] 執行完整 API 檢查...");

  // 1. 先檢查本地是否有 token
  let token = await getAuthToken();
  let username = await getUsername();
  let userID = await getUserID();

  console.log("💾 [Auth] 本地 token 狀態:", {
    hasToken: !!token,
    hasUsername: !!username,
    hasUserID: !!userID,
  });

  // 2. 如果沒有 token，嘗試從伺服器取得
  if (!token) {
    console.log("🔄 [Auth] 本地無 token，嘗試從伺服器取得...");
    const tokenData = await fetchToken();

    if (tokenData) {
      token = tokenData.token;
      username = tokenData.username;
      userID = tokenData.userID;
    }
  }

  // 3. 如果有 token，驗證並取得用戶資料
  if (token && username && userID) {
    console.log("✅ [Auth] 找到認證資料，取得用戶卡片...");
    const userCards = await getUserCards(token, userID);

    return {
      isLoggedIn: true,
      userId: userID,
      userName: username,
      userCards: userCards,
      token: token,
    };
  }

  // 4. 沒有有效的認證資料
  console.log("❌ [Auth] 無有效認證資料");
  return { isLoggedIn: false };
};

/**
 * 檢查用戶登入狀態（智能版本 - 先用 cookie 快速檢查）
 * @returns {Promise<Object>} 登入狀態資訊
 */
export const checkLoginStatus = async () => {
  console.log("🔐 [Auth] 開始智能登入狀態檢查...");

  try {
    // 使用智能檢查：先 cookie 後 API
    const result = await smartLoginCheck(fullApiCheck);

    console.log("📊 [Auth] 智能檢查結果:", result);
    return result;
  } catch (error) {
    console.error("💥 [Auth] 檢查登入狀態失敗:", error);
    return { isLoggedIn: false };
  }
};

/**
 * 快速檢查登入狀態（僅基於 cookie 和 localStorage）
 * @returns {Promise<Object>} 登入狀態資訊
 */
export const quickCheckLoginStatus = async () => {
  console.log("⚡ [Auth] 快速檢查登入狀態...");

  try {
    const { quickLoginCheck } = await import("../utils/cookie-auth");
    const result = await quickLoginCheck();

    console.log("📊 [Auth] 快速檢查結果:", result);
    return result;
  } catch (error) {
    console.error("💥 [Auth] 快速檢查失敗:", error);
    return { isLoggedIn: false };
  }
};

/**
 * 執行登出操作
 * @returns {Promise<boolean>} 登出是否成功
 */
export const logout = async () => {
  console.log("🚪 [Auth] 開始登出程序...");

  try {
    // 1. 清除本地儲存
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userID");
    console.log("🗑️ [Auth] 已清除本地認證資料");

    // 通知登出狀態變更
    notifyLoginStatusChange({
      isLoggedIn: false,
      source: "manual_logout",
      timestamp: Date.now(),
    });

    // 2. 呼叫登出 API（可選）
    try {
      const response = await fetch(`${REWARDIA_URL}/users/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("🌐 [Auth] 登出 API 回應:", response.status);
    } catch (apiError) {
      console.warn("⚠️ [Auth] 登出 API 失敗:", apiError);
    }

    console.log("✅ [Auth] 登出完成");
    return true;
  } catch (error) {
    console.error("💥 [Auth] 登出失敗:", error);
    return false;
  }
};

/**
 * 開啟登入頁面
 */
export const openLoginPage = () => {
  console.log("🔗 [Auth] 開啟登入頁面");

  // 檢查是否在 Chrome 擴充功能環境中
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({
      url: `${REWARDIA_URL}/sessions/login/`,
    });
  } else {
    // 在一般網頁環境中，使用 window.open
    window.open(`${REWARDIA_URL}/sessions/login/`, "_blank");
  }
};
