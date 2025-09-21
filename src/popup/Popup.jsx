import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import homeIcon from '../shared/images/account/icon/home.svg';
import giftIcon from '../shared/images/account/icon/gift.svg';
import userIcon from '../shared/images/account/icon/user.svg';
import calculatorIcon from '../shared/images/account/icon/calculator.svg';
import LoginPage from '../shared/components/LoginPage'
import MerchantRewards from '../shared/components/MerchantRewards'
import Calculator from '../shared/components/Calculator'
import { ToastProvider } from '../shared/contexts/ToastContext'
import '../shared/login.css'

export default function Popup() {
  const [active, setActive] = useState('account') // 預設顯示帳號頁面
  const [showCalculatorOverlay, setShowCalculatorOverlay] = useState(false)

  // 圖片基礎路徑設定
  const IMAGE_BASE_URL = 'https://rewardia-card-img.s3.ap-southeast-2.amazonaws.com/media/credit_cards/'

  // 首頁搜尋狀態 - 參考原版邏輯
  const [searchParams, setSearchParams] = useState({
    bank: '',
    category: '',
    scope: '',
    keyword: ''
  })
  const [allCards, setAllCards] = useState([]) // 所有卡片資料
  const [originalCards, setOriginalCards] = useState([]) // 原始資料備份
  const [displayCards, setDisplayCards] = useState([]) // 顯示的卡片
  const [banks, setBanks] = useState([])
  const [categories, setCategories] = useState([])
  const [scopes, setScopes] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' 為首頁, 'list' 為搜尋結果
  const [showDropdowns, setShowDropdowns] = useState({
    bank: false,
    card: false,
    category: false,
    scope: false
  })
  const [showSearchArea, setShowSearchArea] = useState(false)

  // 載入所有資料 - 參考原版 main-data API
  const fetchAllData = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://rewardia.net/api/main-data/')
      if (response.ok) {
        const data = await response.json()

        // 設定所有資料
        setOriginalCards(data.all_cards_data || [])
        setBanks(data.banks || [])
        setCategories(data.reward_categories_choices || [])
        setScopes(data.merchants || [])

        // 初始化顯示隨機卡片
        resetToGridView(data.all_cards_data || [])
      }
    } catch (error) {
      console.error('載入資料失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 重置到網格視圖 - 參考原版
  const resetToGridView = (cardsData = originalCards) => {
    const shuffled = [...cardsData].sort(() => 0.5 - Math.random())
    const randomCards = shuffled.slice(0, 5)

    // 處理回饋資訊格式，使其符合原本的顯示邏輯
    const cardsWithProcessedRewards = randomCards.map(card => ({
      ...card,
      rewards: processCardRewards(card.rewards || [])
    }))

    setDisplayCards(cardsWithProcessedRewards)
    setViewMode('grid')
  }

  // 處理卡片回饋資訊 - 計算最高最低回饋率
  const processCardRewards = (rewards) => {
    if (!rewards || rewards.length === 0) {
      return { maxRate: 0, minRate: 0, categories: 0, topCategory: '一般消費' }
    }

    const rates = rewards.map(reward => getRewardRate(reward.rate))
    const maxRate = Math.max(...rates)
    const minRate = Math.min(...rates)

    return {
      maxRate: maxRate || 0,
      minRate: minRate || 0,
      categories: rewards.length,
      topCategory: rewards[0]?.category || '一般消費'
    }
  }

  // 從回饋率字串中提取數值 - 參考原版邏輯
  const getRewardRate = (rateStr) => {
    if (!rateStr) return 0
    const rangeMatch = rateStr.match(/(\d+\.?\d*)%-(\d+\.?\d*)%/)
    const singleMatch = rateStr.match(/(\d+\.?\d*)%/)

    if (rangeMatch) {
      return Math.max(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]))
    } else if (singleMatch) {
      return parseFloat(singleMatch[1])
    }
    return 0
  }

  // 執行搜尋 - 參考原版邏輯
  const performSearch = () => {
    const hasSearchCriteria = searchParams.bank || searchParams.category || searchParams.scope || searchParams.keyword?.trim()

    if (!hasSearchCriteria) {
      resetToGridView()
      return
    }

    setViewMode('list')

    setTimeout(() => {
      let filteredCards = [...originalCards]

      // 依序套用篩選條件
      if (searchParams.bank) {
        filteredCards = filteredCards.filter(card => card.bank === searchParams.bank)
      }

      if (searchParams.category) {
        filteredCards = filteredCards.filter(card =>
          card.rewards.some(reward => reward.category.includes(searchParams.category))
        )
      }

      if (searchParams.scope) {
        filteredCards = filteredCards.filter(card =>
          card.rewards.some(reward => reward.scope === searchParams.scope)
        )
      }

      if (searchParams.keyword?.trim()) {
        const keyword = searchParams.keyword.trim().toLowerCase()
        filteredCards = filteredCards.filter(card => {
          const bankMatch = card.bank.toLowerCase().includes(keyword)
          const cardNameMatch = card.name.toLowerCase().includes(keyword)
          const rewardMatch = card.rewards.some(reward =>
            reward.category.toLowerCase().includes(keyword) ||
            reward.scope.toLowerCase().includes(keyword) ||
            reward.reward_type.toLowerCase().includes(keyword)
          )
          return bankMatch || cardNameMatch || rewardMatch
        })
      }

      // 處理回饋資訊格式
      const cardsWithProcessedRewards = filteredCards.slice(0, 10).map(card => ({
        ...card,
        rewards: processCardRewards(card.rewards || [])
      }))

      setDisplayCards(cardsWithProcessedRewards)
    }, 100)
  }

  // 關閉所有下拉選單
  const closeAllDropdowns = () => {
    setShowDropdowns({
      bank: false,
      card: false,
      category: false,
      scope: false
    })
  }

  // 處理搜尋參數變更 - 簡化版本，參考原版
  const handleSearchChange = (field, value) => {
    closeAllDropdowns()

    // 參考原版：當使用下拉選單時，清空關鍵字搜尋
    if (field !== 'keyword') {
      setSearchParams(prev => ({ ...prev, [field]: value, keyword: '' }))
    } else {
      // 當使用關鍵字搜尋時，清空其他選擇器
      setSearchParams({ bank: '', category: '', scope: '', keyword: value })
    }

    // 延遲執行搜尋，確保狀態更新完成
    setTimeout(() => {
      performSearch()
    }, 50)
  }

  // 切換下拉選單
  const toggleDropdown = (field) => {
    setShowDropdowns(prev => ({
      bank: false,
      card: false,
      category: false,
      scope: false,
      [field]: !prev[field]
    }))
  }

  // 清空搜尋 - 簡化版本
  const clearSearch = () => {
    setSearchParams({ bank: '', category: '', scope: '', keyword: '' })
    closeAllDropdowns()
    resetToGridView()
  }

  // 初始化載入所有資料
  useEffect(() => {
    if (active === 'home') {
      fetchAllData()
    }
  }, [active])

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 檢查點擊是否在下拉選單外
      if (!event.target.closest('.dropdown-container')) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 動畫 variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  // 下拉選單動畫
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
  }

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
  }

  const calculatorVariants = {
    hidden: {
      x: "100%",
      opacity: 0,
      scale: 0.95
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 }
      }
    },
    exit: {
      x: "100%",
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  }

  return (
    <ToastProvider>
      <div style={{
        width: '360px',
        height: '520px',
        background: 'white',
        color: '#111827',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
      {/* Header */}
      <header style={{
        height: '56px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f2937',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          letterSpacing: '0.025em'
        }}>REWARDIA</div>

        {/* 右上角浮動試算器按鈕 */}
        <motion.button
          onClick={() => setShowCalculatorOverlay(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'absolute',
            right: '16px',
            width: '36px',
            height: '36px',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
          }}
        >
          <img
            src={calculatorIcon}
            alt="試算器"
            style={{
              width: '20px',
              height: '20px',
              filter: 'brightness(0) saturate(100%) invert(100%)'
            }}
          />
        </motion.button>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'white'
      }}>
        {active === 'home' && (
          <section style={{
            padding: '16px',
            maxWidth: '400px',
            margin: '0 auto',
            fontFamily: '"Kulim Park", sans-serif'
          }}>
            {/* 搜尋區域切換按鈕 */}
            <motion.button
              onClick={() => setShowSearchArea(!showSearchArea)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>卡片搜尋</span>
              <motion.span
                animate={{ rotate: showSearchArea ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '14px' }}
              >
                ▼
              </motion.span>
            </motion.button>

            {/* 可折疊的搜尋區域 */}
            <AnimatePresence>
              {showSearchArea && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden', marginBottom: '16px' }}
                >
                  <div
                    className="dropdown-container"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      overflow: 'visible',
                      marginBottom: '16px'
                    }}
                  >
                    {/* 銀行選擇 */}
                    <div style={{ position: 'relative', borderBottom: '1px solid #e5e7eb' }}>
                      <motion.button
                        type="button"
                        onClick={() => toggleDropdown('bank')}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontFamily: '"Kulim Park", sans-serif'
                        }}
                      >
                        <span style={{ color: searchParams.bank ? '#111827' : '#9ca3af' }}>
                          {searchParams.bank || '選擇銀行'}
                        </span>
                        <motion.span
                          animate={{ rotate: showDropdowns.bank ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ fontSize: '12px' }}
                        >
                          ▼
                        </motion.span>
                      </motion.button>

                      {/* 銀行下拉選單 */}
                      <AnimatePresence>
                        {showDropdowns.bank && (
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
                              maxHeight: '240px',
                              overflowY: 'auto'
                            }}
                          >
                            {banks.map((bank, index) => (
                              <motion.div
                                key={bank.name}
                                custom={index}
                                variants={optionVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => handleSearchChange('bank', bank.name)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontFamily: '"Kulim Park", sans-serif',
                                  borderBottom: index < banks.length - 1 ? '1px solid #e5e7eb' : 'none'
                                }}
                              >
                                {bank.name}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>


                    {/* 優惠類別選擇 */}
                    <div style={{
                      position: 'relative',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <motion.button
                        type="button"
                        onClick={() => toggleDropdown('category')}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontFamily: '"Kulim Park", sans-serif'
                        }}
                      >
                        <span style={{
                          color: searchParams.category ? '#111827' : '#6b7280'
                        }}>
                          {searchParams.category ?
                            categories.find(c => c[0] === searchParams.category)?.[1] || searchParams.category :
                            '選擇優惠類別'
                          }
                        </span>
                        <motion.span
                          animate={{ rotate: showDropdowns.category ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ fontSize: '12px' }}
                        >
                          ▼
                        </motion.span>
                      </motion.button>

                      {/* 優惠類別下拉選單 */}
                      <AnimatePresence>
                        {showDropdowns.category && (
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
                              maxHeight: '240px',
                              overflowY: 'auto'
                            }}
                          >
                            {categories.slice(0, 10).map((category, index) => (
                              <motion.div
                                key={category[0]}
                                custom={index}
                                variants={optionVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => handleSearchChange('category', category[1])}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontFamily: '"Kulim Park", sans-serif',
                                  borderBottom: index < Math.min(categories.length, 10) - 1 ? '1px solid #e5e7eb' : 'none'
                                }}
                              >
                                {category[1]}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 店家範圍選擇 */}
                    <div style={{ position: 'relative' }}>
                      <motion.button
                        type="button"
                        onClick={() => toggleDropdown('scope')}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontFamily: '"Kulim Park", sans-serif'
                        }}
                      >
                        <span style={{
                          color: searchParams.scope ? '#111827' : '#6b7280'
                        }}>
                          {searchParams.scope ?
                            scopes.find(s => s.name === searchParams.scope)?.name || searchParams.scope :
                            '選擇店家範圍'
                          }
                        </span>
                        <motion.span
                          animate={{ rotate: showDropdowns.scope ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ fontSize: '12px' }}
                        >
                          ▼
                        </motion.span>
                      </motion.button>

                      {/* 店家範圍下拉選單 */}
                      <AnimatePresence>
                        {showDropdowns.scope && (
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
                              maxHeight: '240px',
                              overflowY: 'auto'
                            }}
                          >
                            {scopes.slice(0, 10).map((scope, index) => (
                              <motion.div
                                key={scope.name}
                                custom={index}
                                variants={optionVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ backgroundColor: '#f3f4f6' }}
                                onClick={() => handleSearchChange('scope', scope.name)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontFamily: '"Kulim Park", sans-serif',
                                  borderBottom: index < Math.min(scopes.length, 10) - 1 ? '1px solid #e5e7eb' : 'none'
                                }}
                              >
                                {scope.name}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* 清空按鈕 */}
                  {(searchParams.bank || searchParams.category || searchParams.scope || searchParams.keyword) && (
                    <button
                      onClick={clearSearch}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        fontFamily: '"Kulim Park", sans-serif'
                      }}
                    >
                      清空搜尋條件
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* 載入狀態 */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#6b7280'
              }}>
                載入中...
              </div>
            )}

            {/* 推薦標題 - 只在網格模式時顯示 */}
            {displayCards.length > 0 && viewMode === 'grid' && (
              <div style={{
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 8px 0',
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  推薦卡片
                </h2>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: 0,
                  fontFamily: '"Kulim Park", sans-serif'
                }}>
                  為您精選熱門信用卡
                </p>
              </div>
            )}

            {/* 卡片展示區域 */}
            {displayCards.length > 0 && (
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {displayCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      minHeight: '80px'
                    }}
                  >
                    {/* 卡片圖片 */}
                    <div style={{
                      width: '60px',
                      height: '38px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {card.image ? (
                        <img
                          src={card.image ? (card.image.includes('http') ? card.image : IMAGE_BASE_URL + card.image.split('/').pop()) : ''}
                          alt={card.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                          textAlign: 'center'
                        }}>
                          卡片
                        </span>
                      )}
                    </div>

                    {/* 卡片資訊 */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: '0 0 4px 0',
                        color: '#111827',
                        lineHeight: '1.3'
                      }}>
                        {card.name}
                      </h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: '0 0 8px 0'
                      }}>
                        {card.bank}
                      </p>

                      {/* 回饋資訊 */}
                      {card.rewards && (
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '11px',
                          color: '#374151'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            minWidth: '45px'
                          }}>
                            <span style={{ fontWeight: '600', color: '#2563eb' }}>
                              {card.rewards.maxRate}%
                            </span>
                            <span style={{ fontSize: '9px', color: '#6b7280' }}>最高</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            minWidth: '45px'
                          }}>
                            <span style={{ fontWeight: '600', color: '#059669' }}>
                              {card.rewards.minRate}%
                            </span>
                            <span style={{ fontSize: '9px', color: '#6b7280' }}>最低</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            minWidth: '35px'
                          }}>
                            <span style={{ fontWeight: '600', color: '#7c3aed' }}>
                              {card.rewards.categories}
                            </span>
                            <span style={{ fontSize: '9px', color: '#6b7280' }}>類別</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </section>
        )}
        {active === 'rewards' && (
          <div style={{height: '100%'}}>
            <MerchantRewards />
          </div>
        )}
        {active === 'account' && (
          <div style={{height: '100%'}}>
            <LoginPage />
          </div>
        )}
      </main>

      {/* Navbar */}
      <nav style={{
        height: '64px',
        background: 'white',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        boxSizing: 'border-box',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            color: active === 'home' ? '#2563eb' : '#6b7280',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setActive('home')} aria-label="首頁"
        >
          <img
            src={homeIcon}
            alt="首頁"
            style={{
              width: '16px',
              height: '16px',
              filter: active === 'home' ? 'brightness(0) saturate(100%) invert(28%) sepia(77%) saturate(4475%) hue-rotate(208deg)' : 'brightness(0) saturate(100%) invert(42%)',
              transform: active === 'home' ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s, filter 0.2s'
            }}
          />
          <span>首頁</span>
        </button>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            color: active === 'rewards' ? '#2563eb' : '#6b7280',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setActive('rewards')} aria-label="商家回饋"
        >
          <img
            src={giftIcon}
            alt="商家回饋"
            style={{
              width: '16px',
              height: '16px',
              filter: active === 'rewards' ? 'brightness(0) saturate(100%) invert(28%) sepia(77%) saturate(4475%) hue-rotate(208deg)' : 'brightness(0) saturate(100%) invert(42%)',
              transform: active === 'rewards' ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s, filter 0.2s'
            }}
          />
          <span>商家回饋</span>
        </button>
        <button
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '12px',
            color: active === 'account' ? '#2563eb' : '#6b7280',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={() => setActive('account')} aria-label="帳號"
        >
          <img
            src={userIcon}
            alt="帳號"
            style={{
              width: '16px',
              height: '16px',
              filter: active === 'account' ? 'brightness(0) saturate(100%) invert(28%) sepia(77%) saturate(4475%) hue-rotate(208deg)' : 'brightness(0) saturate(100%) invert(42%)',
              transform: active === 'account' ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s, filter 0.2s'
            }}
          />
          <span>帳號</span>
        </button>
      </nav>

      {/* 浮動試算器 Overlay */}
      <AnimatePresence>
        {showCalculatorOverlay && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setShowCalculatorOverlay(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000
              }}
            />

            {/* 試算器面板 */}
            <motion.div
              variants={calculatorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'fixed',
                top: '16px',
                right: '16px',
                width: '320px',
                height: '480px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                zIndex: 1001,
                overflow: 'hidden'
              }}
            >
              {/* 關閉按鈕 */}
              <button
                onClick={() => setShowCalculatorOverlay(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#666',
                  zIndex: 1002
                }}
              >
                ×
              </button>

              {/* 試算器內容 */}
              <Calculator
                isVisible={true}
                onClose={() => setShowCalculatorOverlay(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </ToastProvider>
  )
}