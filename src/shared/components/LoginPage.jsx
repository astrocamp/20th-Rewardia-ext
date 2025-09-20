import React, { useState, useEffect } from 'react';
import toysIcon from '../images/account/toys_presents_icon.png';
import { openLoginPage } from '../api/auth';
import { startCookieMonitor } from '../utils/simple-cookie-monitor';

function LoginPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 新增卡片表單狀態
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [banks, setBanks] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  // 檢查登入狀態 - 模仿原來的簡單邏輯
  useEffect(() => {
    checkLoginStatus();

    // 監聽 cookie 變化（簡單版本）
    const stopCookieMonitor = startCookieMonitor((cookieData) => {
      if (cookieData.isLoggedOut) {
        console.log('🚪 [LoginPage] Cookie 監聽偵測到登出');
        handleLogout();
      }
    });

    return stopCookieMonitor;
  }, []);

  const checkLoginStatus = async () => {
    console.log('🔄 [LoginPage] 檢查登入狀態...');

    try {
      // 先檢查 localStorage 有沒有 token
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');
      const userID = localStorage.getItem('userID');

      console.log('💾 [LoginPage] 本地資料:', {
        hasToken: !!token,
        hasUsername: !!username,
        hasUserID: !!userID
      });

      // 如果沒有 token，嘗試從 API 取得
      if (!token) {
        console.log('🔄 [LoginPage] 嘗試從 API 取得 token...');
        await fetchTokenFromAPI();

        // 重新檢查
        const newToken = localStorage.getItem('authToken');
        const newUsername = localStorage.getItem('username');
        const newUserID = localStorage.getItem('userID');

        if (newToken && newUsername) {
          console.log('✅ [LoginPage] 成功取得 token');
          const userCards = await getUserCards(newToken, newUserID);
          setUser({
            isLoggedIn: true,
            userId: newUserID,
            userName: newUsername,
            token: newToken,
            userCards: userCards
          });
        } else {
          console.log('❌ [LoginPage] 未登入');
          setUser(null);
        }
      } else {
        // 有 token，直接設定登入狀態並取得卡片
        console.log('✅ [LoginPage] 找到本地 token');
        const userCards = await getUserCards(token, userID);
        setUser({
          isLoggedIn: true,
          userId: userID,
          userName: username,
          token: token,
          userCards: userCards
        });
      }

    } catch (error) {
      console.error('💥 [LoginPage] 檢查失敗:', error);
      setUser(null);
    }
  };

  // 取得用戶卡片（參考 Chrome extension 的邏輯）
  const getUserCards = async (token, userID) => {
    try {
      const response = await fetch(`https://rewardia.net/api/users/${userID}/cards/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const cards = await response.json();
        console.log('💳 [LoginPage] 成功取得用戶卡片:', cards);
        return cards;
      } else {
        console.warn('⚠️ [LoginPage] 取得卡片失敗:', response.status);
        return [];
      }
    } catch (error) {
      console.error('💥 [LoginPage] 取得卡片錯誤:', error);
      return [];
    }
  };

  const fetchTokenFromAPI = async () => {
    try {
      const response = await fetch('https://rewardia.net/users/api/get_token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎫 [LoginPage] API 回應:', data);

        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('username', data.username);
          localStorage.setItem('userID', data.user_id);
        }
      }
    } catch (error) {
      console.warn('⚠️ [LoginPage] API 請求失敗:', error);
    }
  };

  const handleLoginClick = () => {
    console.log('🔗 [LoginPage] 使用者點擊登入按鈕');
    openLoginPage();

    // 簡單的定期檢查（每3秒檢查一次）
    const checkInterval = setInterval(() => {
      console.log('🔄 [LoginPage] 定期檢查登入狀態...');
      checkLoginStatus();

      // 如果檢查到已登入，停止檢查
      const token = localStorage.getItem('authToken');
      if (token) {
        clearInterval(checkInterval);
      }
    }, 3000);

    // 30秒後停止檢查
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  };

  const handleLogout = () => {
    console.log('🚪 [LoginPage] 使用者點擊登出');

    // 清除本地資料
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userID');

    // 更新狀態
    setUser(null);

    console.log('✅ [LoginPage] 登出完成');
  };

  const handleRefresh = () => {
    console.log('🔄 [LoginPage] 使用者點擊重新整理');
    checkLoginStatus();
  };

  // 取得所有銀行列表
  const fetchBanks = async () => {
    try {
      setFormLoading(true);
      const response = await fetch('https://rewardia.net/api/banks/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const banksData = await response.json();
        console.log('🏦 [LoginPage] 成功取得銀行列表:', banksData);
        setBanks(banksData);
      } else {
        console.error('❌ [LoginPage] 取得銀行列表失敗:', response.status);
        alert('無法載入銀行列表');
      }
    } catch (error) {
      console.error('💥 [LoginPage] 取得銀行列表錯誤:', error);
      alert('載入銀行列表時發生錯誤');
    } finally {
      setFormLoading(false);
    }
  };

  // 取得特定銀行的卡片列表
  const fetchCardsByBank = async (bankName) => {
    try {
      setFormLoading(true);
      const response = await fetch(`https://rewardia.net/api/banks/${encodeURIComponent(bankName)}/cards/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const cardsData = await response.json();
        console.log('💳 [LoginPage] 成功取得卡片列表:', cardsData);
        setAvailableCards(cardsData);
      } else {
        console.error('❌ [LoginPage] 取得卡片列表失敗:', response.status);
        alert('無法載入該銀行的卡片');
      }
    } catch (error) {
      console.error('💥 [LoginPage] 取得卡片列表錯誤:', error);
      alert('載入卡片列表時發生錯誤');
    } finally {
      setFormLoading(false);
    }
  };

  // 提交新增卡片
  const submitNewCard = async () => {
    if (!selectedCardId) {
      alert('請選擇卡片');
      return;
    }

    if (!user?.token) {
      console.error('❌ [LoginPage] 沒有認證資訊');
      alert('請重新登入');
      return;
    }

    try {
      setFormLoading(true);
      const response = await fetch(`https://rewardia.net/api/users/new_card/${selectedCardId}`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card: selectedCardId
        }),
      });

      if (response.ok) {
        console.log('✅ [LoginPage] 成功新增卡片');
        alert('卡片新增成功！');
        // 重置表單狀態
        setShowAddCardForm(false);
        setSelectedBank('');
        setSelectedCardId('');
        setBanks([]);
        setAvailableCards([]);
        // 重新載入用戶卡片
        checkLoginStatus();
      } else {
        const errorData = await response.json();
        console.error('❌ [LoginPage] 新增卡片失敗:', response.status, errorData);
        alert('新增卡片失敗：' + (errorData.message || '請稍後再試'));
      }
    } catch (error) {
      console.error('💥 [LoginPage] 新增卡片錯誤:', error);
      alert('新增卡片時發生錯誤');
    } finally {
      setFormLoading(false);
    }
  };

  // 處理銀行選擇變更
  const handleBankChange = async (bankName) => {
    setSelectedBank(bankName);
    setSelectedCardId(''); // 重置卡片選擇
    if (bankName) {
      await fetchCardsByBank(bankName);
    } else {
      setAvailableCards([]);
    }
  };

  // 處理新增卡片（插件內表單版本）
  const handleAddCard = async () => {
    console.log('➕ [LoginPage] 使用者點擊新增卡片');
    setShowAddCardForm(true);
    setSelectedBank('');
    setSelectedCardId('');
    setAvailableCards([]);
    await fetchBanks();
  };

  // 處理刪除卡片（參考 Chrome extension 的邏輯）
  const handleDeleteCard = async (cardId) => {
    console.log('🗑️ [LoginPage] 使用者點擊刪除卡片:', cardId);

    if (!user?.token) {
      console.error('❌ [LoginPage] 沒有認證 token');
      return;
    }

    const confirmDelete = window.confirm('確定要刪除這張卡片嗎？');
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`https://rewardia.net/api/users/delete_card/${cardId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ [LoginPage] 成功刪除卡片');
        // 重新載入卡片列表
        checkLoginStatus();
      } else {
        console.error('❌ [LoginPage] 刪除卡片失敗:', response.status);
        alert('刪除卡片失敗，請稍後再試');
      }
    } catch (error) {
      console.error('💥 [LoginPage] 刪除卡片錯誤:', error);
      alert('刪除卡片時發生錯誤');
    }
  };

  if (loading) {
    return (
      <div className="account_content" style={{
        fontFamily: '"Kulim Park", sans-serif',
        padding: '16px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div className="login_view" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          textAlign: 'center'
        }}>
          <div className="login_img" style={{
            marginBottom: '30px'
          }}>
            <img
              src={toysIcon}
              alt="禮物圖示"
              className="login-icon"
              style={{
                width: '80px',
                height: '80px',
                marginBottom: '20px',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                animation: 'pulse 2s infinite'
              }}
            />
            <h2 className="login-title" style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#6b7280',
              margin: '0',
              fontFamily: '"Kulim Park", sans-serif'
            }}>
              載入中...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.isLoggedIn) {
    // 已登入狀態 - 參考 Chrome extension 的卡片顯示
    return (
      <div className="account_content" style={{
        fontFamily: '"Kulim Park", sans-serif',
        padding: '16px',
        maxWidth: '400px',
        margin: '0 auto',
        justifyContent: 'flex-start'  // 覆蓋CSS中的center設定，避免內容被截掉
      }}>
        {showAddCardForm ? (
          // 新增卡片表單 - 參考原始插件設計
          <div className="new_card_form" style={{
            padding: '0',
            fontFamily: '"Kulim Park", sans-serif'
          }}>
            {/* 表單標題和返回按鈕 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => {
                  setShowAddCardForm(false);
                  setSelectedBank('');
                  setSelectedCardId('');
                  setAvailableCards([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  padding: '5px',
                  color: '#111827'
                }}
              >
                ←
              </button>
              <h1 style={{
                fontSize: '20px',
                fontWeight: '700',
                margin: '0',
                color: '#111827',
                fontFamily: '"Kulim Park", sans-serif'
              }}>
                新增卡片
              </h1>
            </div>

            {/* 表單內容 */}
            <div className="form_content">
              {/* 發卡銀行下拉選單 */}
              <div className="banks" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  <span style={{ color: '#ef4444' }}>* </span>發卡銀行
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => handleBankChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontFamily: '"Kulim Park", sans-serif',
                    cursor: 'pointer'
                  }}
                  disabled={formLoading}
                >
                  <option value="">選擇發卡銀行</option>
                  {banks.map((bank, index) => (
                    <option key={bank.bank || index} value={bank.bank}>
                      {bank.bank}
                    </option>
                  ))}
                </select>
              </div>

              {/* 卡片下拉選單 */}
              <div className="cards" style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  <span style={{ color: '#ef4444' }}>* </span>卡片
                </label>
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontFamily: '"Kulim Park", sans-serif',
                    cursor: 'pointer'
                  }}
                  disabled={!selectedBank || formLoading}
                >
                  <option value="">
                    {!selectedBank ? '請先選擇發卡銀行' : '選擇卡片'}
                  </option>
                  {availableCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 提交按鈕 */}
              <button
                onClick={submitNewCard}
                disabled={!selectedCardId || formLoading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: selectedCardId && !formLoading ? '#2060b9' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: selectedCardId && !formLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  fontFamily: '"Kulim Park", sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (selectedCardId && !formLoading) {
                    e.target.style.backgroundColor = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCardId && !formLoading) {
                    e.target.style.backgroundColor = '#2060b9';
                  }
                }}
              >
                {formLoading ? '新增中...' : '新增'}
              </button>
            </div>
          </div>
        ) : (
          // 原本的卡片列表
          <div className="user_cards">
          <h1 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            color: '#111827',
            textAlign: 'center',
            fontFamily: '"Kulim Park", sans-serif'
          }}>
            {user.userName} 的卡片
          </h1>

          {/* 卡片列表 */}
          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            {user.userCards && user.userCards.length > 0 ? (
              user.userCards.slice().reverse().map((userCard) => ( // reverse() 讓新卡片顯示在前面
                <div
                  key={userCard.card.id}
                  className="card"
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="card_text">
                    <h2 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0',
                      color: '#111827',
                      fontFamily: '"Kulim Park", sans-serif'
                    }}>
                      {userCard.card.name}
                    </h2>
                  </div>
                  <div className="delete_card">
                    <button
                      className="delete_card_btn"
                      onClick={() => handleDeleteCard(userCard.card.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        fontFamily: '"Kulim Park", sans-serif',
                        whiteSpace: 'nowrap', // 防止「刪除」兩字換行
                        minWidth: '56px', // 固定寬度確保「刪除」兩字平排
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#dc2626';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#ef4444';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no_cards" style={{
                textAlign: 'center',
                color: '#6b7280',
                padding: '20px',
                fontSize: '16px',
                fontFamily: '"Kulim Park", sans-serif',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                尚未新增卡片
              </div>
            )}

            {/* 新增卡片按鈕 */}
            <div
              className="card new_card"
              style={{
                background: '#f8fafc',
                border: '2px dashed #2060b9',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                marginTop: '12px',
                transition: 'all 0.2s ease'
              }}
              onClick={handleAddCard}
              onMouseEnter={(e) => {
                e.target.style.background = '#f1f5f9';
                e.target.style.borderColor = '#1d4ed8';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#2060b9';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <div className="card_text">
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0',
                  color: '#2060b9',
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  + 新增卡片
                </h2>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexDirection: 'column'
          }}>
            <button
              className="btn login_btn"
              onClick={handleRefresh}
              style={{
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
              重新整理
            </button>
            <button
              className="btn"
              onClick={handleLogout}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                fontFamily: '"Kulim Park", sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              登出
            </button>
          </div>
          </div>
        )}
      </div>
    );
  }

  // 未登入狀態
  return (
    <div className="account_content" style={{
      fontFamily: '"Kulim Park", sans-serif',
      padding: '16px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <div className="login_view" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        textAlign: 'center'
      }}>
        <div className="login_img" style={{
          marginBottom: '30px'
        }}>
          <img
            src={toysIcon}
            alt="禮物圖示"
            className="login-icon"
            style={{
              width: '80px',
              height: '80px',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
          <h2 className="login-title" style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#111827',
            margin: '0',
            fontFamily: '"Kulim Park", sans-serif'
          }}>
            歡迎使用REWARDIA
          </h2>
        </div>
        <button
          className="btn login_btn"
          onClick={handleLoginClick}
          style={{
            backgroundColor: '#2060b9',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: '"Kulim Park", sans-serif',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(32, 96, 185, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2060b9';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          立即登入/註冊
        </button>
      </div>
    </div>
  );
}

export default LoginPage;