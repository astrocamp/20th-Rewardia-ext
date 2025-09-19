// Cookie 檢查工具 - 在 rewardia.net 控制台執行
// 用來分析 Rewardia 網站使用的 session/auth cookies

console.log('🍪 [Cookie檢查] 開始檢查 Rewardia cookies');

// 1. 檢查所有 cookies
function inspectAllCookies() {
    console.log('📋 [Cookie檢查] 所有 cookies:');

    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            acc[name] = value;
        }
        return acc;
    }, {});

    console.table(cookies);
    return cookies;
}

// 2. 檢查特定的認證相關 cookies
function checkAuthCookies() {
    console.log('🔐 [Cookie檢查] 認證相關 cookies:');

    const authCookieNames = [
        'sessionid', 'csrftoken', 'auth_token', 'user_id',
        'jwt', 'access_token', 'refresh_token', 'sid',
        'PHPSESSID', 'JSESSIONID', 'session', '_session'
    ];

    const authCookies = {};

    authCookieNames.forEach(name => {
        const value = getCookie(name);
        if (value) {
            authCookies[name] = value;
        }
    });

    console.table(authCookies);
    return authCookies;
}

// 3. 取得特定 cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// 4. 監聽 cookie 變化
function monitorCookieChanges() {
    console.log('👂 [Cookie檢查] 開始監聽 cookie 變化...');

    let lastCookies = document.cookie;

    const checkChanges = () => {
        const currentCookies = document.cookie;

        if (currentCookies !== lastCookies) {
            console.log('🔄 [Cookie檢查] Cookie 變化偵測到！');
            console.log('舊:', lastCookies);
            console.log('新:', currentCookies);

            // 分析變化
            const oldCookies = parseCookies(lastCookies);
            const newCookies = parseCookies(currentCookies);

            // 找出新增的 cookies
            Object.keys(newCookies).forEach(key => {
                if (!oldCookies[key]) {
                    console.log(`➕ [Cookie檢查] 新增 cookie: ${key} = ${newCookies[key]}`);
                }
            });

            // 找出刪除的 cookies
            Object.keys(oldCookies).forEach(key => {
                if (!newCookies[key]) {
                    console.log(`➖ [Cookie檢查] 刪除 cookie: ${key}`);
                }
            });

            // 找出修改的 cookies
            Object.keys(newCookies).forEach(key => {
                if (oldCookies[key] && oldCookies[key] !== newCookies[key]) {
                    console.log(`✏️ [Cookie檢查] 修改 cookie: ${key}`);
                    console.log(`   舊值: ${oldCookies[key]}`);
                    console.log(`   新值: ${newCookies[key]}`);
                }
            });

            lastCookies = currentCookies;
        }
    };

    // 每秒檢查一次
    const interval = setInterval(checkChanges, 1000);

    console.log('✅ [Cookie檢查] Cookie 監聽器已啟動（每秒檢查）');
    console.log('💡 [Cookie檢查] 現在請登入/登出來觀察 cookie 變化');

    // 返回停止監聽的函數
    return () => {
        clearInterval(interval);
        console.log('🛑 [Cookie檢查] Cookie 監聽器已停止');
    };
}

// 5. 解析 cookie 字串
function parseCookies(cookieString) {
    return cookieString.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            acc[name] = value;
        }
        return acc;
    }, {});
}

// 6. 檢查 localStorage 和 sessionStorage
function checkStorages() {
    console.log('💾 [Storage檢查] localStorage:');
    const localData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        localData[key] = localStorage.getItem(key);
    }
    console.table(localData);

    console.log('💾 [Storage檢查] sessionStorage:');
    const sessionData = {};
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        sessionData[key] = sessionStorage.getItem(key);
    }
    console.table(sessionData);

    return { localStorage: localData, sessionStorage: sessionData };
}

// 7. 模擬登出來測試 cookie 刪除
function simulateLogout() {
    console.log('🚪 [Cookie檢查] 模擬登出測試');

    const beforeLogout = checkAuthCookies();
    console.log('登出前的認證 cookies:', beforeLogout);

    // 找到登出連結或按鈕
    const logoutElements = [
        ...document.querySelectorAll('a[href*="logout"]'),
        ...document.querySelectorAll('button[onclick*="logout"]'),
        ...document.querySelectorAll('.logout-btn'),
        ...document.querySelectorAll('[class*="logout"]'),
        ...document.querySelectorAll('[id*="logout"]')
    ];

    console.log('找到的登出元素:', logoutElements);

    if (logoutElements.length > 0) {
        console.log('💡 [Cookie檢查] 建議點擊以下登出元素來測試:');
        logoutElements.forEach((el, index) => {
            console.log(`${index + 1}. ${el.tagName} - ${el.textContent || el.value || '(無文字)'}`);
        });
    } else {
        console.log('❌ [Cookie檢查] 未找到登出元素');
    }
}

// 使用說明
console.log(`
🔧 Cookie 檢查工具使用說明:

1. inspectAllCookies() - 檢查所有 cookies
2. checkAuthCookies() - 檢查認證相關 cookies
3. getCookie('name') - 取得特定 cookie
4. monitorCookieChanges() - 開始監聽 cookie 變化
5. checkStorages() - 檢查 localStorage 和 sessionStorage
6. simulateLogout() - 找出登出元素來測試

建議執行順序:
> checkAuthCookies()  // 先看有哪些認證 cookies
> const stopMonitor = monitorCookieChanges()  // 開始監聽
> // 然後去登入/登出來觀察變化
> stopMonitor()  // 結束監聽
`);

// 自動執行初始檢查
console.log('\n🚀 [Cookie檢查] 自動執行初始檢查:');
inspectAllCookies();
checkAuthCookies();
checkStorages();