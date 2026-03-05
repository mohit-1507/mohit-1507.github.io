const refs = {
  form: document.getElementById("feedbackForm"),
  list: document.getElementById("feedbackList"),
  count: document.getElementById("feedbackCount"),
  clearAll: document.getElementById("clearFeedback"),
  toast: document.getElementById("feedbackToast"),
};

let toastTimer = null;

initialize();

function initialize() {
  if (window.StoreCart && typeof window.StoreCart.refreshBadges === "function") {
    window.StoreCart.refreshBadges();
  }

  refs.form.addEventListener("submit", submitFeedback);
  refs.form.addEventListener("reset", function () {
    window.setTimeout(function () {
      refs.form.querySelector("#feedbackRating").value = "5";
    }, 0);
  });

  refs.clearAll.addEventListener("click", function () {
    const hasFeedback = window.StoreFeedback.readAll().length > 0;
    if (!hasFeedback) return;

    const ok = window.confirm("Delete all saved feedback entries?");
    if (!ok) return;

    window.StoreFeedback.clear();
    showToast("All feedback cleared");
    renderFeedback();
  });

  refs.list.addEventListener("click", function (event) {
    const removeButton = event.target.closest("button[data-remove-id]");
    if (!removeButton) return;

    const id = removeButton.dataset.removeId;
    window.StoreFeedback.remove(id);
    showToast("Feedback entry removed");
    renderFeedback();
  });

  window.addEventListener("feedback:updated", renderFeedback);

  renderFeedback();
}

function submitFeedback(event) {
  event.preventDefault();

  if (!refs.form.checkValidity()) {
    refs.form.reportValidity();
    return;
  }

  const formData = new FormData(refs.form);

  window.StoreFeedback.add({
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    orderId: String(formData.get("orderId") || ""),
    category: String(formData.get("category") || ""),
    fitFeedback: String(formData.get("fitFeedback") || ""),
    recommend: String(formData.get("recommend") || "yes"),
    rating: Number(formData.get("rating") || 5),
    message: String(formData.get("message") || ""),
  });

  refs.form.reset();
  refs.form.querySelector("#feedbackRating").value = "5";

  showToast("Thanks, feedback saved successfully");
  renderFeedback();
}

function renderFeedback() {
  const items = window.StoreFeedback.readAll();
  refs.count.textContent = String(items.length);

  if (items.length === 0) {
    refs.list.innerHTML =
      '<div class="empty-state"><h3>No feedback yet</h3><p class="hint">Submitted feedback will appear here.</p></div>';
    refs.clearAll.disabled = true;
    refs.clearAll.style.opacity = "0.6";
    return;
  }

  refs.clearAll.disabled = false;
  refs.clearAll.style.opacity = "1";

  refs.list.innerHTML = items
    .map(function (item) {
      return (
        '<article class="feedback-item reveal">' +
        '<div class="feedback-item-head">' +
        '<h3>' +
        escapeHtml(item.name) +
        '</h3><p>' +
        formatDate(item.createdAt) +
        '</p>' +
        '</div>' +
        '<p class="feedback-stars">' +
        renderStars(item.rating) +
        ' <span>' +
        item.rating +
        '/5</span></p>' +
        '<p class="feedback-meta">Category: ' +
        escapeHtml(item.category) +
        ' | Fit: ' +
        escapeHtml(item.fitFeedback) +
        ' | Recommend: ' +
        escapeHtml(item.recommend) +
        '</p>' +
        (item.orderId ? '<p class="feedback-meta">Order: ' + escapeHtml(item.orderId) + '</p>' : "") +
        '<p class="feedback-message">' +
        escapeHtml(item.message) +
        '</p>' +
        '<div class="feedback-item-actions">' +
        (item.email ? '<p class="muted">' + escapeHtml(item.email) + '</p>' : '<p class="muted">No email provided</p>') +
        '<button class="remove-btn" type="button" data-remove-id="' +
        item.id +
        '">Delete</button>' +
        '</div>' +
        '</article>'
      );
    })
    .join("");
}

function renderStars(rating) {
  const full = "★★★★★".slice(0, rating);
  const empty = "☆☆☆☆☆".slice(0, 5 - rating);
  return full + empty;
}

function formatDate(iso) {
  const date = new Date(iso);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showToast(message) {
  refs.toast.hidden = false;
  refs.toast.textContent = message;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    refs.toast.hidden = true;
  }, 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
