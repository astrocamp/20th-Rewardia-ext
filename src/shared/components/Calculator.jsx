import React, { useState, useEffect } from 'react';

function Calculator({ isVisible, onClose }) {
  const [formData, setFormData] = useState({
    bank: '',
    card: '',
    category: '',
    scope: '',
    amount: ''
  });

  const [options, setOptions] = useState({
    banks: [],
    cards: [],
    categories: [],
    scopes: []
  });

  const [result, setResult] = useState('請選擇欄位進行計算');
  const [loading, setLoading] = useState(false);

  // 載入銀行列表
  useEffect(() => {
    if (isVisible) {
      fetchBanks();
    }
  }, [isVisible]);

  // 自動計算
  useEffect(() => {
    if (formData.bank && formData.card && formData.category && formData.scope && formData.amount) {
      calculateReward();
    }
  }, [formData]);

  const fetchBanks = async () => {
    try {
      console.log('🏦 [試算] 開始載入銀行列表...');
      const response = await fetch('https://rewardia.net/api/banks/');
      console.log('🏦 [試算] 銀行 API 回應:', response.status, response.statusText);

      if (response.ok) {
        const banksData = await response.json();
        console.log('🏦 [試算] 成功取得銀行資料:', banksData);
        setOptions(prev => ({ ...prev, banks: banksData }));
      } else {
        console.error('❌ [試算] 銀行 API 失敗:', response.status);
      }
    } catch (error) {
      console.error('💥 [試算] 取得銀行列表失敗:', error);
      // 使用預設的銀行列表作為備選
      setOptions(prev => ({
        ...prev,
        banks: [
          { bank: '樂天' },
          { bank: '國泰' },
          { bank: '中信' },
          { bank: '玉山' },
          { bank: '台新' }
        ]
      }));
    }
  };

  const fetchCardsByBank = async (bankName) => {
    try {
      setLoading(true);
      console.log('💳 [試算] 取得卡片列表:', bankName);

      // 使用新的 ext_api 端點
      const response = await fetch(`https://rewardia.net/api/banks/${encodeURIComponent(bankName)}/cards/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const cardsData = await response.json();
        console.log('💳 [試算] 成功取得卡片:', cardsData);

        // 格式化給試算表單使用（與 LoginPage 相同的資料結構）
        const formattedCards = cardsData.map(card => ({
          value: card.id,
          text: card.name
        }));

        setOptions(prev => ({
          ...prev,
          cards: formattedCards,
          categories: [],
          scopes: []
        }));
      } else {
        console.error('❌ [試算] 卡片 API 失敗:', response.status);
        alert('無法載入該銀行的卡片');
        setOptions(prev => ({
          ...prev,
          cards: [],
          categories: [],
          scopes: []
        }));
      }
    } catch (error) {
      console.error('💥 [試算] 取得卡片列表失敗:', error);
      alert('載入卡片列表時發生錯誤');
      setOptions(prev => ({
        ...prev,
        cards: [],
        categories: [],
        scopes: []
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesByCard = async (cardValue) => {
    try {
      setLoading(true);
      console.log('📋 [試算] 取得消費類別:', cardValue);

      // 使用真實的 API（GET 請求）
      const response = await fetch(`https://rewardia.net/get-categories-by-card/?card_select=${encodeURIComponent(cardValue)}`, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.ok) {
        const html = await response.text();
        // 解析 HTML 回應取得選項
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const options = doc.querySelectorAll('option');

        const categories = Array.from(options)
          .filter(option => option.value && option.value !== '')
          .map(option => ({
            value: option.value,
            text: option.textContent.trim()
          }));

        setOptions(prev => ({
          ...prev,
          categories: categories,
          scopes: []
        }));
        console.log('📋 [試算] 成功取得消費類別:', categories);
      } else {
        console.error('❌ [試算] 類別 API 失敗:', response.status);
        // 使用預設類別作為備選
        const defaultCategories = [
          { value: 'online', text: '網路購物' },
          { value: 'food', text: '餐飲' },
          { value: 'gas', text: '加油' },
          { value: 'transport', text: '交通' },
          { value: 'other', text: '一般消費' }
        ];
        setOptions(prev => ({
          ...prev,
          categories: defaultCategories,
          scopes: []
        }));
      }
    } catch (error) {
      console.error('💥 [試算] 取得類別列表失敗:', error);
      // 使用預設類別作為備選
      const defaultCategories = [
        { value: 'online', text: '網路購物' },
        { value: 'food', text: '餐飲' },
        { value: 'gas', text: '加油' },
        { value: 'transport', text: '交通' },
        { value: 'other', text: '一般消費' }
      ];
      setOptions(prev => ({
        ...prev,
        categories: defaultCategories,
        scopes: []
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchScopesByCategory = async (categoryValue) => {
    try {
      setLoading(true);
      console.log('🎯 [試算] 取得消費種類:', categoryValue);

      // 使用真實的 API（GET 請求）
      const response = await fetch(`https://rewardia.net/get-scopes-by-category/?card_select=${encodeURIComponent(formData.card)}&category_select=${encodeURIComponent(categoryValue)}`, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.ok) {
        const html = await response.text();
        // 解析 HTML 回應取得選項
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const options = doc.querySelectorAll('option');

        const scopes = Array.from(options)
          .filter(option => option.value && option.value !== '')
          .map(option => ({
            value: option.value,
            text: option.textContent.trim()
          }));

        setOptions(prev => ({ ...prev, scopes }));
        console.log('🎯 [試算] 成功取得消費種類:', scopes);
      } else {
        console.error('❌ [試算] 種類 API 失敗:', response.status);
        // 使用預設種類作為備選
        const defaultScopes = [{ value: 'general', text: '一般消費' }];
        setOptions(prev => ({ ...prev, scopes: defaultScopes }));
      }
    } catch (error) {
      console.error('💥 [試算] 取得範圍列表失敗:', error);
      // 使用預設種類作為備選
      const defaultScopes = [{ value: 'general', text: '一般消費' }];
      setOptions(prev => ({ ...prev, scopes: defaultScopes }));
    } finally {
      setLoading(false);
    }
  };

  const calculateReward = async () => {
    try {
      setLoading(true);
      console.log('💰 [試算] 開始計算回饋...', formData);

      // 簡單的回饋計算邏輯（模擬）
      const amount = parseFloat(formData.amount);
      let rewardRate = 0.5; // 預設 0.5%

      // 根據不同條件調整回饋率
      if (formData.category === 'online') rewardRate = 2.0;
      else if (formData.category === 'food') rewardRate = 3.0;
      else if (formData.category === 'gas') rewardRate = 2.0;
      else if (formData.category === 'transport') rewardRate = 1.5;

      // 根據銀行調整
      if (formData.bank === '樂天') rewardRate += 0.5;
      else if (formData.bank === '國泰') rewardRate += 0.3;

      const rewardAmount = Math.round(amount * (rewardRate / 100));

      setResult(`
        <div style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold; color: #10b981;">
            NT$ ${rewardAmount}
          </div>
          <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
            回饋率: ${rewardRate}%
          </div>
        </div>
      `);

      console.log('💰 [試算] 計算完成:', {
        amount,
        rewardRate,
        rewardAmount
      });
    } catch (error) {
      console.error('💥 [試算] 計算回饋失敗:', error);
      setResult('計算錯誤，請檢查輸入');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 根據選擇觸發相關資料載入
    if (field === 'bank' && value) {
      setFormData(prev => ({ ...prev, card: '', category: '', scope: '' }));
      await fetchCardsByBank(value);
    } else if (field === 'card' && value) {
      setFormData(prev => ({ ...prev, category: '', scope: '' }));
      await fetchCategoriesByCard(value);
    } else if (field === 'category' && value) {
      setFormData(prev => ({ ...prev, scope: '' }));
      await fetchScopesByCategory(value);
    }
  };

  const clearForm = () => {
    setFormData({
      bank: '',
      card: '',
      category: '',
      scope: '',
      amount: ''
    });
    setOptions(prev => ({
      ...prev,
      cards: [],
      categories: [],
      scopes: []
    }));
    setResult('請選擇欄位進行計算');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '300px',
      height: '100%',
      backgroundColor: 'white',
      boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      overflow: 'auto',
      fontFamily: '"Kulim Park", sans-serif'
    }}>
      {/* 標題列 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1f2937'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: 0,
          color: 'white'
        }}>
          優惠試算
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ✕
        </button>
      </div>

      {/* 表單內容 */}
      <div style={{ padding: '16px' }}>
        {/* 銀行選擇 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>銀行
          </label>
          <select
            value={formData.bank}
            onChange={(e) => handleInputChange('bank', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">請選擇銀行</option>
            {options.banks.map((bank, index) => (
              <option key={bank.bank || index} value={bank.bank}>
                {bank.bank}
              </option>
            ))}
          </select>
        </div>

        {/* 卡片選擇 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>卡片
          </label>
          <select
            value={formData.card}
            onChange={(e) => handleInputChange('card', e.target.value)}
            disabled={!formData.bank}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.bank ? 'white' : '#f9fafb'
            }}
          >
            <option value="">
              {!formData.bank ? '請先選擇銀行' : '請選擇卡片'}
            </option>
            {options.cards.map((card, index) => (
              <option key={index} value={card.value}>
                {card.text}
              </option>
            ))}
          </select>
        </div>

        {/* 消費類別 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>消費類別
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            disabled={!formData.card}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.card ? 'white' : '#f9fafb'
            }}
          >
            <option value="">
              {!formData.card ? '請先選擇卡片' : '請選擇消費類別'}
            </option>
            {options.categories.map((category, index) => (
              <option key={index} value={category.value}>
                {category.text}
              </option>
            ))}
          </select>
        </div>

        {/* 消費種類 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>消費種類
          </label>
          <select
            value={formData.scope}
            onChange={(e) => handleInputChange('scope', e.target.value)}
            disabled={!formData.category}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.category ? 'white' : '#f9fafb'
            }}
          >
            <option value="">
              {!formData.category ? '請先選擇消費類別' : '請選擇消費種類'}
            </option>
            {options.scopes.map((scope, index) => (
              <option key={index} value={scope.value}>
                {scope.text}
              </option>
            ))}
          </select>
        </div>

        {/* 消費金額 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>消費金額
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="請輸入消費金額"
            min="0.01"
            step="0.01"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 計算結果 */}
        <div style={{
          backgroundColor: '#1e3a8a',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px' }}>計算結果</span>
            <div style={{
              fontSize: '16px',
              fontWeight: '600'
            }} dangerouslySetInnerHTML={{ __html: result }}>
            </div>
          </div>
        </div>

        {/* 清空按鈕 */}
        <button
          onClick={clearForm}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          清空填寫
        </button>

        {/* 免責聲明 */}
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          lineHeight: '1.4'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            • 本站資料僅供參考，實際以各銀行官方為準
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            • 若因資料錯誤造成損失，本站不負任何責任
          </p>
          <p style={{ margin: 0 }}>
            • 回饋計算可能因各種條件限制而有差異
          </p>
        </div>
      </div>

      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          載入中...
        </div>
      )}
    </div>
  );
}

export default Calculator;