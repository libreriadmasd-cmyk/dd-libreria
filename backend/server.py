from fastapi import FastAPI, APIRouter, HTTPException, Header, UploadFile, File, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import csv
import io
import logging
import unicodedata
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')

# Uploads dir for admin file uploads (served at /api/uploads/{filename})
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="D+D API")
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
api_router = APIRouter(prefix="/api")

# =========================================================
# Product model
# =========================================================

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    sku: str
    nombre: str
    categoria: str = "General"
    subcategoria: Optional[str] = None
    precio: float = 0
    precio_oferta: Optional[float] = None
    stock: int = 0
    imagen: str = ""
    imagenes: List[str] = Field(default_factory=list)
    colores: List[str] = Field(default_factory=list)
    destacado_inicio: bool = False
    updated_at: Optional[str] = None

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    precio: Optional[float] = None
    precio_oferta: Optional[float] = None
    stock: Optional[int] = None
    imagen: Optional[str] = None
    imagenes: Optional[List[str]] = None
    destacado_inicio: Optional[bool] = None
    colores: Optional[List[str]] = None

class ImageOp(BaseModel):
    url: str
    index: Optional[int] = None  # If provided, replace at index; else append

class LoginBody(BaseModel):
    password: str

PUBLIC_PROJECTION = {"_id": 0}

# =========================================================
# Helpers
# =========================================================

_NAN_VALUES = {"nan", "none", "null", "", "-", "—"}
_SMALL_WORDS = {"de","del","la","el","las","los","en","y","a","con","para","por","un","una"}

# Patterns to strip trailing internal codes from product names
# Ej: "Cuaderno Rivadavia ABC123" → "Cuaderno Rivadavia"
import re as _re
_TRAILING_CODE_RE = _re.compile(
    r"\s+(?:[A-Z]{1,3}\d{3,6}|[A-Z0-9]{6,})\s*$"
)
_MULTI_QUOTE_RE = _re.compile(r'["¨´`]{2,}')
_WEIRD_CHARS_RE = _re.compile(r"[¨´`]")
_MULTI_SPACE_RE = _re.compile(r"\s+")

def _clean_name(s: str) -> str:
    """Apply all title-cleanup heuristics."""
    s = (s or "").strip()
    if not s:
        return s
    # Collapse repeated quotes and remove weird accents leftovers
    s = _MULTI_QUOTE_RE.sub('"', s)
    s = _WEIRD_CHARS_RE.sub("", s)
    # Strip trailing internal product codes (2+ consecutive runs)
    prev = None
    while prev != s:
        prev = s
        s = _TRAILING_CODE_RE.sub("", s).rstrip(' .,-"')
    s = _MULTI_SPACE_RE.sub(" ", s).strip()
    return _title_case(s)

def _title_case(s: str) -> str:
    words = (s or "").strip().split()
    out = []
    for i, w in enumerate(words):
        low = w.lower()
        if i > 0 and low in _SMALL_WORDS:
            out.append(low)
        elif len(w) <= 3 and w.isupper() and not any(c.islower() for c in w):
            out.append(w)
        else:
            out.append(low.capitalize())
    return " ".join(out)

def _clean_category(raw: str) -> str:
    v = (raw or "").strip()
    if v.lower() in _NAN_VALUES:
        return "General"
    return v

def _parse_csv_rows(raw_text: str):
    """Parse CSV (our expected schema) and yield normalized product dicts."""
    # tolerate BOM
    raw_text = raw_text.lstrip("\ufeff")
    reader = csv.DictReader(io.StringIO(raw_text))
    now = datetime.now(timezone.utc).isoformat()
    for row in reader:
        if not row:
            continue
        sku = (row.get("SKU") or row.get("sku") or "").strip()
        if not sku:
            continue
        nombre = _clean_name(row.get("Nombre") or row.get("nombre") or "")
        if not nombre:
            continue
        try:
            precio = float(row.get("Precio") or row.get("precio") or 0)
        except (ValueError, TypeError):
            precio = 0.0
        try:
            stock = int(float(row.get("Stock") or row.get("stock") or 0))
        except (ValueError, TypeError):
            stock = 0
        imagen = (row.get("Imagen URL") or row.get("imagen") or "").strip()
        cat = _clean_category(row.get("Categoria") or row.get("categoria") or "")
        yield {
            "sku": sku,
            "nombre": nombre,
            "categoria": cat,
            "precio": round(precio, 2),
            "stock": max(0, stock),
            "imagen": imagen,
            "imagenes": [imagen] if imagen else [],
            "updated_at": now,
        }

def _require_admin(token: Optional[str]):
    if not ADMIN_PASSWORD:
        raise HTTPException(500, "Admin no configurado")
    if token != ADMIN_PASSWORD:
        raise HTTPException(401, "Credenciales inválidas")

# =========================================================
# Public catalog endpoints
# =========================================================

@api_router.get("/")
async def root():
    return {"service": "D+D API", "ok": True}

@api_router.get("/products")
async def list_products(
    categoria: Optional[str] = Query(None),
    subcategoria: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    precio_min: Optional[float] = Query(None),
    precio_max: Optional[float] = Query(None),
    q: Optional[str] = Query(None),
    sort: str = Query("relevance"),
    skip: int = Query(0, ge=0),
    limit: int = Query(48, ge=1, le=200),
):
    query_parts = []
    if categoria and categoria != "Todos":
        query_parts.append({"categoria": categoria})
    if subcategoria:
        query_parts.append({"subcategoria": subcategoria})
    if color:
        query_parts.append({"colores": color})
    if brand:
        query_parts.append({"$or": [{"brand": brand}, {"marca": brand}]})
    if precio_min is not None or precio_max is not None:
        rng = {}
        if precio_min is not None:
            rng["$gte"] = precio_min
        if precio_max is not None:
            rng["$lte"] = precio_max
        query_parts.append({"precio": rng})
    if q:
        rx = {"$regex": q, "$options": "i"}
        query_parts.append({"$or": [{"nombre": rx}, {"sku": rx}]})

    query = query_parts[0] if len(query_parts) == 1 else {"$and": query_parts} if query_parts else {}

    sort_spec = {
        "relevance": [("stock", -1), ("nombre", 1)],
        "price_asc": [("precio", 1)],
        "price_desc": [("precio", -1)],
        "name_asc": [("nombre", 1)],
        "newest": [("updated_at", -1)],
    }.get(sort, [("nombre", 1)])

    total = await db.products.count_documents(query)
    cursor = db.products.find(query, PUBLIC_PROJECTION).sort(sort_spec).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@api_router.get("/products/{sku}")
async def get_product(sku: str):
    doc = await db.products.find_one({"sku": sku}, PUBLIC_PROJECTION)
    if not doc:
        raise HTTPException(404, "Producto no encontrado")
    return doc

@api_router.get("/featured")
async def featured_by_category(per_category: int = Query(3, ge=1, le=12)):
    """Returns up to N products marked destacado_inicio=True per category.
    If a category has fewer destacados, fills with top-stock products."""
    categories = ["Marroquinería", "Librería", "Juguetería", "Regalería", "Tecno"]
    out = {}
    for cat in categories:
        # Destacados manuales
        cursor = db.products.find(
            {"categoria": cat, "destacado_inicio": True},
            PUBLIC_PROJECTION,
        ).sort([("updated_at", -1)]).limit(per_category)
        items = await cursor.to_list(per_category)
        # Fill with most-stock items if needed
        if len(items) < per_category:
            skus_taken = [i["sku"] for i in items]
            extra_cursor = db.products.find(
                {
                    "categoria": cat,
                    "sku": {"$nin": skus_taken},
                    "stock": {"$gt": 0},
                },
                PUBLIC_PROJECTION,
            ).sort([("updated_at", -1), ("nombre", 1)]).limit(per_category - len(items))
            items.extend(await extra_cursor.to_list(per_category - len(items)))
        out[cat] = items
    return {"categories": categories, "items": out, "per_category": per_category}

@api_router.get("/offers")
async def list_offers(limit: int = Query(12, ge=1, le=48)):
    """Products that have a precio_oferta set (and not equal to 0)."""
    query = {"precio_oferta": {"$gt": 0}}
    cursor = db.products.find(query, PUBLIC_PROJECTION).sort(
        [("updated_at", -1)]
    ).limit(limit)
    items = await cursor.to_list(limit)
    total = await db.products.count_documents(query)
    return {"items": items, "total": total}

@api_router.get("/search/suggest")
async def search_suggest(q: str = Query(..., min_length=1), limit: int = Query(6, ge=1, le=12)):
    """Predictive search: returns up to `limit` compact hits by name or SKU."""
    qs = q.strip()
    if not qs:
        return {"items": []}
    rx = {"$regex": _re.escape(qs), "$options": "i"}
    query = {"$or": [{"nombre": rx}, {"sku": rx}]}
    cursor = db.products.find(
        query,
        {"_id": 0, "sku": 1, "nombre": 1, "precio": 1, "categoria": 1, "imagen": 1, "imagenes": 1},
    ).sort([("stock", -1), ("nombre", 1)]).limit(limit)
    items = await cursor.to_list(limit)
    return {"items": items, "query": qs}

@api_router.get("/categories")
async def categories():
    pipeline = [
        {"$group": {"_id": "$categoria", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    rows = await db.products.aggregate(pipeline).to_list(200)
    total = await db.products.count_documents({})
    return {
        "total": total,
        "categories": [{"name": r["_id"] or "General", "count": r["count"]} for r in rows],
    }

# =========================================================
# Admin endpoints
# =========================================================

@api_router.post("/admin/login")
async def admin_login(body: LoginBody):
    if not ADMIN_PASSWORD:
        raise HTTPException(500, "Admin no configurado")
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Contraseña incorrecta")
    return {"token": ADMIN_PASSWORD}

@api_router.post("/admin/verify")
async def admin_verify(x_admin_token: Optional[str] = Header(None)):
    _require_admin(x_admin_token)
    return {"ok": True}

@api_router.post("/admin/csv-upload")
async def upload_csv(
    file: UploadFile = File(...),
    mode: str = Query("upsert"),  # upsert | replace
    x_admin_token: Optional[str] = Header(None),
):
    _require_admin(x_admin_token)
    raw = (await file.read()).decode("utf-8", errors="ignore")
    rows = list(_parse_csv_rows(raw))
    if not rows:
        raise HTTPException(400, "El CSV no contiene filas válidas")

    if mode == "replace":
        await db.products.delete_many({})

    ops_inserted = 0
    ops_updated = 0
    for p in rows:
        res = await db.products.update_one(
            {"sku": p["sku"]},
            {"$set": p},
            upsert=True,
        )
        if res.upserted_id:
            ops_inserted += 1
        elif res.modified_count:
            ops_updated += 1

    total = await db.products.count_documents({})
    return {
        "received": len(rows),
        "inserted": ops_inserted,
        "updated": ops_updated,
        "total_in_db": total,
        "mode": mode,
    }

@api_router.put("/admin/products/{sku}")
async def update_product(
    sku: str, body: ProductUpdate, x_admin_token: Optional[str] = Header(None)
):
    _require_admin(x_admin_token)
    patch = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if not patch:
        raise HTTPException(400, "Sin cambios")
    # Keep imagen/imagenes in sync
    if "imagenes" in patch:
        patch["imagen"] = patch["imagenes"][0] if patch["imagenes"] else ""
    elif "imagen" in patch:
        # When single imagen is updated, mirror to imagenes[0]
        cur = await db.products.find_one({"sku": sku}, {"imagenes": 1})
        cur_arr = (cur or {}).get("imagenes") or []
        if cur_arr:
            cur_arr[0] = patch["imagen"]
        else:
            cur_arr = [patch["imagen"]] if patch["imagen"] else []
        patch["imagenes"] = cur_arr
    if "nombre" in patch:
        patch["nombre"] = _clean_name(patch["nombre"])
    patch["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.products.update_one({"sku": sku}, {"$set": patch})
    if res.matched_count == 0:
        raise HTTPException(404, "Producto no encontrado")
    doc = await db.products.find_one({"sku": sku}, PUBLIC_PROJECTION)
    return doc

# ---- Gallery management ----

@api_router.post("/admin/products/{sku}/images")
async def add_image(
    sku: str, body: ImageOp, x_admin_token: Optional[str] = Header(None)
):
    """Append or replace-at-index an image URL in the product gallery."""
    _require_admin(x_admin_token)
    url = (body.url or "").strip()
    if not url:
        raise HTTPException(400, "URL requerida")
    doc = await db.products.find_one({"sku": sku}, {"imagenes": 1})
    if not doc:
        raise HTTPException(404, "Producto no encontrado")
    arr = list(doc.get("imagenes") or [])
    if body.index is not None and 0 <= body.index < len(arr):
        arr[body.index] = url
    else:
        arr.append(url)
    await db.products.update_one(
        {"sku": sku},
        {"$set": {
            "imagenes": arr,
            "imagen": arr[0] if arr else "",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    updated = await db.products.find_one({"sku": sku}, PUBLIC_PROJECTION)
    return updated

@api_router.delete("/admin/products/{sku}/images/{index}")
async def remove_image(
    sku: str, index: int, x_admin_token: Optional[str] = Header(None)
):
    _require_admin(x_admin_token)
    doc = await db.products.find_one({"sku": sku}, {"imagenes": 1})
    if not doc:
        raise HTTPException(404, "Producto no encontrado")
    arr = list(doc.get("imagenes") or [])
    if not (0 <= index < len(arr)):
        raise HTTPException(400, "Índice fuera de rango")
    arr.pop(index)
    await db.products.update_one(
        {"sku": sku},
        {"$set": {
            "imagenes": arr,
            "imagen": arr[0] if arr else "",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    updated = await db.products.find_one({"sku": sku}, PUBLIC_PROJECTION)
    return updated

@api_router.post("/admin/clean-titles")
async def clean_titles(x_admin_token: Optional[str] = Header(None)):
    """Bulk-clean all product names: collapse quotes, Title Case, strip trailing codes."""
    _require_admin(x_admin_token)
    now = datetime.now(timezone.utc).isoformat()
    cursor = db.products.find({}, {"_id": 1, "nombre": 1})
    touched = 0
    sample_before = []
    sample_after = []
    async for doc in cursor:
        old = doc.get("nombre") or ""
        new = _clean_name(old)
        if new and new != old:
            await db.products.update_one(
                {"_id": doc["_id"]},
                {"$set": {"nombre": new, "updated_at": now}},
            )
            if touched < 5:
                sample_before.append(old)
                sample_after.append(new)
            touched += 1
    return {
        "updated": touched,
        "sample_before": sample_before,
        "sample_after": sample_after,
    }

@api_router.post("/admin/products")
async def create_product(
    body: Product, x_admin_token: Optional[str] = Header(None)
):
    _require_admin(x_admin_token)
    exists = await db.products.find_one({"sku": body.sku}, {"_id": 1})
    if exists:
        raise HTTPException(409, "Ya existe un producto con ese SKU")
    doc = body.model_dump()
    doc["categoria"] = _clean_category(doc.get("categoria", ""))
    doc["nombre"] = _title_case(doc.get("nombre", ""))
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/admin/products/{sku}")
async def delete_product(sku: str, x_admin_token: Optional[str] = Header(None)):
    _require_admin(x_admin_token)
    res = await db.products.delete_one({"sku": sku})
    if res.deleted_count == 0:
        raise HTTPException(404, "Producto no encontrado")
    return {"ok": True}

# ---- Image URL bulk rewrite ----

class ImageTemplateBody(BaseModel):
    prefix: str  # e.g. https://res.cloudinary.com/darxvchbt/image/upload/
    suffix: str = ""  # e.g. .webp  (optional)
    sample_size: int = 5
    apply: bool = False  # if False, only previews

@api_router.post("/admin/image-template")
async def image_template(
    body: ImageTemplateBody, x_admin_token: Optional[str] = Header(None)
):
    """Build image URLs as `{prefix}{sku}{suffix}`. If apply=False returns a
    preview for sample_size products; if apply=True overwrites imagen for all."""
    _require_admin(x_admin_token)
    prefix = (body.prefix or "").strip()
    suffix = (body.suffix or "").strip()
    if not prefix:
        raise HTTPException(400, "prefix es obligatorio")

    if not body.apply:
        # Preview only
        sample = await db.products.find(
            {}, {"_id": 0, "sku": 1, "nombre": 1}
        ).limit(max(1, min(body.sample_size, 20))).to_list(20)
        return {
            "preview": [
                {
                    "sku": s["sku"],
                    "nombre": s["nombre"],
                    "url": f"{prefix}{s['sku']}{suffix}",
                }
                for s in sample
            ],
        }

    # Apply: update every product
    now = datetime.now(timezone.utc).isoformat()
    cursor = db.products.find({}, {"_id": 1, "sku": 1})
    total = 0
    async for doc in cursor:
        new_url = f"{prefix}{doc['sku']}{suffix}"
        await db.products.update_one(
            {"_id": doc["_id"]},
            {"$set": {"imagen": new_url, "updated_at": now}},
        )
        total += 1
    return {"updated": total, "example": f"{prefix}<SKU>{suffix}"}

# ---- Bulk re-classify by keyword heuristic ----

_KEYWORDS = {
    "Marroquinería": ["mochila","cartera","bolso","bolsito","billetera","morral","rinonera","portanotebook","cartuchera"," tula","neceser","maletin","bandolera","valija","estuche"],
    "Juguetería": ["roller","drone","lego","barbie","baby","muneco","peluche","pelota","juguete","puzzle","rompecabezas","bloque","robot","sonic","paw patrol","disney","marvel","pokemon","hot wheels","play-doh","playdoh","slime","dinosaurio","cars","frozen","spider","batman","superman","hulk","avengers","minecraft","roblox","jenga","potty","nenuco","cry babies","magic tears","monopatin","triciclo","patineta","skateboard","kinetic sand","stickers"],
    "Regalería": ["vela","velon","portaretrato","portarretrato","marco para foto","taza","mate","termo","adorno","estatuilla","llavero","souvenir","figurin","cofre","cajita","joyero","espejo","bandeja","regalo","candelabro","incienso","decorativo","globo ","globos"],
}
_DEFAULT_CAT = "Librería"

def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s or "")
        if not unicodedata.combining(c)
    ).lower()

def _classify_name(name: str) -> str:
    n = _strip_accents(name)
    for cat, kws in _KEYWORDS.items():
        for k in kws:
            if k in n:
                return cat
    return _DEFAULT_CAT

class ReclassifyBody(BaseModel):
    scope: str = "general_only"  # general_only | all
    apply: bool = False

@api_router.post("/admin/reclassify")
async def reclassify(
    body: ReclassifyBody, x_admin_token: Optional[str] = Header(None)
):
    _require_admin(x_admin_token)
    query = {} if body.scope == "all" else {"categoria": {"$in": ["General", "º", "-", ""]}}
    cursor = db.products.find(query, {"_id": 1, "nombre": 1, "categoria": 1})
    counts = {"Marroquinería": 0, "Librería": 0, "Juguetería": 0, "Regalería": 0}
    touched = 0
    async for doc in cursor:
        new_cat = _classify_name(doc.get("nombre", ""))
        counts[new_cat] = counts.get(new_cat, 0) + 1
        touched += 1
        if body.apply:
            await db.products.update_one(
                {"_id": doc["_id"]}, {"$set": {"categoria": new_cat}}
            )
    return {"scope": body.scope, "applied": body.apply, "scanned": touched, "counts": counts}

@api_router.get("/admin/stats")
async def admin_stats(x_admin_token: Optional[str] = Header(None)):
    _require_admin(x_admin_token)
    total = await db.products.count_documents({})
    in_stock = await db.products.count_documents({"stock": {"$gt": 0}})
    missing_image = await db.products.count_documents({"imagen": ""})
    return {"total": total, "in_stock": in_stock, "missing_image": missing_image}

# =========================================================
# Subcategorización por keywords + filtros + uploads
# =========================================================

SUBCATEGORY_TREE = {
    "Librería": [
        ("Estudio", ["escolar","cuaderno","repuesto","lapiz","goma","carpeta","regla","cartulina","caratula","sobre"]),
        ("Oficina", ["abrochadora","folio","bibliorato","boligrafo","resma","calculadora","perforadora","engrampadora","constancia","mapa"]),
        ("Creatividad", ["tempera","pincel","bastidor","acrilico","dibujo","tecnica","oleo","fibra","marcador","crayon"]),
        ("Organización", ["agenda","anotador","post-it","postit","clasificador","canopla","etiquetas"]),
        ("Kits", ["set","pack","kit escolar","combo"]),
    ],
    "Juguetería": [
        ("Juegos de Mesa", ["mesa","cartas","mazo","ludo","ajedrez","puzzle","rompecabezas","jenga"]),
        ("Muñecos y Figuras", ["muneca","muñeca","figura","barbie","marvel","accion","spider","batman","superman","hulk"]),
        ("Didácticos", ["bloques","encastre","masa","rasti","lego","madera","aprendizaje","kinetic"]),
        ("Aire Libre y Rodados", ["pelota","inflable","pileta","triciclo","monopatin","andarin","skateboard","patineta"]),
        ("Primera Infancia", ["sonajero","movil","mordillo","fisher-price","bebe","baby"]),
    ],
    "Marroquinería": [
        ("Mochilas", ["mochila","espalda","carro","jardin"]),
        ("Carteras y Bolsos", ["cartera","bolso","bandolera","shopping"]),
        ("Riñoneras y Neceser", ["rinonera","riñonera","neceser","cartuchera","porta cosmetico"]),
        ("Valijas y Viaje", ["valija","carry-on","almohadilla de viaje","identificador"]),
        ("Accesorios", ["billetera","monedero","llavero","cinturon"]),
    ],
    "Tecno": [
        ("Audio", ["auricular","parlante","bluetooth","headphone"]),
        ("Computación", ["mouse","teclado","pad","webcam"]),
        ("Gaming", ["gamer","joystick","consola"]),
        ("Energía", ["pila","cargador","cable usb","fuente","powerbank"]),
        ("Accesorios Celular", ["funda","vidrio templado","soporte celular"]),
    ],
    "Regalería": [
        ("Hogar y Bazar", ["taza","vaso","plato","cubiertos","botella","hermetico"]),
        ("Decoración", ["cuadro","vela","difusor","reloj","portarretrato"]),
        ("Mates y Termos", ["mate","termo","bombilla","yerbera","set matero"]),
        ("Regalos", ["peluche","caja de regalo","tarjeta","souvenir"]),
    ],
}

COLOR_KEYWORDS = {
    "Blanco": ["blanco","blanca"],
    "Negro": ["negro","negra"],
    "Rojo": ["rojo","roja"],
    "Azul": ["azul"],
    "Verde": ["verde"],
    "Amarillo": ["amarillo","amarilla"],
    "Rosa": ["rosa","rosado","rosada"],
    "Violeta": ["violeta","lila","morado","morada"],
    "Gris": ["gris","grafito"],
    "Marrón": ["marron","marrón","marrones"],
    "Beige": ["beige","crema"],
    "Celeste": ["celeste"],
    "Naranja": ["naranja"],
    "Dorado": ["dorado","dorada","oro"],
    "Plateado": ["plateado","plateada","plata"],
}

def _classify_subcategory(name: str, categoria: str):
    rules = SUBCATEGORY_TREE.get(categoria)
    if not rules:
        return None
    n = _strip_accents(name)
    for sub, kws in rules:
        for k in kws:
            if k in n:
                return sub
    return None

def _extract_colors(name: str):
    n = _strip_accents(name)
    out = []
    for label, kws in COLOR_KEYWORDS.items():
        for k in kws:
            if k in n:
                out.append(label)
                break
    return out

class SubclassifyBody(BaseModel):
    apply: bool = False

@api_router.post("/admin/subclassify")
async def subclassify_all(
    body: SubclassifyBody, x_admin_token: Optional[str] = Header(None)
):
    _require_admin(x_admin_token)
    cursor = db.products.find(
        {"categoria": {"$in": list(SUBCATEGORY_TREE.keys())}},
        {"_id": 1, "sku": 1, "nombre": 1, "categoria": 1},
    )
    counts = {}
    colors_total = 0
    scanned = 0
    async for doc in cursor:
        scanned += 1
        sub = _classify_subcategory(doc.get("nombre", ""), doc.get("categoria", ""))
        cols = _extract_colors(doc.get("nombre", ""))
        if cols:
            colors_total += 1
        key = f"{doc['categoria']} · {sub or 'Sin subcategoría'}"
        counts[key] = counts.get(key, 0) + 1
        if body.apply:
            await db.products.update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "subcategoria": sub,
                    "colores": cols,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
    return {
        "scanned": scanned,
        "applied": body.apply,
        "counts_by_subcat": counts,
        "products_with_color": colors_total,
    }

@api_router.get("/filters/{categoria}")
async def category_filters(categoria: str):
    """Available filters for a category: subcategorias, colors, price range."""
    base = {"categoria": categoria}
    # Subcategorías
    sub_pipeline = [
        {"$match": base},
        {"$group": {"_id": "$subcategoria", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    sub_rows = await db.products.aggregate(sub_pipeline).to_list(50)
    subcategorias = [
        {"name": r["_id"] or "Sin subcategoría", "count": r["count"]}
        for r in sub_rows
        if r["_id"]
    ]

    # Colors (flatten)
    color_pipeline = [
        {"$match": base},
        {"$unwind": "$colores"},
        {"$group": {"_id": "$colores", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    color_rows = await db.products.aggregate(color_pipeline).to_list(50)
    colores = [{"name": r["_id"], "count": r["count"]} for r in color_rows if r["_id"]]

    # Price range
    price_pipeline = [
        {"$match": {**base, "precio": {"$gt": 0}}},
        {"$group": {"_id": None, "min": {"$min": "$precio"}, "max": {"$max": "$precio"}}},
    ]
    price_rows = await db.products.aggregate(price_pipeline).to_list(1)
    price = price_rows[0] if price_rows else {"min": 0, "max": 0}

    return {
        "categoria": categoria,
        "subcategorias": subcategorias,
        "colores": colores,
        "price_min": round(price.get("min") or 0, 2),
        "price_max": round(price.get("max") or 0, 2),
    }

@api_router.post("/admin/upload-file")
async def upload_file(
    file: UploadFile = File(...), x_admin_token: Optional[str] = Header(None)
):
    """Save an uploaded image to backend/uploads and return its public URL.
    Used by Admin's GalleryModal so the shop owner does not have to deal with Cloudinary URLs."""
    _require_admin(x_admin_token)
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Formato no soportado. Usá JPG, PNG, WEBP o GIF.")
    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, "El archivo supera los 8MB")
    import uuid as _uuid
    ext = (file.filename or "").split(".")[-1].lower() or "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"
    fname = f"{_uuid.uuid4().hex}.{ext}"
    path = UPLOADS_DIR / fname
    path.write_bytes(raw)
    public_url = f"/api/uploads/{fname}"
    return {"url": public_url, "size": len(raw), "filename": fname}


class BulkPriceRequest(BaseModel):
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    porcentaje: float = 0.0


@api_router.post("/admin/update-prices-bulk")
async def update_prices_bulk(
    body: BulkPriceRequest, x_admin_token: Optional[str] = Header(None)
):
    """Update product prices in bulk by category or subcategory.
    `porcentaje` is percent (10 means +10%, -5 means -5%)."""
    _require_admin(x_admin_token)
    pct = body.porcentaje
    try:
        factor = 1.0 + (float(pct) / 100.0)
    except Exception:
        raise HTTPException(400, "Porcentaje inválido")
    if factor <= 0:
        raise HTTPException(400, "El factor resultante debe ser mayor que 0")

    # Build filter
    filt = {}
    if body.categoria and body.categoria != "Todos":
        filt["categoria"] = body.categoria
    if body.subcategoria:
        filt["subcategoria"] = body.subcategoria

    now = datetime.utcnow()
    # Update main price
    res = await db.products.update_many(
        filt if filt else {}, {"$mul": {"precio": factor}, "$set": {"updated_at": now}}
    )
    # Update oferta prices if present
    res2 = await db.products.update_many(
        {**(filt or {}), "precio_oferta": {"$exists": True}},
        {"$mul": {"precio_oferta": factor}, "$set": {"updated_at": now}},
    )

    return {"matched": res.matched_count, "modified": res.modified_count + getattr(res2, "modified_count", 0)}

# =========================================================
# Startup: seed from initial_catalog.csv if empty
# =========================================================

@app.on_event("startup")
async def startup():
    # Ensure index
    await db.products.create_index("sku", unique=True)
    await db.products.create_index("categoria")
    await db.products.create_index([("nombre", "text")])
    # Initial seed if DB is empty
    count = await db.products.count_documents({})
    seed_path = ROOT_DIR / "initial_catalog.csv"
    if count == 0 and seed_path.exists():
        try:
            raw = seed_path.read_text(encoding="utf-8")
            rows = list(_parse_csv_rows(raw))
            if rows:
                # bulk insert, tolerate duplicates by upsert
                for p in rows:
                    try:
                        await db.products.update_one(
                            {"sku": p["sku"]}, {"$set": p}, upsert=True
                        )
                    except Exception:
                        pass
                logging.info(f"[D+D] Seeded {len(rows)} products from initial_catalog.csv")
        except Exception as e:
            logging.warning(f"[D+D] Seed failed: {e}")
    # Migrate existing docs to gallery schema: ensure imagenes is an array
    missing = await db.products.count_documents({"imagenes": {"$exists": False}})
    if missing > 0:
        cursor = db.products.find(
            {"imagenes": {"$exists": False}}, {"_id": 1, "imagen": 1}
        )
        n = 0
        async for doc in cursor:
            img = doc.get("imagen") or ""
            await db.products.update_one(
                {"_id": doc["_id"]},
                {"$set": {"imagenes": [img] if img else []}},
            )
            n += 1
        logging.info(f"[D+D] Gallery migration: set 'imagenes' array for {n} products")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# =========================================================
# Legacy status endpoints (kept for compatibility)
# =========================================================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: __import__("uuid").uuid4().hex)
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    rows = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for r in rows:
        if isinstance(r.get("timestamp"), str):
            r["timestamp"] = datetime.fromisoformat(r["timestamp"])
    return rows

# Mount router + CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
