(function () {
  const CART_KEY = "herstyle_cart_v1";

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(function (item) {
          return {
            productId: Number(item.productId),
            size: String(item.size || ""),
            quantity: clampQuantity(item.quantity),
          };
        })
        .filter(function (item) {
          return Number.isFinite(item.productId) && item.quantity > 0 && item.size;
        });
    } catch (error) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    refreshBadges();
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }

  function clampQuantity(quantity) {
    const numeric = Number(quantity);
    if (!Number.isFinite(numeric)) return 1;
    return Math.min(10, Math.max(1, Math.round(numeric)));
  }

  function addItem(productId, size, quantity) {
    const product = window.StoreData.getProductById(productId);
    if (!product) {
      return { ok: false, message: "Product not found" };
    }

    const chosenSize = product.sizes.indexOf(size) > -1 ? size : product.sizes[0];
    const qty = clampQuantity(quantity || 1);

    if (!product.inStock) {
      return { ok: false, message: "Item is currently out of stock" };
    }

    const items = readCart();
    const existing = items.find(function (item) {
      return item.productId === product.id && item.size === chosenSize;
    });

    if (existing) {
      existing.quantity = clampQuantity(existing.quantity + qty);
    } else {
      items.push({ productId: product.id, size: chosenSize, quantity: qty });
    }

    saveCart(items);
    return { ok: true, message: "Item added to cart" };
  }

  function updateQuantity(productId, size, quantity) {
    const items = readCart();
    const index = items.findIndex(function (item) {
      return item.productId === Number(productId) && item.size === String(size);
    });

    if (index === -1) return;

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].quantity = clampQuantity(qty);
    }

    saveCart(items);
  }

  function removeItem(productId, size) {
    const items = readCart().filter(function (item) {
      return !(item.productId === Number(productId) && item.size === String(size));
    });

    saveCart(items);
  }

  function clearCart() {
    saveCart([]);
  }

  function getLineItems() {
    return readCart()
      .map(function (item) {
        const product = window.StoreData.getProductById(item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          size: item.size,
          quantity: item.quantity,
          product: product,
          lineTotal: product.price * item.quantity,
        };
      })
      .filter(Boolean);
  }

  function getItemCount() {
    return readCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function getSummary() {
    const lines = getLineItems();
    const subtotal = lines.reduce(function (sum, line) {
      return sum + line.lineTotal;
    }, 0);

    const totalQuantity = lines.reduce(function (sum, line) {
      return sum + line.quantity;
    }, 0);

    const shipping = subtotal === 0 || subtotal >= 4999 ? 0 : 149;
    const tax = Math.round(subtotal * 0.05);
    const bulkDiscount = totalQuantity >= 4 ? Math.round(subtotal * 0.08) : 0;
    const total = subtotal + shipping + tax - bulkDiscount;

    return {
      lines: lines,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      discount: bulkDiscount,
      total: total,
      totalQuantity: totalQuantity,
      isEmpty: lines.length === 0,
    };
  }

  function formatMoney(value) {
    return window.StoreData.formatMoney(value);
  }

  function refreshBadges() {
    const count = getItemCount();
    const nodes = document.querySelectorAll("[data-cart-count]");
    nodes.forEach(function (node) {
      node.textContent = String(count);
      node.classList.toggle("has-items", count > 0);
    });
  }

  window.addEventListener("storage", function (event) {
    if (event.key === CART_KEY) {
      refreshBadges();
    }
  });

  window.StoreCart = {
    addItem: addItem,
    updateQuantity: updateQuantity,
    removeItem: removeItem,
    clearCart: clearCart,
    getLineItems: getLineItems,
    getSummary: getSummary,
    getItemCount: getItemCount,
    formatMoney: formatMoney,
    refreshBadges: refreshBadges,
  };
})();
