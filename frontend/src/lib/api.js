const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API_BASE_URL = "https://dd-libreria-backend.onrender.com";;

const TOKEN_KEY = "dd_admin_token";

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setAdminToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(TOKEN_KEY);

const headers = (admin = false) => {
  const h = { "Content-Type": "application/json" };
  if (admin) {
    const t = getAdminToken();
    if (t) h["X-Admin-Token"] = t;
  }
  return h;
};

// ---------------- Public ----------------
export const fetchProducts = async ({
  categoria,
  subcategoria,
  color,
  brand,
  precio_min,
  precio_max,
  q,
  sort,
  skip = 0,
  limit = 48,
} = {}) => {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (subcategoria) params.set("subcategoria", subcategoria);
  if (color) params.set("color", color);
  if (brand) params.set("brand", brand);
  if (precio_min !== null && precio_min !== undefined) params.set("precio_min", String(precio_min));
  if (precio_max !== null && precio_max !== undefined) params.set("precio_max", String(precio_max));
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  params.set("skip", String(skip));
  params.set("limit", String(limit));
  const r = await fetch(`${API}/products?${params.toString()}`);
  if (!r.ok) throw new Error("No se pudo cargar el catálogo");
  return r.json();
};

export const fetchProduct = async (sku) => {
  const r = await fetch(`${API}/products/${encodeURIComponent(sku)}`);
  if (!r.ok) throw new Error("Producto no encontrado");
  return r.json();
};

export const fetchCategories = async () => {
  const r = await fetch(`${API}/categories`);
  if (!r.ok) throw new Error("No se pudo cargar las categorías");
  return r.json();
};

// ---------------- Admin ----------------
export const adminLogin = async (password) => {
  const r = await fetch(`${API}/admin/login`, {
    method: "POST",
    headers: headers(false),
    body: JSON.stringify({ password }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Contraseña incorrecta");
  }
  const data = await r.json();
  setAdminToken(data.token);
  return data.token;
};

export const adminVerify = async () => {
  const r = await fetch(`${API}/admin/verify`, {
    method: "POST",
    headers: headers(true),
  });
  return r.ok;
};

export const adminStats = async () => {
  const r = await fetch(`${API}/admin/stats`, { headers: headers(true) });
  if (!r.ok) throw new Error("Sin acceso");
  return r.json();
};

export const adminUploadCSV = async (file, mode = "upsert") => {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/admin/csv-upload?mode=${mode}`, {
    method: "POST",
    headers: { "X-Admin-Token": getAdminToken() },
    body: fd,
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error al subir CSV");
  }
  return r.json();
};

export const adminUpdateProduct = async (sku, patch) => {
  const r = await fetch(`${API}/admin/products/${encodeURIComponent(sku)}`, {
    method: "PUT",
    headers: headers(true),
    body: JSON.stringify(patch),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminCreateProduct = async (product) => {
  const r = await fetch(`${API}/admin/products`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(product),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminDeleteProduct = async (sku) => {
  const r = await fetch(`${API}/admin/products/${encodeURIComponent(sku)}`, {
    method: "DELETE",
    headers: { "X-Admin-Token": getAdminToken() },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminImageTemplate = async ({ prefix, suffix, apply, sampleSize = 5 }) => {
  const r = await fetch(`${API}/admin/image-template`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ prefix, suffix, apply, sample_size: sampleSize }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminUpdatePricesBulk = async ({ categoria = null, subcategoria = null, porcentaje = 0 }) => {
  const r = await fetch(`${API}/admin/update-prices-bulk`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ categoria, subcategoria, porcentaje }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error al actualizar precios");
  }
  return r.json();
};

export const adminReclassify = async ({ scope, apply }) => {
  const r = await fetch(`${API}/admin/reclassify`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ scope, apply }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminCleanTitles = async () => {
  const r = await fetch(`${API}/admin/clean-titles`, {
    method: "POST",
    headers: headers(true),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminAddImage = async (sku, url, index = null) => {
  const body = { url };
  if (index !== null) body.index = index;
  const r = await fetch(`${API}/admin/products/${encodeURIComponent(sku)}/images`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const adminRemoveImage = async (sku, index) => {
  const r = await fetch(
    `${API}/admin/products/${encodeURIComponent(sku)}/images/${index}`,
    { method: "DELETE", headers: { "X-Admin-Token": getAdminToken() } }
  );
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

export const searchSuggest = async (q, limit = 6) => {
  if (!q || !q.trim()) return { items: [] };
  const params = new URLSearchParams({ q: q.trim(), limit: String(limit) });
  const r = await fetch(`${API}/search/suggest?${params}`);
  if (!r.ok) return { items: [] };
  return r.json();
};

export const fetchFeatured = async (perCategory = 3) => {
  const r = await fetch(`${API}/featured?per_category=${perCategory}`);
  if (!r.ok) throw new Error("No se pudo cargar destacados");
  return r.json();
};

export const fetchOffers = async (limit = 12) => {
  const r = await fetch(`${API}/offers?limit=${limit}`);
  if (!r.ok) throw new Error("No se pudo cargar ofertas");
  return r.json();
};

export const fetchCategoryFilters = async (categoria) => {
  const r = await fetch(`${API}/filters/${encodeURIComponent(categoria)}`);
  if (!r.ok) throw new Error("No se pudo cargar filtros");
  return r.json();
};

export const adminUploadFile = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/admin/upload-file`, {
    method: "POST",
    headers: { "X-Admin-Token": getAdminToken() },
    body: fd,
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error al subir archivo");
  }
  return r.json();
};

export const adminSubclassify = async (apply = false) => {
  const r = await fetch(`${API}/admin/subclassify`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ apply }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.detail || "Error");
  }
  return r.json();
};

// Backend returns relative URL like /api/uploads/abc.jpg. Resolve to absolute.
export const resolveBackendUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/api/")) return `${process.env.REACT_APP_BACKEND_URL}${path}`;
  return path;
};
