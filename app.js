const products = window.StoreData.products;
const categories = window.StoreData.categories;
const sizeOrder = window.StoreData.sizeOrder;

const state = {
  search: "",
  selectedSizes: new Set(),
  selectedCategories: new Set(categories),
  maxPrice: 5000,
  minRating: 0,
  inStockOnly: false,
  sortBy: "featured",
};

const refs = {
  heroProductCount: document.getElementById("heroProductCount"),
  productGrid: document.getElementById("productGrid"),
  resultCount: document.getElementById("resultCount"),
  activeFilterCount: document.getElementById("activeFilterCount"),
  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  sizeFilters: document.getElementById("sizeFilters"),
  categoryFilters: document.getElementById("categoryFilters"),
  sortBy: document.getElementById("sortBy"),
  priceRange: document.getElementById("priceRange"),
  priceValue: document.getElementById("priceValue"),
  ratingFilter: document.getElementById("ratingFilter"),
  inStockOnly: document.getElementById("inStockOnly"),
  clearAll: document.getElementById("clearAll"),
  toast: document.getElementById("toast"),
};

let toastTimer = null;

initialize();

function initialize() {
  refs.heroProductCount.textContent = String(products.length);
  renderSizeFilters();
  renderCategoryFilters();
  wireEvents();

  refs.priceRange.value = String(state.maxPrice);
  refs.priceValue.textContent = window.StoreData.formatMoney(state.maxPrice);

  window.StoreCart.refreshBadges();
  render();
}

function wireEvents() {
  refs.searchInput.addEventListener("input", function (event) {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  refs.clearSearch.addEventListener("click", function () {
    refs.searchInput.value = "";
    state.search = "";
    render();
  });

  refs.sizeFilters.addEventListener("click", function (event) {
    const chip = event.target.closest("button[data-size]");
    if (!chip) return;

    const size = chip.dataset.size;
    if (state.selectedSizes.has(size)) {
      state.selectedSizes.delete(size);
      chip.classList.remove("active");
    } else {
      state.selectedSizes.add(size);
      chip.classList.add("active");
    }

    render();
  });

  refs.categoryFilters.addEventListener("change", function (event) {
    const input = event.target.closest("input[data-category]");
    if (!input) return;

    const category = input.dataset.category;
    if (input.checked) {
      state.selectedCategories.add(category);
    } else {
      state.selectedCategories.delete(category);
    }

    render();
  });

  refs.sortBy.addEventListener("change", function (event) {
    state.sortBy = event.target.value;
    render();
  });

  refs.priceRange.addEventListener("input", function (event) {
    state.maxPrice = Number(event.target.value);
    refs.priceValue.textContent = window.StoreData.formatMoney(state.maxPrice);
    render();
  });

  refs.ratingFilter.addEventListener("change", function (event) {
    state.minRating = Number(event.target.value);
    render();
  });

  refs.inStockOnly.addEventListener("change", function (event) {
    state.inStockOnly = event.target.checked;
    render();
  });

  refs.clearAll.addEventListener("click", resetFilters);

  refs.productGrid.addEventListener("click", function (event) {
    const addButton = event.target.closest("button.add-btn");
    if (addButton) {
      const cardForButton = addButton.closest(".product-card");
      const select = cardForButton ? cardForButton.querySelector(".quick-size") : null;
      const size = select ? select.value : "M";
      const result = window.StoreCart.addItem(Number(addButton.dataset.productId), size, 1);
      showToast(result.message, result.ok);
      return;
    }

    if (event.target.closest("a, select, option, input, button")) {
      return;
    }

    const card = event.target.closest(".product-card[data-detail-url]");
    if (!card) return;

    window.location.href = card.dataset.detailUrl;
  });

  refs.productGrid.addEventListener("change", function (event) {
    const sizeSelect = event.target.closest("select.quick-size");
    if (!sizeSelect) return;

    const card = sizeSelect.closest(".product-card");
    const image = card ? card.querySelector("img") : null;
    const productId = card ? Number(card.dataset.productId) : 0;
    const product = window.StoreData.getProductById(productId);

    if (image && product) {
      image.src = window.StoreData.getImageForSize(product, sizeSelect.value);
    }
  });

  window.addEventListener("cart:updated", function () {
    window.StoreCart.refreshBadges();
  });
}

function renderSizeFilters() {
  refs.sizeFilters.innerHTML = sizeOrder
    .map(function (size) {
      return '<button type="button" class="chip" data-size="' + size + '">' + size + "</button>";
    })
    .join("");
}

function renderCategoryFilters() {
  refs.categoryFilters.innerHTML = categories
    .map(function (category) {
      const label = capitalize(category);
      return (
        '<label><input type="checkbox" data-category="' +
        category +
        '" checked /><span>' +
        label +
        "</span></label>"
      );
    })
    .join("");
}

function resetFilters() {
  state.search = "";
  state.selectedSizes.clear();
  state.selectedCategories = new Set(categories);
  state.maxPrice = Number(refs.priceRange.max);
  state.minRating = 0;
  state.inStockOnly = false;
  state.sortBy = "featured";

  refs.searchInput.value = "";
  refs.sortBy.value = "featured";
  refs.priceRange.value = String(state.maxPrice);
  refs.priceValue.textContent = window.StoreData.formatMoney(state.maxPrice);
  refs.ratingFilter.value = "0";
  refs.inStockOnly.checked = false;

  refs.sizeFilters.querySelectorAll(".chip").forEach(function (chip) {
    chip.classList.remove("active");
  });

  refs.categoryFilters.querySelectorAll("input[data-category]").forEach(function (input) {
    input.checked = true;
  });

  render();
}

function getFilteredProducts() {
  return products
    .filter(function (product) {
      return state.selectedCategories.has(product.category);
    })
    .filter(function (product) {
      return product.price <= state.maxPrice;
    })
    .filter(function (product) {
      return product.rating >= state.minRating;
    })
    .filter(function (product) {
      return !state.inStockOnly || product.inStock;
    })
    .filter(function (product) {
      if (state.selectedSizes.size === 0) return true;
      return Array.from(state.selectedSizes).some(function (size) {
        return product.sizes.indexOf(size) > -1;
      });
    })
    .filter(function (product) {
      if (!state.search) return true;
      const content = (product.title + " " + product.category + " " + product.color).toLowerCase();
      return content.indexOf(state.search) > -1;
    });
}

function sortProducts(items) {
  const sorted = items.slice();

  switch (state.sortBy) {
    case "priceAsc":
      sorted.sort(function (a, b) {
        return a.price - b.price;
      });
      break;
    case "priceDesc":
      sorted.sort(function (a, b) {
        return b.price - a.price;
      });
      break;
    case "ratingDesc":
      sorted.sort(function (a, b) {
        return b.rating - a.rating || b.reviews - a.reviews;
      });
      break;
    case "newest":
      sorted.sort(function (a, b) {
        return new Date(b.addedAt) - new Date(a.addedAt);
      });
      break;
    default:
      sorted.sort(function (a, b) {
        return b.popularity - a.popularity;
      });
      break;
  }

  return sorted;
}

function render() {
  const filtered = sortProducts(getFilteredProducts());
  refs.resultCount.textContent = "Showing " + filtered.length + " products";

  const activeCount = getActiveFilterCount();
  refs.activeFilterCount.textContent =
    activeCount > 0 ? activeCount + " filters active" : "No filters applied";

  if (filtered.length === 0) {
    refs.productGrid.innerHTML =
      '<div class="empty-state"><h3>No matching results</h3><p class="hint">Try reducing filters or increasing your max price.</p></div>';
    return;
  }

  const template = document.getElementById("productCardTemplate");
  const fragment = document.createDocumentFragment();

  filtered.forEach(function (product) {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".product-card");
    const detailLinks = node.querySelectorAll("[data-detail-link]");
    const image = node.querySelector("img");
    const category = node.querySelector(".category");
    const badge = node.querySelector(".badge");
    const title = node.querySelector(".product-title");
    const price = node.querySelector(".price");
    const oldPrice = node.querySelector(".old-price");
    const rating = node.querySelector(".rating");
    const sizes = node.querySelector(".sizes");
    const quickSize = node.querySelector(".quick-size");
    const addBtn = node.querySelector(".add-btn");

    const detailHref = "product.html?id=" + product.id;
    card.dataset.detailUrl = detailHref;
    card.dataset.productId = String(product.id);
    card.classList.add("is-clickable");
    detailLinks.forEach(function (link) {
      link.href = detailHref;
    });

    const defaultSize = product.sizes.length ? product.sizes[0] : "M";
    image.src = window.StoreData.getImageForSize(product, defaultSize);
    image.alt = product.title;
    category.textContent = capitalize(product.category);
    badge.textContent = product.badge;
    title.textContent = product.title;
    price.textContent = window.StoreData.formatMoney(product.price);
    oldPrice.textContent = window.StoreData.formatMoney(product.originalPrice);
    rating.textContent =
      product.rating.toFixed(1) +
      "/5" +
      " (" +
      product.reviews +
      ")" +
      (product.inStock ? " In stock" : " Out of stock");

    const baseSizes = product.sizes
      .map(function (size) {
        return '<span class="size-tag">' + size + "</span>";
      })
      .join("");

    const specialFits = (product.specialSizeTags || [])
      .map(function (entry) {
        return '<span class="size-tag special-size-tag">' + entry.label + " (" + entry.size + ")</span>";
      })
      .join("");

    sizes.innerHTML = baseSizes + specialFits;

    quickSize.innerHTML = product.sizes
      .map(function (size) {
        return '<option value="' + size + '">' + size + "</option>";
      })
      .join("");
    quickSize.value = defaultSize;

    addBtn.dataset.productId = String(product.id);
    if (!product.inStock) {
      addBtn.disabled = true;
      addBtn.textContent = "Out of stock";
      card.style.opacity = "0.78";
    }

    fragment.appendChild(node);
  });

  refs.productGrid.innerHTML = "";
  refs.productGrid.appendChild(fragment);
}

function getActiveFilterCount() {
  let count = 0;

  if (state.selectedSizes.size > 0) count += state.selectedSizes.size;
  count += categories.length - state.selectedCategories.size;
  if (state.search) count += 1;
  if (state.maxPrice < Number(refs.priceRange.max)) count += 1;
  if (state.minRating > 0) count += 1;
  if (state.inStockOnly) count += 1;

  return count;
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

