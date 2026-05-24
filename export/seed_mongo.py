import os
import json
import sys
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# Cargar variables de entorno desde la carpeta backend
backend_env = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

def seed_database():
    # Verificar que pasaron el archivo JSON por argumento
    if len(sys.argv) < 2:
        print("❌ Error: No encuentro products.json. Pasalo como primer argumento.")
        print("Uso: python seed_mongo.py ruta/a/products.json")
        return

    json_path = sys.argv[1]
    
    # 1. Conectar a MongoDB Atlas
    mongo_uri = "mongodb+srv://compusconectadas_db_user:wmxD4Pg4RKBbVDqB@cluster0.beioxg0.mongodb.net/dd_libreria?appName=Cluster0"

    print("🔌 Conectando a MongoDB Atlas...")
    client = MongoClient(mongo_uri)
    
    # Extraer el nombre de la base de datos de la URI o usar por defecto
    db = client.get_default_database()
    collection = db["products"]

    # 2. Leer el archivo JSON de productos
    print(f"📖 Leyendo archivo de productos: {json_path}...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
    except Exception as e:
        print(f"❌ Error al leer el archivo JSON: {e}")
        return

    print(f"📦 Se encontraron {len(products)} productos para procesar.")

    # 3. Preparar la inyección masiva (Bulk Write)
    operations = []
    for item in products:
        # Quitar _id (mongoexport deja {'$oid': '...'} dentro de _id)
        item.pop("_id", None)
        # Usamos el SKU como identificador único para no duplicar si corremos el script dos veces
        sku = item.get("sku")
        if sku:
            operations.append(
                UpdateOne({"sku": sku}, {"$set": item}, upsert=True)
            )

    if not operations:
        print("⚠️ No hay productos válidos para cargar.")
        return

    # 4. Ejecutar la carga en tandas
    print("🚀 Inyectando productos en la nube (esto puede tardar un poquito)...")
    try:
        result = collection.bulk_write(operations)
        print("\n¡Misión cumplida! 🎉")
        print(f"  - Productos insertados nuevos: {result.upserted_count}")
        print(f"  - Productos actualizados: {result.modified_count}")
        print(f"  - Total en base de datos: {collection.count_documents({})}")
    except Exception as e:
        print(f"❌ Error al inyectar en la base de datos: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    seed_database()