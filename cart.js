const refs = {
  cartList: document.getElementById("cartList"),
  subtotalValue: document.getElementById("subtotalValue"),
  shippingValue: document.getElementById("shippingValue"),
  taxValue: document.getElementById("taxValue"),
  discountValue: document.getElementById("discountValue"),
  totalValue: document.getElementById("totalValue"),
  checkoutLink: document.getElementById("checkoutLink"),
};

initialize();

function initialize() {
  window.StoreCart.refreshBadges();
  wireEvents();
  render();
}

function wireEvents() {
  refs.cartList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const productId = Number(button.dataset.productId);
    const size = button.dataset.size;
    const action = button.dataset.action;
    const line = button.closest("[data-line]");
    const input = line ? line.querySelector("input.qty-value") : null;

    if (action === "remove") {
      window.StoreCart.removeItem(productId, size);
      render();
      return;
    }

    if (!input) return;

    const current = Number(input.value) || 1;
    if (action === "dec") {
      window.StoreCart.updateQuantity(productId, size, current - 1);
      render();
      return;
    }

    if (action === "inc") {
      window.StoreCart.updateQuantity(productId, size, current + 1);
      render();
    }
  });

  refs.cartList.addEventListener("change", function (event) {
    const input = event.target.closest("input.qty-value[data-product-id]");
    if (!input) return;

    const productId = Number(input.dataset.productId);
    const size = input.dataset.size;
    window.StoreCart.updateQuantity(productId, size, input.value);
    render();
  });

  window.addEventListener("cart:updated", function () {
    window.StoreCart.refreshBadges();
  });
}

function render() {
  const summary = window.StoreCart.getSummary();

  if (summary.isEmpty) {
    refs.cartList.innerHTML =
      '<div class="empty-state"><h3>Your cart is empty</h3><p class="hint">Add items from the shop to continue.</p><a class="primary-btn" href="index.html">Go to shop</a></div>';
    refs.checkoutLink.style.pointerEvents = "none";
    refs.checkoutLink.style.opacity = "0.6";
  } else {
    refs.checkoutLink.style.pointerEvents = "auto";
    refs.checkoutLink.style.opacity = "1";

    refs.cartList.innerHTML = summary.lines
      .map(function (line) {
        const product = line.product;

        return (
          '<article class="cart-item reveal" data-line><a href="product.html?id=' +
          product.id +
          '"><img src="' +
          window.StoreData.getImageForSize(product, line.size) +
          '" alt="' +
          product.title +
          '" /></a><div><h3><a href="product.html?id=' +
          product.id +
          '">' +
          product.title +
          '</a></h3><p>' +
          product.category +
          " | Size " +
          line.size +
          '</p><p class="price">' +
          window.StoreData.formatMoney(product.price) +
          " each</p><div class=\"cart-row\"><div class=\"qty-stepper\"><button type=\"button\" class=\"qty-btn\" data-action=\"dec\" data-product-id=\"" +
          product.id +
          "\" data-size=\"" +
          line.size +
          '\">-</button><input class="qty-value" type="number" min="1" max="10" value="' +
          line.quantity +
          '" data-product-id="' +
          product.id +
          '" data-size="' +
          line.size +
          '" /><button type="button" class="qty-btn" data-action="inc" data-product-id="' +
          product.id +
          '" data-size="' +
          line.size +
          '">+</button></div><button type="button" class="remove-btn" data-action="remove" data-product-id="' +
          product.id +
          '" data-size="' +
          line.size +
          '">Remove</button></div><p class="price">Line total: ' +
          window.StoreData.formatMoney(line.lineTotal) +
          "</p></div></article>"
        );
      })
      .join("");
  }

  refs.subtotalValue.textContent = window.StoreData.formatMoney(summary.subtotal);
  refs.shippingValue.textContent = summary.shipping === 0 ? "Free" : window.StoreData.formatMoney(summary.shipping);
  refs.taxValue.textContent = window.StoreData.formatMoney(summary.tax);
  refs.discountValue.textContent = summary.discount === 0 ? "-" : "-" + window.StoreData.formatMoney(summary.discount);
  refs.totalValue.textContent = window.StoreData.formatMoney(summary.total);
}

