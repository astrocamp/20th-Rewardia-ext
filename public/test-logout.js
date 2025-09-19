// 登出同步功能測試腳本
// 在瀏覽器控制台中執行此腳本來測試登出同步

console.log('🧪 [測試] 開始測試登出同步功能');

// 1. 模擬登出事件
function simulateLogout() {
    console.log('🚪 [測試] 模擬登出事件');

    localStorage.setItem('rewardia_login_event', JSON.stringify({
        timestamp: Date.now(),
        data: {
            isLoggedIn: false,
            source: 'manual_test_logout',
            timestamp: Date.now()
        }
    }));

    console.log('✅ [測試] 登出事件已觸發');
}

// 2. 清除所有登入相關的本地儲存
function clearLoginData() {
    console.log('🗑️ [測試] 清除所有登入資料');

    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userID');
    localStorage.removeItem('rewardia_login_event');

    console.log('✅ [測試] 登入資料已清除');
}

// 3. 檢查當前儲存的登入資料
function checkLoginData() {
    console.log('🔍 [測試] 檢查當前登入資料:');

    const data = {
        authToken: localStorage.getItem('authToken'),
        username: localStorage.getItem('username'),
        userID: localStorage.getItem('userID'),
        lastEvent: localStorage.getItem('rewardia_login_event')
    };

    console.table(data);
    return data;
}

// 4. 測試 API 登入狀態檢查
async function testAPICheck() {
    console.log('🌐 [測試] 測試 API 登入狀態檢查');

    try {
        const response = await fetch('https://rewardia.net/users/api/get_token', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('📊 [測試] API 回應狀態:', response.status);
        console.log('🔐 [測試] 是否已登入:', response.ok && response.status === 200);

        if (response.ok) {
            const data = await response.json();
            console.log('📋 [測試] API 回應資料:', data);
        }

        return response.ok && response.status === 200;
    } catch (error) {
        console.error('💥 [測試] API 檢查失敗:', error);
        return false;
    }
}

// 5. 完整測試流程
async function runFullTest() {
    console.log('🚀 [測試] 開始完整登出測試流程');

    console.log('\n1️⃣ 檢查初始狀態:');
    checkLoginData();

    console.log('\n2️⃣ 檢查 API 狀態:');
    const apiStatus = await testAPICheck();

    console.log('\n3️⃣ 模擬登出事件:');
    simulateLogout();

    console.log('\n4️⃣ 等待 2 秒後檢查狀態:');
    setTimeout(() => {
        checkLoginData();
        console.log('✅ [測試] 完整測試流程結束');
        console.log('💡 [測試] 請檢查 React 專案是否同步更新登出狀態');
    }, 2000);
}

// 6. 持續監聽 localStorage 變化
function monitorStorageChanges() {
    console.log('👂 [測試] 開始監聽 localStorage 變化');

    window.addEventListener('storage', (event) => {
        if (event.key === 'rewardia_login_event') {
            console.log('📨 [測試] 偵測到登入狀態變更事件:', event.newValue);

            if (event.newValue) {
                try {
                    const eventData = JSON.parse(event.newValue);
                    console.log('📋 [測試] 事件詳細內容:', eventData);
                } catch (error) {
                    console.error('💥 [測試] 解析事件失敗:', error);
                }
            }
        }
    });
}

// 使用說明
console.log(`
🔧 測試工具使用說明:

1. checkLoginData() - 檢查當前登入資料
2. testAPICheck() - 測試 API 登入狀態
3. simulateLogout() - 模擬登出事件
4. clearLoginData() - 清除所有登入資料
5. runFullTest() - 執行完整測試
6. monitorStorageChanges() - 監聽儲存變化

範例使用:
> runFullTest()
> monitorStorageChanges()
`);

// 自動開始監聽
monitorStorageChanges();