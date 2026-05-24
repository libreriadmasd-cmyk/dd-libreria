export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL?.trim() || "https://dd-libreria-backend.onrender.com";
const API = `${API_BASE_URL.replace(/\/+$/, "")}/api`;

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  return search.toString();
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.detail || payload?.message || res.statusText || "Error de red";
    throw new Error(message);
  }
  return res.json();
};

const getAdminToken = () => localStorage.getItem("dd_admin_token") || "";

const adminHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  "X-Admin-Token": getAdminToken(),
  ...extra,
});

export const fetchProducts = async ({
  categoria,
  q,
  sort,
  skip,
  limit,
  marca,
  color,
  min_price,
  max_price,
  on_sale,
  subcategoria,
  brand,
  precio_min,
  precio_max,
} = {}) => {
  const params = {};
  if (categoria && categoria !== "Todos") params.categoria = categoria;
  if (q) params.q = q;
  if (sort) params.sort = sort;
  if (skip !== undefined) params.skip = skip;
  if (limit !== undefined) params.limit = limit;
  if (marca) params.marca = marca;
  if (color) params.color = color;
  if (subcategoria) params.subcategoria = subcategoria;
  if (brand) params.brand = brand;
  if (precio_min || min_price) params.precio_min = precio_min || min_price;
  if (precio_max || max_price) params.precio_max = precio_max || max_price;
  if (on_sale) params.oferta = true;
  const query = buildQuery(params);
  return request(`/products${query ? `?${query}` : ""}`);
};

export const fetchProduct = async (sku) => request(`/products/${encodeURIComponent(sku)}`);
export const fetchCategories = async () => request("/categories");
export const fetchFacets = async ({ categoria } = {}) => {
  if (!categoria || categoria === "Todos") {
    return { subcategorias: [], colors: [], brands: [], price: { min: 0, max: 0 } };
  }
  return request(`/filters/${encodeURIComponent(categoria)}`);
};
export const fetchFeatured = async (per_category = 3) => request(`/featured?per_category=${per_category}`);
export const searchSuggest = async (q, limit = 6) => request(`/search/suggest?q=${encodeURIComponent(q)}&limit=${limit}`);
export const fetchStoreConfig = async () => request("/store-config");
export const adminUpdateStoreConfig = async (body) => request("/admin/store-config", {
  method: "POST",
  headers: adminHeaders(),
  body: JSON.stringify(body),
});
export const fetchKits = async () => request("/kits");
export const adminCreateKit = async (kit) => request("/admin/kits", {
  method: "POST",
  headers: adminHeaders(),
  body: JSON.stringify(kit),
});
export const adminUpdateKit = async (id, kit) => request(`/admin/kits/${encodeURIComponent(id)}`, {
  method: "PUT",
  headers: adminHeaders(),
  body: JSON.stringify(kit),
});
export const adminDeleteKit = async (id) => request(`/admin/kits/${encodeURIComponent(id)}`, {
  method: "DELETE",
  headers: adminHeaders(),
});

export const adminLogin = async (password) => request("/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password }),
});
export const adminVerify = async () => request("/admin/verify", {
  method: "POST",
  headers: adminHeaders(),
});
export const adminStats = async () => request("/admin/stats", { headers: adminHeaders() });
export const adminUploadCSV = async (file, mode = "upsert") => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/admin/csv-upload?mode=${encodeURIComponent(mode)}`, {
    method: "POST",
    headers: { "X-Admin-Token": getAdminToken() },
    body: fd,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.detail || payload?.message || "Error al subir CSV");
  }
  return res.json();
};
export const adminUpdateProduct = async (sku, patch) => request(`/admin/products/${encodeURIComponent(sku)}`, {
  method: "PUT",
  headers: adminHeaders(),
  body: JSON.stringify(patch),
});
export const adminCreateProduct = async (product) => request("/admin/products", {
  method: "POST",
  headers: adminHeaders(),
  body: JSON.stringify(product),
});
export const adminAddImage = async (sku, url) => request(`/admin/products/${encodeURIComponent(sku)}/images`, {
  method: "POST",
  headers: adminHeaders(),
  body: JSON.stringify({ url }),
});
export const adminRemoveImage = async (sku, index) => request(`/admin/products/${encodeURIComponent(sku)}/images/${encodeURIComponent(index)}`, {
  method: "DELETE",
  headers: adminHeaders(),
});
export const adminImageTemplate = async (body) => request("/admin/image-template", {
  method: "POST",
  headers: adminHeaders(),
  body: JSON.stringify(body),
});
export const adminReclassify = async (body) => request("/admin/reclassify", {
  method: "POST",
  headers: adminHeaders(),
  body: JSON.stringify(body),
});
export const adminCleanTitles = async () => request("/admin/clean-titles", {
  method: "POST",
  headers: adminHeaders(),
});
