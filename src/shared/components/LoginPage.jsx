import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toysIcon from "../images/account/toys_presents_icon.png";
import logoutIcon from "../images/account/icon/logout.svg";
import refreshIcon from "../images/account/icon/refresh.svg";
import deleteIcon from "../images/account/icon/delete.svg";
import leftArrowIcon from "../images/account/icon/left-arrow.svg";
import { openLoginPage } from "../api/auth";
import { startCookieMonitor } from "../utils/simple-cookie-monitor";
import { useToast } from "../contexts/ToastContext";

function LoginPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 初始為 true，避免閃爍
  const { showToast } = useToast();

  // 新增卡片表單狀態
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [banks, setBanks] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  // 下拉選單顯示狀態
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showCardDropdown, setShowCardDropdown] = useState(false);

  // 動畫variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    }),
  };

  // 下拉動畫variants (來自Calculator)
  const dropdownVariants = {
    hidden: {
      scaleY: 0,
      opacity: 0,
      transformOrigin: "top",
    },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: "top",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const optionVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: (index) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.2,
      },
    }),
  };

  // 檢查登入狀態 - 模仿原來的簡單邏輯
  useEffect(() => {
    checkLoginStatus();

    // 監聽 cookie 變化（簡單版本）
    const stopCookieMonitor = startCookieMonitor((cookieData) => {
      if (cookieData.isLoggedOut) {
        handleLogout();
      }
    });

    return stopCookieMonitor;
  }, []);

  const checkLoginStatus = async () => {
    setLoading(true);

    try {
      // 先檢查 chrome.storage.local 有沒有 token
      const result = await chrome.storage.local.get([
        "authToken",
        "username",
        "userID",
      ]);
      const { authToken: token, username, userID } = result;

      // 如果沒有 token，嘗試從 API 取得
      if (!token) {
        await fetchTokenFromAPI();

        // 重新檢查
        const newResult = await chrome.storage.local.get([
          "authToken",
          "username",
          "userID",
        ]);
        const {
          authToken: newToken,
          username: newUsername,
          userID: newUserID,
        } = newResult;

        if (newToken && newUsername) {
          const userCards = await getUserCards(newToken, newUserID);
          setUser({
            isLoggedIn: true,
            userId: newUserID,
            userName: newUsername,
            token: newToken,
            userCards: userCards,
          });
        } else {
          setUser(null);
        }
      } else {
        // 有 token，直接設定登入狀態並取得卡片

        const userCards = await getUserCards(token, userID);
        setUser({
          isLoggedIn: true,
          userId: userID,
          userName: username,
          token: token,
          userCards: userCards,
        });
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 取得用戶卡片（參考 Chrome extension 的邏輯）
  const getUserCards = async (token, userID) => {
    try {
      const response = await fetch(
        `https://rewardia.net/api/users/${userID}/cards/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const cards = await response.json();

        return cards;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  const fetchTokenFromAPI = async () => {
    try {
      const response = await fetch("https://rewardia.net/users/api/get_token", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.token) {
          await chrome.storage.local.set({
            authToken: data.token,
            username: data.username,
            userID: data.user_id,
          });
        }
      }
    } catch (error) {}
  };

  const handleLoginClick = () => {
    openLoginPage();

    // 簡單的定期檢查（每3秒檢查一次）
    const checkInterval = setInterval(async () => {
      await checkLoginStatus();

      // 如果檢查到已登入，停止檢查
      const checkResult = await chrome.storage.local.get(["authToken"]);
      if (checkResult.authToken) {
        clearInterval(checkInterval);
      }
    }, 3000);

    // 30秒後停止檢查
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  };

  const handleLogout = async () => {
    // 顯示確認對話框
    const confirmLogout = window.confirm(
      "確定要登出嗎？登出後需要重新登入才能管理卡片。"
    );

    if (!confirmLogout) {
      return;
    }

    // 清除本地資料
    await chrome.storage.local.remove(["authToken", "username", "userID"]);

    // 更新狀態
    setUser(null);

    showToast("已成功登出", "success");
  };

  const handleRefresh = () => {
    checkLoginStatus();
  };

  // 取得所有銀行列表
  const fetchBanks = async () => {
    try {
      setFormLoading(true);
      const response = await fetch("https://rewardia.net/api/banks/", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const banksData = await response.json();

        setBanks(banksData);
      } else {
        showToast("無法載入銀行列表", "error");
      }
    } catch (error) {
      showToast("載入銀行列表時發生錯誤", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // 取得特定銀行的卡片列表
  const fetchCardsByBank = async (bankName) => {
    try {
      setFormLoading(true);
      const response = await fetch(
        `https://rewardia.net/api/banks/${encodeURIComponent(bankName)}/cards/`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const cardsData = await response.json();

        setAvailableCards(cardsData);
      } else {
        showToast("無法載入該銀行的卡片", "error");
      }
    } catch (error) {
      showToast("載入卡片列表時發生錯誤", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // 提交新增卡片
  const submitNewCard = async () => {
    if (!selectedCardId) {
      showToast("請選擇卡片", "error");
      return;
    }

    if (!user?.token) {
      showToast("請重新登入", "error");
      return;
    }

    try {
      setFormLoading(true);
      const response = await fetch(
        `https://rewardia.net/api/users/new_card/${selectedCardId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            card: selectedCardId,
          }),
        }
      );

      if (response.ok) {
        showToast("卡片新增成功！", "success");
        // 重置表單狀態
        setShowAddCardForm(false);
        setSelectedBank("");
        setSelectedCardId("");
        setBanks([]);
        setAvailableCards([]);
        setShowBankDropdown(false);
        setShowCardDropdown(false);
        // 重新載入用戶卡片
        checkLoginStatus();
      } else {
        const errorData = await response.json();

        showToast(
          "新增卡片失敗：" + (errorData.message || "請稍後再試"),
          "error"
        );
      }
    } catch (error) {
      showToast("新增卡片時發生錯誤", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // 處理銀行選擇變更
  const handleBankChange = async (bankName) => {
    setSelectedBank(bankName);
    setSelectedCardId(""); // 重置卡片選擇
    setShowCardDropdown(false); // 關閉卡片下拉選單
    if (bankName) {
      await fetchCardsByBank(bankName);
    } else {
      setAvailableCards([]);
    }
  };

  // 處理銀行選擇（下拉選單版本）
  const handleBankSelect = (bankName) => {
    handleBankChange(bankName);
    setShowBankDropdown(false);
  };

  // 處理卡片選擇（下拉選單版本）
  const handleCardSelect = (cardId, cardName) => {
    setSelectedCardId(cardId);
    setShowCardDropdown(false);
  };

  // 處理新增卡片（插件內表單版本）
  const handleAddCard = async () => {
    setShowAddCardForm(true);
    setSelectedBank("");
    setSelectedCardId("");
    setAvailableCards([]);
    setShowBankDropdown(false);
    setShowCardDropdown(false);
    await fetchBanks();
  };

  // 處理刪除卡片（參考 Chrome extension 的邏輯）
  const handleDeleteCard = async (cardId) => {
    if (!user?.token) {
      return;
    }

    const confirmDelete = window.confirm("確定要刪除這張卡片嗎？");
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `https://rewardia.net/api/users/delete_card/${cardId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        showToast("卡片刪除成功！", "success");
        // 重新載入卡片列表
        checkLoginStatus();
      } else {
        showToast("刪除卡片失敗，請稍後再試", "error");
      }
    } catch (error) {
      showToast("刪除卡片時發生錯誤", "error");
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          fontFamily: '"Kulim Park", sans-serif',
          padding: "16px",
          maxWidth: "400px",
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
        }}
      >
        {/* 載入動畫圓點 */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "50%",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          style={{
            fontSize: "16px",
            color: "#6b7280",
            fontFamily: '"Kulim Park", sans-serif',
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          檢查登入狀態...
        </motion.div>
      </motion.div>
    );
  }

  if (user && user.isLoggedIn) {
    // 已登入狀態 - 參考 Chrome extension 的卡片顯示
    return (
      <div
        style={{
          fontFamily: '"Kulim Park", sans-serif',
          padding: "16px",
          maxWidth: "400px",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          boxSizing: "border-box",
        }}
      >
        {showAddCardForm ? (
          // 新增卡片表單 - 參考原始插件設計
          <div
            className="new_card_form"
            style={{
              padding: "0",
              fontFamily: '"Kulim Park", sans-serif',
            }}
          >
            {/* 表單標題和返回按鈕 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() => {
                  setShowAddCardForm(false);
                  setSelectedBank("");
                  setSelectedCardId("");
                  setAvailableCards([]);
                  setShowBankDropdown(false);
                  setShowCardDropdown(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginRight: "10px",
                  padding: "5px",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={leftArrowIcon}
                  alt="返回"
                  style={{ width: "18px", height: "18px" }}
                />
              </button>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  margin: "0",
                  color: "#111827",
                  fontFamily: '"Kulim Park", sans-serif',
                }}
              >
                新增卡片
              </h1>
            </div>

            {/* 表單內容 */}
            <div className="form_content">
              {/* 發卡銀行下拉選單 */}
              <div
                className="banks"
                style={{ marginBottom: "20px", position: "relative" }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "8px",
                    fontFamily: '"Kulim Park", sans-serif',
                  }}
                >
                  <span style={{ color: "#ef4444" }}>* </span>發卡銀行
                </label>

                {/* 自訂下拉選單觸發按鈕 */}
                <motion.button
                  type="button"
                  onClick={() =>
                    !formLoading && setShowBankDropdown(!showBankDropdown)
                  }
                  whileHover={!formLoading ? { scale: 1.01 } : {}}
                  whileTap={!formLoading ? { scale: 0.99 } : {}}
                  disabled={formLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: formLoading ? "#f9fafb" : "white",
                    textAlign: "left",
                    cursor: formLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: formLoading ? 0.6 : 1,
                    fontFamily: '"Kulim Park", sans-serif',
                  }}
                >
                  <span style={{ color: selectedBank ? "#111827" : "#9ca3af" }}>
                    {selectedBank || "選擇發卡銀行"}
                  </span>
                  {!formLoading && (
                    <motion.span
                      animate={{ rotate: showBankDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ fontSize: "12px" }}
                    >
                      ▼
                    </motion.span>
                  )}
                </motion.button>

                {/* 動畫下拉選單 */}
                <AnimatePresence>
                  {showBankDropdown && !formLoading && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 6px 6px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {banks.map((bank, index) => (
                        <motion.div
                          key={bank.bank || index}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ backgroundColor: "#f3f4f6" }}
                          onClick={() => handleBankSelect(bank.bank)}
                          style={{
                            padding: "12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: '"Kulim Park", sans-serif',
                            borderBottom:
                              index < banks.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          {bank.bank}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 卡片下拉選單 */}
              <div
                className="cards"
                style={{ marginBottom: "30px", position: "relative" }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#111827",
                    marginBottom: "8px",
                    fontFamily: '"Kulim Park", sans-serif',
                  }}
                >
                  <span style={{ color: "#ef4444" }}>* </span>卡片
                </label>

                {/* 自訂下拉選單觸發按鈕 */}
                <motion.button
                  type="button"
                  onClick={() =>
                    selectedBank &&
                    !formLoading &&
                    setShowCardDropdown(!showCardDropdown)
                  }
                  whileHover={
                    selectedBank && !formLoading ? { scale: 1.01 } : {}
                  }
                  whileTap={selectedBank && !formLoading ? { scale: 0.99 } : {}}
                  disabled={!selectedBank || formLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor:
                      selectedBank && !formLoading ? "white" : "#f9fafb",
                    textAlign: "left",
                    cursor:
                      selectedBank && !formLoading ? "pointer" : "not-allowed",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: selectedBank && !formLoading ? 1 : 0.6,
                    fontFamily: '"Kulim Park", sans-serif',
                  }}
                >
                  <span
                    style={{
                      color: selectedCardId ? "#111827" : "#9ca3af",
                    }}
                  >
                    {selectedCardId
                      ? availableCards.find((c) => c.id === selectedCardId)
                          ?.name || selectedCardId
                      : !selectedBank
                      ? "請先選擇發卡銀行"
                      : "選擇卡片"}
                  </span>
                  {selectedBank && !formLoading && (
                    <motion.span
                      animate={{ rotate: showCardDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ fontSize: "12px" }}
                    >
                      ▼
                    </motion.span>
                  )}
                </motion.button>

                {/* 動畫下拉選單 */}
                <AnimatePresence>
                  {showCardDropdown && selectedBank && !formLoading && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 6px 6px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {availableCards.map((card, index) => (
                        <motion.div
                          key={card.id}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ backgroundColor: "#f3f4f6" }}
                          onClick={() => handleCardSelect(card.id, card.name)}
                          style={{
                            padding: "12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: '"Kulim Park", sans-serif',
                            borderBottom:
                              index < availableCards.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          {card.name}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 提交按鈕 */}
              <button
                onClick={submitNewCard}
                disabled={!selectedCardId || formLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  backgroundColor:
                    selectedCardId && !formLoading ? "#2563eb" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor:
                    selectedCardId && !formLoading ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  boxShadow:
                    selectedCardId && !formLoading
                      ? "0 2px 4px rgba(37, 99, 235, 0.2)"
                      : "none",
                  width: "100%",
                  justifyContent: "center",
                  fontFamily: '"Kulim Park", sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (selectedCardId && !formLoading) {
                    e.target.style.backgroundColor = "#1d4ed8";
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow =
                      "0 4px 8px rgba(37, 99, 235, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCardId && !formLoading) {
                    e.target.style.backgroundColor = "#2563eb";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 2px 4px rgba(37, 99, 235, 0.2)";
                  }
                }}
              >
                {formLoading ? "新增中..." : "新增"}
              </button>
            </div>
          </div>
        ) : (
          // 原本的卡片列表
          <div className="user_cards">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  margin: "0",
                  color: "#111827",
                  fontFamily: '"Kulim Park", sans-serif',
                }}
              >
                {user.userName} 的卡片
              </h1>
              <div style={{ display: "flex", gap: "8px" }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={checkLoginStatus}
                  style={{
                    background: "rgba(156, 163, 175, 0.1)",
                    border: "1px solid rgba(156, 163, 175, 0.3)",
                    borderRadius: "8px",
                    padding: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={refreshIcon}
                    alt="重新整理"
                    style={{ width: "16px", height: "16px" }}
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  style={{
                    background: "rgba(156, 163, 175, 0.1)",
                    border: "1px solid rgba(156, 163, 175, 0.3)",
                    borderRadius: "8px",
                    padding: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={logoutIcon}
                    alt="登出"
                    style={{ width: "16px", height: "16px" }}
                  />
                </motion.button>
              </div>
            </div>

            {/* 卡片列表 */}
            <div style={{ marginTop: "20px", marginBottom: "20px" }}>
              {user.userCards && user.userCards.length > 0 ? (
                user.userCards
                  .slice()
                  .sort((a, b) => b.card.id - a.card.id) // 按 ID 降序排列，最新的 ID 通常最大
                  .map(
                    (
                      userCard,
                      index // 最新卡片顯示在前面
                    ) => (
                      <motion.div
                        key={userCard.card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.4,
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        whileHover={{
                          y: -4,
                          scale: 1.02,
                          boxShadow:
                            "0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "16px",
                          marginBottom: "16px",
                          boxShadow:
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          cursor: "pointer",
                          position: "relative",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            marginRight: "12px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <h2
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              margin: "0",
                              color: "#111827",
                              fontFamily: '"Kulim Park", sans-serif',
                              lineHeight: "1.4",
                              wordBreak: "break-word",
                            }}
                          >
                            {userCard.card.name}
                          </h2>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteCard(userCard.card.id)}
                          style={{
                            background: "rgba(249, 115, 22, 0.1)",
                            color: "#ea580c",
                            border: "1px solid rgba(249, 115, 22, 0.3)",
                            borderRadius: "20px",
                            padding: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontFamily: '"Kulim Park", sans-serif',
                            whiteSpace: "nowrap",
                            position: "relative",
                            top: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              mask: `url(${deleteIcon}) no-repeat center / contain`,
                              WebkitMask: `url(${deleteIcon}) no-repeat center / contain`,
                              backgroundColor: "#ea580c",
                            }}
                          />
                        </motion.button>
                      </motion.div>
                    )
                  )
              ) : (
                <div
                  className="no_cards"
                  style={{
                    textAlign: "center",
                    color: "#6b7280",
                    padding: "20px",
                    fontSize: "16px",
                    fontFamily: '"Kulim Park", sans-serif',
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  尚未新增卡片
                </div>
              )}

              {/* 新增卡片按鈕 */}
              <button
                onClick={handleAddCard}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                  width: "100%",
                  justifyContent: "center",
                  fontFamily: '"Kulim Park", sans-serif',
                  marginTop: "12px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#1d4ed8";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(37, 99, 235, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#2563eb";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 4px rgba(37, 99, 235, 0.2)";
                }}
              >
                + 新增卡片
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 未登入狀態
  return (
    <div
      style={{
        fontFamily: '"Kulim Park", sans-serif',
        padding: "16px",
        maxWidth: "400px",
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        className="login_view"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
          textAlign: "center",
        }}
      >
        <div
          className="login_img"
          style={{
            marginBottom: "30px",
          }}
        >
          <img
            src={toysIcon}
            alt="禮物圖示"
            className="login-icon"
            style={{
              width: "80px",
              height: "80px",
              marginBottom: "20px",
              filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
            }}
          />
          <h2
            className="login-title"
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#111827",
              margin: "0",
              fontFamily: '"Kulim Park", sans-serif',
            }}
          >
            歡迎使用REWARDIA
          </h2>
        </div>
        <button
          className="btn login_btn"
          onClick={handleLoginClick}
          style={{
            backgroundColor: "#2060b9",
            color: "white",
            border: "none",
            padding: "15px 30px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: '"Kulim Park", sans-serif',
            minWidth: "200px",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#1d4ed8";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px rgba(32, 96, 185, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#2060b9";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          立即登入/註冊
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
