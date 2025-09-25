import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import crownIcon from "../images/account/icon/crown.svg";

function MerchantRewards() {
  const [merchant, setMerchant] = useState("");
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  // 用戶相關狀態
  const [user, setUser] = useState(null);
  const [userCards, setUserCards] = useState([]);

  // 商家對應表
  const merchantMap = {
    momo: "momo購物",
    pchome: "pchome",
    eslite: "誠品",
    coupang: "Coupang",
    foodpanda: "foodpanda",
    kkday: "KKday",
    klook: "Klook",
    shopee: "Shopee",
    ".tw": "國內",
  };

  useEffect(() => {
    checkUserLogin();
    getMerchantCards();
  }, []);

  // 檢查用戶登入狀態
  const checkUserLogin = async () => {
    try {
      const storage = await chrome.storage.local.get([
        "authToken",
        "username",
        "userID",
      ]);
      if (storage.authToken && storage.userID) {
        setUser({
          token: storage.authToken,
          userName: storage.username,
          userID: storage.userID,
        });
        // 獲取用戶卡片
        await getUserCards(storage.authToken, storage.userID);
      }
    } catch (error) {}
  };

  // 獲取用戶卡片
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
        setUserCards(cards);
      }
    } catch (error) {}
  };

  // 檢查是否為用戶持有的卡片
  const isUserCard = (cardId) => {
    return userCards.some((userCard) => userCard.card.id === cardId);
  };

  // get_current_url 函數
  async function getCurrentUrl() {
    let queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab.url;
  }

  // get_rewards 函數
  async function getRewards(merchant) {
    const url = `https://rewardia.net/api/rewards/scope/${merchant}/`;
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
      setMerchant("未知商家");
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }

  // format_card_rate - 返回 JSX 以支援標籤樣式
  const formatRewardRate = (reward) => {
    if (reward.min_rate && reward.max_rate) {
      return (
        <span>
          {reward.min_rate} - {reward.max_rate}% 回饋
        </span>
      );
    } else if (reward.min_rate == null) {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            最高
          </span>
          <span>{reward.max_rate}% 回饋</span>
        </span>
      );
    } else if (reward.max_rate == null) {
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              backgroundColor: "#d1fae5",
              color: "#065f46",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
            }}
          >
            最低
          </span>
          <span>{reward.min_rate}% 回饋</span>
        </span>
      );
    }
    return <span>回饋資訊待更新</span>;
  };

  // 計算回饋率數值用於排序
  const getRewardValue = (reward) => {
    if (reward.max_rate) return parseFloat(reward.max_rate);
    if (reward.min_rate) return parseFloat(reward.min_rate);
    return 0;
  };

  // 排序回饋卡片
  const sortedRewards = [...rewards].sort(
    (a, b) => getRewardValue(b) - getRewardValue(a)
  );

  // 獲取排名標籤和顏色
  const getRankInfo = (index, rewardValue, allValues) => {
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    if (index === 0)
      return {
        rank: "第一名",
        color: "#fbbf24", // 金色
        crownColor: "#1e40af", // 統一使用第一名的藍色
        isSpecial: true,
      };
    if (index === 1)
      return {
        rank: "第二名",
        color: "#9ca3af", // 銀色
        crownColor: "#1e40af", // 統一使用第一名的藍色
        isSpecial: true,
      };
    if (index === 2)
      return {
        rank: "第三名",
        color: "#f97316", // 銅色
        crownColor: "#1e40af", // 統一使用第一名的藍色
        isSpecial: true,
      };

    // 檢查是否為最高或最低回饋 - 不顯示最高最低標籤（移除圓角標籤）
    return { rank: null, color: null, isSpecial: false };
  };

  const handleRefresh = () => {
    getMerchantCards();
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
        }}
      >
        <div
          style={{
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
            正在偵測商家...
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        fontFamily: '"Kulim Park", sans-serif',
        padding: "16px",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      {/* 標題區域 */}
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "700",
            margin: "0 0 8px 0",
            color: "#111827",
            fontFamily: '"Kulim Park", sans-serif',
          }}
        >
          {merchant} 信用卡回饋
        </h1>
      </div>

      {/* 回饋卡片列表 */}
      <div style={{ marginBottom: "20px" }}>
        <AnimatePresence>
          {sortedRewards && sortedRewards.length > 0 ? (
            (() => {
              const allValues = sortedRewards.map(getRewardValue);
              return sortedRewards.map((reward, index) => {
                const rewardValue = getRewardValue(reward);
                const rankInfo = getRankInfo(index, rewardValue, allValues);
                const isTopThree = index < 3;

                return (
                  <motion.div
                    key={reward.card?.id || index}
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
                    }}
                  >
                    {/* 排名標籤 - 只顯示前三名或最高/最低 */}
                    {rankInfo.rank && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          left: "16px",
                          backgroundColor: rankInfo.color,
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          fontFamily: '"Kulim Park", sans-serif',
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {rankInfo.rank}
                      </div>
                    )}

                    <div
                      style={{
                        marginBottom: "6px",
                        marginTop: rankInfo.rank ? "8px" : "0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: isTopThree ? "16px" : "14px",
                          fontWeight: isTopThree ? "600" : "500",
                          margin: "0",
                          color: "#1f2937",
                          fontFamily: '"Kulim Park", sans-serif',
                          flex: 1,
                        }}
                      >
                        {reward.card?.name || "卡片名稱待更新"}
                      </h2>

                      {/* 用戶卡片標記 */}
                      {isUserCard(reward.card?.id) && (
                        <span
                          style={{
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            marginLeft: "8px",
                            fontFamily: '"Kulim Park", sans-serif',
                          }}
                        >
                          你的卡片
                        </span>
                      )}

                      {/* 前三名右側皇冠 icon */}
                      {isTopThree && rankInfo.crownColor && (
                        <img
                          src={crownIcon}
                          alt="皇冠"
                          style={{
                            width: "20px",
                            height: "20px",
                            marginLeft: "8px",
                            filter:
                              "brightness(0) saturate(100%) invert(23%) sepia(85%) saturate(2345%) hue-rotate(216deg) brightness(91%) contrast(101%)",
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: isTopThree ? "14px" : "12px",
                        color: "#4b5563", // 深灰色
                        fontWeight: "500",
                        fontFamily: '"Kulim Park", sans-serif',
                      }}
                    >
                      {formatRewardRate(reward)}
                    </div>
                  </motion.div>
                );
              });
            })()
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                textAlign: "center",
                color: "#4b5563",
                padding: "40px 20px",
                fontSize: "16px",
                fontFamily: '"Kulim Park", sans-serif',
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
              }}
            >
              目前沒有相關回饋資訊
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 免責聲明 */}
      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: "12px",
          marginBottom: "16px",
          fontFamily: '"Kulim Park", sans-serif',
          fontStyle: "italic",
        }}
      >
        實際回饋資訊以信用卡活動網站為主。
      </div>

      {/* 重新檢測按鈕 */}
      <button
        onClick={handleRefresh}
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
        重新檢測
      </button>
    </motion.div>
  );
}

export default MerchantRewards;
