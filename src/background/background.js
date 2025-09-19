console.log('Rewardia Background Script 已載入');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background 收到訊息:', request);

  if (request.type === 'FROM_CONTENT_SCRIPT') {
    console.log('來自 Content Script 的訊息:', request.data);
  }

  sendResponse({ success: true });
  return true;
});

chrome.action.onClicked.addListener((tab) => {
  console.log('套件圖示被點擊:', tab);
});