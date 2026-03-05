const refs = {
  crumbTitle: document.getElementById("crumbTitle"),
  detailContainer: document.getElementById("detailContainer"),
  relatedGrid: document.getElementById("relatedGrid"),
  toast: document.getElementById("toast"),
};

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));
const product = window.StoreData.getProductById(productId);

const state = {
  selectedSize: product && product.sizes.length ? product.sizes[0] : "M",
  quantity: 1,
};

let toastTimer = null;

initialize();

function initialize() {
  window.StoreCart.refreshBadges();

  if (!product) {
    refs.crumbTitle.textContent = "Missing product";
    refs.detailContainer.innerHTML =
      '<div class="empty-state"><h3>Product not found</h3><p class="hint">This item is unavailable.</p><a class="primary-btn" href="index.html">Back to shop</a></div>';
    refs.relatedGrid.innerHTML = "";
    return;
  }

  refs.crumbTitle.textContent = product.title;
  renderDetail(product);
  renderRelated(product);
  wireEvents();
}

function renderDetail(item) {
  const specialFits = (item.specialSizeTags || [])
    .map(function (entry) {
      return '<span class="size-tag special-size-tag">' + entry.label + " (" + entry.size + ")</span>";
    })
    .join("");

  const specialFitSection =
    specialFits.length > 0
      ? '<div class="size-picker"><p class="muted">Special fit labels</p><div class="sizes">' + specialFits + "</div></div>"
      : "";

  refs.detailContainer.innerHTML =
    '<article class="gallery-card reveal">' +
    '<img id="detailImage" src="' +
    window.StoreData.getImageForSize(item, state.selectedSize) +
    '" alt="' +
    item.title +
    '" />' +
    "</article>" +
    '<article class="info-card reveal">' +
    '<p class="detail-meta"><span>' +
    capitalize(item.category) +
    "</span><span>" +
    item.badge +
    "</span></p>" +
    '<h1 class="detail-title">' +
    item.title +
    "</h1>" +
    '<p class="detail-price-row"><span class="detail-price">' +
    window.StoreData.formatMoney(item.price) +
    '</span><span class="old-price">' +
    window.StoreData.formatMoney(item.originalPrice) +
    "</span></p>" +
    '<p class="detail-rating">' +
    item.rating.toFixed(1) +
    "/5 from " +
    item.reviews +
    " reviews" +
    (item.inStock ? " In stock" : " Out of stock") +
    "</p>" +
    '<p class="detail-description">' +
    item.description +
    "</p>" +
    '<div class="spec-grid">' +
    '<div class="spec-item"><p>Color</p><p>' +
    item.color +
    "</p></div>" +
    '<div class="spec-item"><p>Fabric</p><p>' +
    item.fabric +
    "</p></div>" +
    '<div class="spec-item"><p>Fit</p><p>' +
    item.fit +
    "</p></div>" +
    '<div class="spec-item"><p>Stock</p><p>' +
    (item.inStock ? item.stockCount + " units" : "Unavailable") +
    "</p></div>" +
    "</div>" +
    '<div class="size-picker"><p class="muted">Choose size</p><div id="detailSizes" class="size-button-grid">' +
    item.sizes
      .map(function (size) {
        const activeClass = size === state.selectedSize ? " size-btn active" : " size-btn";
        return '<button type="button" class="' + activeClass + '" data-size="' + size + '">' + size + "</button>";
      })
      .join("") +
    "</div></div>" +
    specialFitSection +
    '<div class="qty-row"><span class="muted">Quantity</span><div class="qty-stepper"><button type="button" id="qtyMinus" class="qty-btn">-</button><input id="qtyValue" class="qty-value" type="number" min="1" max="10" value="1" /><button type="button" id="qtyPlus" class="qty-btn">+</button></div></div>' +
    '<div class="detail-actions"><button id="addToCartBtn" class="primary-btn" type="button">Add to cart</button><button id="buyNowBtn" class="secondary-btn" type="button">Buy now</button></div>' +
    '<p class="delivery-note">' +
    item.deliveryNote +
    "</p>" +
    "</article>";

  if (!item.inStock) {
    const addBtn = document.getElementById("addToCartBtn");
    const buyBtn = document.getElementById("buyNowBtn");
    addBtn.disabled = true;
    buyBtn.disabled = true;
  }
}

function wireEvents() {
  refs.detailContainer.addEventListener("click", function (event) {
    const sizeButton = event.target.closest("button[data-size]");
    if (sizeButton) {
      state.selectedSize = sizeButton.dataset.size;
      const allButtons = refs.detailContainer.querySelectorAll("button[data-size]");
      allButtons.forEach(function (button) {
        button.classList.toggle("active", button.dataset.size === state.selectedSize);
      });

      const detailImage = document.getElementById("detailImage");
      if (detailImage) {
        detailImage.src = window.StoreData.getImageForSize(product, state.selectedSize);
      }
      return;
    }

    if (event.target.id === "qtyMinus") {
      setQuantity(state.quantity - 1);
      return;
    }

    if (event.target.id === "qtyPlus") {
      setQuantity(state.quantity + 1);
      return;
    }

    if (event.target.id === "addToCartBtn") {
      const result = window.StoreCart.addItem(product.id, state.selectedSize, state.quantity);
      showToast(result.message, result.ok);
      return;
    }

    if (event.target.id === "buyNowBtn") {
      const result = window.StoreCart.addItem(product.id, state.selectedSize, state.quantity);
      if (result.ok) {
        window.location.href = "checkout.html";
      } else {
        showToast(result.message, false);
      }
    }
  });

  refs.detailContainer.addEventListener("change", function (event) {
    if (event.target.id === "qtyValue") {
      setQuantity(event.target.value);
    }
  });

  refs.relatedGrid.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-add-related]");
    if (!button) return;

    const relatedId = Number(button.dataset.addRelated);
    const related = window.StoreData.getProductById(relatedId);
    if (!related) return;

    const result = window.StoreCart.addItem(related.id, related.sizes[0], 1);
    showToast(result.message, result.ok);
  });

  window.addEventListener("cart:updated", function () {
    window.StoreCart.refreshBadges();
  });
}

function renderRelated(item) {
  const related = window.StoreData.getRelatedProducts(item.id, 4);
  if (!related.length) {
    refs.relatedGrid.innerHTML = '<div class="empty-state"><p class="hint">No similar styles right now.</p></div>';
    return;
  }

  refs.relatedGrid.innerHTML = related
    .map(function (entry) {
      return (
        '<article class="product-card reveal">' +
        '<a class="image-link" href="product.html?id=' +
        entry.id +
        '"><img src="' +
        window.StoreData.getImageForSize(entry, entry.sizes[0]) +
        '" alt="' +
        entry.title +
        '" /></a>' +
        '<div class="card-body"><p class="meta-row"><span class="category">' +
        capitalize(entry.category) +
        '</span><span class="badge">' +
        entry.badge +
        '</span></p><a class="product-title" href="product.html?id=' +
        entry.id +
        '">' +
        entry.title +
        '</a><p class="price-row"><span class="price">' +
        window.StoreData.formatMoney(entry.price) +
        '</span></p><div class="card-controls"><button class="primary-btn" type="button" data-add-related="' +
        entry.id +
        '">Add to cart</button></div></div></article>'
      );
    })
    .join("");
}

function setQuantity(value) {
  const numeric = Number(value);
  const safe = Math.min(10, Math.max(1, Number.isFinite(numeric) ? Math.round(numeric) : 1));
  state.quantity = safe;

  const input = document.getElementById("qtyValue");
  if (input) {
    input.value = String(safe);
  }
}

function showToast(message, isSuccess) {
  if (!refs.toast) return;

  refs.toast.hidden = false;
  refs.toast.textContent = message;
  refs.toast.style.background = isSuccess ? "#143d2a" : "#4f1e24";

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    refs.toast.hidden = true;
  }, 1700);
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
