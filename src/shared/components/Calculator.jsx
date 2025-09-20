import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showCardDropdown, setShowCardDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

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

      // 判斷是否為高回饋率（>= 2.0% 顯示"最高"，<= 1.0% 顯示"最低"）
      let rateLabel = '';
      if (rewardRate >= 2.0) {
        rateLabel = '最高 ';
      } else if (rewardRate <= 1.0) {
        rateLabel = '最低 ';
      }

      setResult(`
        <div style="text-align: center;">
          <div style="font-size: 18px; font-weight: bold; color: #0ea5e9;">
            NT$ ${rewardAmount}
          </div>
          <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
            ${rateLabel}回饋率: ${rewardRate}%
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

  // 動畫 variants
  const dropdownVariants = {
    hidden: {
      scaleY: 0,
      opacity: 0,
      transformOrigin: 'top'
    },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: 'top',
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const optionVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: (index) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.2
      }
    })
  };

  const handleBankSelect = (bankName) => {
    handleInputChange('bank', bankName);
    setShowBankDropdown(false);
  };

  const handleCardSelect = (cardValue, cardText) => {
    handleInputChange('card', cardValue);
    setShowCardDropdown(false);
  };

  const handleCategorySelect = (categoryValue, categoryText) => {
    handleInputChange('category', categoryValue);
    setShowCategoryDropdown(false);
  };

  const handleScopeSelect = (scopeValue, scopeText) => {
    handleInputChange('scope', scopeValue);
    setShowScopeDropdown(false);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      overflow: 'auto',
      fontFamily: '"Kulim Park", sans-serif'
    }}>
      {/* 標題列 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: 0,
          color: 'black',
          textAlign: 'center'
        }}>
          優惠試算
        </h2>
      </div>

      {/* 表單內容 */}
      <div style={{ padding: '16px', backgroundColor: '#f8f9fa' }}>
        {/* 銀行選擇 */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>銀行
          </label>

          {/* 自訂下拉選單觸發按鈕 */}
          <motion.button
            type="button"
            onClick={() => setShowBankDropdown(!showBankDropdown)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ color: formData.bank ? '#111827' : '#9ca3af' }}>
              {formData.bank || '請選擇銀行'}
            </span>
            <motion.span
              animate={{ rotate: showBankDropdown ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: '12px' }}
            >
              ▼
            </motion.span>
          </motion.button>

          {/* 動畫下拉選單 */}
          <AnimatePresence>
            {showBankDropdown && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {options.banks.map((bank, index) => (
                  <motion.div
                    key={bank.bank || index}
                    custom={index}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleBankSelect(bank.bank)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: index < options.banks.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    {bank.bank}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 卡片選擇 */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>卡片
          </label>

          {/* 自訂下拉選單觸發按鈕 */}
          <motion.button
            type="button"
            onClick={() => formData.bank && setShowCardDropdown(!showCardDropdown)}
            whileHover={formData.bank ? { scale: 1.01 } : {}}
            whileTap={formData.bank ? { scale: 0.99 } : {}}
            disabled={!formData.bank}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.bank ? 'white' : '#f9fafb',
              textAlign: 'left',
              cursor: formData.bank ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: formData.bank ? 1 : 0.6
            }}
          >
            <span style={{
              color: formData.card ? '#111827' : '#9ca3af'
            }}>
              {formData.card ?
                options.cards.find(c => c.value === formData.card)?.text || formData.card :
                (!formData.bank ? '請先選擇銀行' : '請選擇卡片')
              }
            </span>
            {formData.bank && (
              <motion.span
                animate={{ rotate: showCardDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '12px' }}
              >
                ▼
              </motion.span>
            )}
          </motion.button>

          {/* 動畫下拉選單 */}
          <AnimatePresence>
            {showCardDropdown && formData.bank && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {options.cards.map((card, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleCardSelect(card.value, card.text)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: index < options.cards.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    {card.text}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 消費類別 */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>消費類別
          </label>

          {/* 自訂下拉選單觸發按鈕 */}
          <motion.button
            type="button"
            onClick={() => formData.card && setShowCategoryDropdown(!showCategoryDropdown)}
            whileHover={formData.card ? { scale: 1.01 } : {}}
            whileTap={formData.card ? { scale: 0.99 } : {}}
            disabled={!formData.card}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.card ? 'white' : '#f9fafb',
              textAlign: 'left',
              cursor: formData.card ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: formData.card ? 1 : 0.6
            }}
          >
            <span style={{
              color: formData.category ? '#111827' : '#9ca3af'
            }}>
              {formData.category ?
                options.categories.find(c => c.value === formData.category)?.text || formData.category :
                (!formData.card ? '請先選擇卡片' : '請選擇消費類別')
              }
            </span>
            {formData.card && (
              <motion.span
                animate={{ rotate: showCategoryDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '12px' }}
              >
                ▼
              </motion.span>
            )}
          </motion.button>

          {/* 動畫下拉選單 */}
          <AnimatePresence>
            {showCategoryDropdown && formData.card && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {options.categories.map((category, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleCategorySelect(category.value, category.text)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: index < options.categories.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    {category.text}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 消費種類 */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            marginBottom: '6px'
          }}>
            <span style={{ color: '#ef4444' }}>* </span>消費種類
          </label>

          {/* 自訂下拉選單觸發按鈕 */}
          <motion.button
            type="button"
            onClick={() => formData.category && setShowScopeDropdown(!showScopeDropdown)}
            whileHover={formData.category ? { scale: 1.01 } : {}}
            whileTap={formData.category ? { scale: 0.99 } : {}}
            disabled={!formData.category}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: formData.category ? 'white' : '#f9fafb',
              textAlign: 'left',
              cursor: formData.category ? 'pointer' : 'not-allowed',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: formData.category ? 1 : 0.6
            }}
          >
            <span style={{
              color: formData.scope ? '#111827' : '#9ca3af'
            }}>
              {formData.scope ?
                options.scopes.find(s => s.value === formData.scope)?.text || formData.scope :
                (!formData.category ? '請先選擇消費類別' : '請選擇消費種類')
              }
            </span>
            {formData.category && (
              <motion.span
                animate={{ rotate: showScopeDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '12px' }}
              >
                ▼
              </motion.span>
            )}
          </motion.button>

          {/* 動畫下拉選單 */}
          <AnimatePresence>
            {showScopeDropdown && formData.category && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {options.scopes.map((scope, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={optionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ backgroundColor: '#f3f4f6' }}
                    onClick={() => handleScopeSelect(scope.value, scope.text)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: index < options.scopes.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    {scope.text}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
            min="1"
            step="1"
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

    </div>
  );
}

export default Calculator;