(function () {
  const FEEDBACK_KEY = "herstyle_feedback_v1";

  function readAll() {
    try {
      const raw = localStorage.getItem(FEEDBACK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map(function (item) {
          return normalize(item);
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    } catch (error) {
      return [];
    }
  }

  function normalize(item) {
    if (!item || typeof item !== "object") return null;

    const rating = Number(item.rating);
    const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5;

    return {
      id: String(item.id || ""),
      name: String(item.name || "Anonymous"),
      email: String(item.email || ""),
      orderId: String(item.orderId || ""),
      category: String(item.category || "General"),
      fitFeedback: String(item.fitFeedback || "Not specified"),
      recommend: String(item.recommend || "yes"),
      rating: safeRating,
      message: String(item.message || ""),
      createdAt: String(item.createdAt || new Date().toISOString()),
    };
  }

  function save(items) {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("feedback:updated"));
  }

  function add(entry) {
    const now = new Date().toISOString();
    const all = readAll();

    const item = normalize({
      id: "FDBK-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      name: entry.name,
      email: entry.email,
      orderId: entry.orderId,
      category: entry.category,
      fitFeedback: entry.fitFeedback,
      recommend: entry.recommend,
      rating: entry.rating,
      message: entry.message,
      createdAt: now,
    });

    all.push(item);
    save(all);
    return item;
  }

  function remove(id) {
    const target = String(id || "");
    const next = readAll().filter(function (item) {
      return item.id !== target;
    });
    save(next);
  }

  function clear() {
    save([]);
  }

  window.StoreFeedback = {
    readAll: readAll,
    add: add,
    remove: remove,
    clear: clear,
  };
})();
