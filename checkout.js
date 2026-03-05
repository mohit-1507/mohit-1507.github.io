const refs = {
  checkoutLayout: document.getElementById("checkoutLayout"),
  checkoutForm: document.getElementById("checkoutForm"),
  orderList: document.getElementById("orderList"),
  checkoutSubtotal: document.getElementById("checkoutSubtotal"),
  checkoutShipping: document.getElementById("checkoutShipping"),
  checkoutTax: document.getElementById("checkoutTax"),
  checkoutDiscount: document.getElementById("checkoutDiscount"),
  checkoutTotal: document.getElementById("checkoutTotal"),
  successBox: document.getElementById("successBox"),
  placeOrderBtn: document.getElementById("placeOrderBtn"),
};

let currentSummary = null;

initialize();

function initialize() {
  window.StoreCart.refreshBadges();
  currentSummary = window.StoreCart.getSummary();

  if (currentSummary.isEmpty) {
    refs.checkoutLayout.innerHTML =
      '<div class="empty-state"><h3>No items to checkout</h3><p class="hint">Add products to your cart before checkout.</p><a class="primary-btn" href="index.html">Go to shop</a></div>';
    return;
  }

  renderOrderSummary(currentSummary);
  refs.checkoutForm.addEventListener("submit", submitOrder);

  window.addEventListener("cart:updated", function () {
    window.StoreCart.refreshBadges();
  });
}

function renderOrderSummary(summary) {
  refs.orderList.innerHTML = summary.lines
    .map(function (line) {
      return (
        '<div class="summary-line"><span>' +
        line.product.title +
        " (" +
        line.size +
        ") x " +
        line.quantity +
        '</span><strong>' +
        window.StoreData.formatMoney(line.lineTotal) +
        "</strong></div>"
      );
    })
    .join("");

  refs.checkoutSubtotal.textContent = window.StoreData.formatMoney(summary.subtotal);
  refs.checkoutShipping.textContent = summary.shipping === 0 ? "Free" : window.StoreData.formatMoney(summary.shipping);
  refs.checkoutTax.textContent = window.StoreData.formatMoney(summary.tax);
  refs.checkoutDiscount.textContent = summary.discount === 0 ? "-" : "-" + window.StoreData.formatMoney(summary.discount);
  refs.checkoutTotal.textContent = window.StoreData.formatMoney(summary.total);
}

function submitOrder(event) {
  event.preventDefault();

  if (!refs.checkoutForm.checkValidity()) {
    refs.checkoutForm.reportValidity();
    return;
  }

  currentSummary = window.StoreCart.getSummary();
  if (currentSummary.isEmpty) {
    refs.checkoutLayout.innerHTML =
      '<div class="empty-state"><h3>Cart is empty</h3><p class="hint">Please add items before placing an order.</p><a class="primary-btn" href="index.html">Go to shop</a></div>';
    return;
  }

  refs.placeOrderBtn.disabled = true;
  refs.placeOrderBtn.textContent = "Processing...";

  const formData = new FormData(refs.checkoutForm);
  const now = new Date();
  const orderId = "HS" + String(Date.now()).slice(-8);
  const deliveryDate = new Date(now.getTime() + 5 * 86400000);

  const order = {
    orderId: orderId,
    placedAt: now.toISOString(),
    deliveryEta: deliveryDate.toISOString(),
    customer: {
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      address: String(formData.get("address") || ""),
      city: String(formData.get("city") || ""),
      state: String(formData.get("state") || ""),
      pincode: String(formData.get("pincode") || ""),
    },
    paymentMethod: String(formData.get("paymentMethod") || "UPI"),
    totals: {
      subtotal: currentSummary.subtotal,
      shipping: currentSummary.shipping,
      tax: currentSummary.tax,
      discount: currentSummary.discount,
      total: currentSummary.total,
    },
    items: currentSummary.lines.map(function (line) {
      return {
        productId: line.product.id,
        title: line.product.title,
        size: line.size,
        quantity: line.quantity,
        amount: line.lineTotal,
      };
    }),
  };

  localStorage.setItem("herstyle_last_order", JSON.stringify(order));

  window.setTimeout(function () {
    window.StoreCart.clearCart();
    refs.checkoutLayout.hidden = true;

    refs.successBox.hidden = false;
    refs.successBox.innerHTML =
      '<h3>Order placed successfully</h3><p><strong>Order ID:</strong> ' +
      order.orderId +
      '</p><p><strong>Customer:</strong> ' +
      order.customer.fullName +
      '</p><p><strong>Payment:</strong> ' +
      order.paymentMethod +
      '</p><p><strong>Total paid:</strong> ' +
      window.StoreData.formatMoney(order.totals.total) +
      '</p><p><strong>Estimated delivery:</strong> ' +
      deliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
      '</p><p class="muted">Confirmation details have been saved in this browser session.</p><div class="detail-actions"><a class="primary-btn" href="index.html">Continue shopping</a><a class="secondary-btn" href="cart.html">View cart</a></div>';

    refs.successBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 850);
}

