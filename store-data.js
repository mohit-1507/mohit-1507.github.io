(function () {
  const CATEGORY_COUNTS = {
    blazers: 5,
    pants: 6,
    shirts: 6,
    skirts: 6,
    vests: 2,
  };

  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

  const CATEGORY_META = {
    blazers: {
      label: "Blazer",
      basePrice: 2599,
      styles: ["Tailored", "City", "Signature", "Weekend", "Classic"],
      fabrics: ["Wool Blend", "Linen Blend", "Textured Crepe"],
      colors: ["Black", "Beige", "Navy", "Stone"],
      fit: ["Tailored", "Regular", "Relaxed"],
    },
    pants: {
      label: "Pant",
      basePrice: 1699,
      styles: ["Straight", "High Rise", "Pleated", "Everyday", "Wide Leg"],
      fabrics: ["Cotton Twill", "Viscose Blend", "Crepe"],
      colors: ["Khaki", "Charcoal", "Olive", "Sand"],
      fit: ["Regular", "Relaxed", "Slim"],
    },
    shirts: {
      label: "Shirt",
      basePrice: 1399,
      styles: ["Studio", "Satin", "Cotton", "Workday", "Easy Fit"],
      fabrics: ["Poplin", "Satin Blend", "Cotton"],
      colors: ["White", "Sky", "Rose", "Mint"],
      fit: ["Regular", "Comfort", "Loose"],
    },
    skirts: {
      label: "Skirt",
      basePrice: 1549,
      styles: ["A Line", "Midi", "Pleated", "Wrap", "Flow"],
      fabrics: ["Viscose", "Satin", "Cotton Blend"],
      colors: ["Burgundy", "Cream", "Black", "Sage"],
      fit: ["Regular", "Flowy", "Slim"],
    },
    vests: {
      label: "Vest",
      basePrice: 1249,
      styles: ["Layered", "Ribbed", "Minimal", "Summer"],
      fabrics: ["Rib Knit", "Cotton Jersey", "Soft Knit"],
      colors: ["Ivory", "Taupe", "Black", "Dusty Pink"],
      fit: ["Slim", "Regular", "Comfort"],
    },
  };

  const DELIVERY_NOTES = [
    "Ships in 24 hours",
    "Express delivery in select cities",
    "Easy 7 day return",
    "Quality checked before dispatch",
  ];

  const SPECIAL_SIZE_TAGS = {
    "blazers-3": [{ size: "XS", tag: "Extra Petite" }],
    "shirts-1": [{ size: "XS", tag: "Extra Petite" }],
    "pants-6": [{ size: "XXL", tag: "Extra Wide" }],
    "skirts-5": [{ size: "XL", tag: "Extra Wide" }],
  };

  const products = buildProducts();

  function buildProducts() {
    const items = [];
    let id = 1;

    Object.entries(CATEGORY_COUNTS).forEach(function ([category, count]) {
      const meta = CATEGORY_META[category];

      for (let index = 1; index <= count; index += 1) {
        const style = pick(meta.styles, id + index);
        const fabric = pick(meta.fabrics, id * 2 + index);
        const color = pick(meta.colors, id + index * 3);
        const fit = pick(meta.fit, id + index * 4);
        const sizes = buildSizes(id, category);
        const slug = category + "-" + index;
        const specialSizeTags = buildSpecialSizeTags(slug, sizes);
        const imageBySize = buildImageBySize(category, index);
        const rating = Number((3.8 + ((id * 5) % 12) / 10).toFixed(1));
        const reviews = 60 + ((id * 37) % 540);
        const price = meta.basePrice + index * 140 + (id % 3) * 90;
        const discountPercent = 10 + (id % 4) * 5;
        const originalPrice = Math.round(price + (price * discountPercent) / 100);
        const inStock = id % 8 !== 0;
        const stockCount = inStock ? 2 + ((id * 3) % 10) : 0;
        const daysAgo = (id * 4) % 60;
        const addedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
        const popularity = Math.round((rating * reviews) / 9 + (inStock ? 15 : 0));

        const title = style + " " + meta.label;

        items.push({
          id: id,
          slug: slug,
          title: title,
          category: category,
          image: imageBySize.M,
          imageBySize: imageBySize,
          price: price,
          originalPrice: originalPrice,
          discountPercent: discountPercent,
          rating: rating,
          reviews: reviews,
          sizes: sizes,
          specialSizeTags: specialSizeTags,
          inStock: inStock,
          stockCount: stockCount,
          addedAt: addedAt,
          popularity: popularity,
          color: color,
          fabric: fabric,
          fit: fit,
          badge: getBadge(id, inStock),
          description:
            title +
            " in " +
            color +
            " finish. Built for everyday movement with a clean silhouette and soft hand-feel.",
          deliveryNote: pick(DELIVERY_NOTES, id),
        });

        id += 1;
      }
    });

    return items.filter(function (item) {
    return item.title !== "Pleated Pant";
    });

  }

  function buildImageBySize(category, index) {
    const map = {};
    SIZE_ORDER.forEach(function (size) {
      map[size] = "assets/size-variants/" + category + "/" + index + "-" + size + ".png";
    });
    return map;
  }

  function buildSizes(id, category) {
    const shift = (id + category.length) % SIZE_ORDER.length;
    const total = 3 + (id % 3);
    const result = [];

    for (let i = 0; i < total; i += 1) {
      const size = SIZE_ORDER[(shift + i) % SIZE_ORDER.length];
      if (result.indexOf(size) === -1) {
        result.push(size);
      }
    }

    return result;
  }

  function buildSpecialSizeTags(slug, sizes) {
    const configured = SPECIAL_SIZE_TAGS[slug] || [];
    return configured
      .filter(function (entry) {
        return sizes.indexOf(entry.size) > -1;
      })
      .map(function (entry) {
        return { size: entry.size, label: entry.tag };
      });
  }

  function getBadge(id, inStock) {
    if (!inStock) return "Out of stock";
    if (id % 5 === 0) return "New";
    if (id % 4 === 0) return "Bestseller";
    return "Popular";
  }

  function pick(list, index) {
    return list[index % list.length];
  }

  function getProductById(id) {
    const numericId = Number(id);
    return (
      products.find(function (item) {
        return item.id === numericId;
      }) || null
    );
  }

  function getImageForSize(productOrId, size) {
    const product = typeof productOrId === "object" && productOrId !== null
      ? productOrId
      : getProductById(productOrId);

    if (!product) return "";
    const chosenSize = String(size || "");
    if (product.imageBySize && product.imageBySize[chosenSize]) {
      return product.imageBySize[chosenSize];
    }

    if (product.imageBySize && product.imageBySize.M) {
      return product.imageBySize.M;
    }

    return product.image || "";
  }

  function getRelatedProducts(productId, limit) {
    const product = getProductById(productId);
    if (!product) return [];

    const max = typeof limit === "number" ? limit : 4;
    return products
      .filter(function (item) {
        return item.id !== product.id && item.category === product.category;
      })
      .sort(function (a, b) {
        return b.popularity - a.popularity;
      })
      .slice(0, max);
  }

  function formatMoney(value) {
    return "Rs. " + Number(value).toLocaleString("en-IN");
  }

  window.StoreData = {
    products: products,
    sizeOrder: SIZE_ORDER.slice(),
    categories: Object.keys(CATEGORY_COUNTS),
    getProductById: getProductById,
    getRelatedProducts: getRelatedProducts,
    getImageForSize: getImageForSize,
    formatMoney: formatMoney,
  };
})();

