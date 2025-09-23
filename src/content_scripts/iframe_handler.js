window.addEventListener("message", (event) => {
  // 只接受來自 cart.momoshop.com.tw 的訊息
  if (event.origin !== "https://cart.momoshop.com.tw") {
    return;
  }

  if (event.data.action === "fillCreditCard") {
    fillCreditCardForm(event.data);
  }
});

function fillCreditCardForm(data) {
  const cardInput = document.getElementById("cardNumber");
  if (cardInput) {
    const cleanNumber = data.cardNumber.replace(/\s/g, "");
    // 在信用卡號碼之間加空格
    cardInput.value = `${cleanNumber.slice(0, 4)}  ${cleanNumber.slice(
      4,
      8
    )}  ${cleanNumber.slice(8, 12)}  ${cleanNumber.slice(12, 16)}`;
  }
}
