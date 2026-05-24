import { createContext, useContext, useState, useCallback, useMemo } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [pulseKey, setPulseKey] = useState(0);

  const addToCart = useCallback((product) => {
    if (!product) return;
    setItems((prev) => {
      const key = String(product.id ?? product.sku);
      const existing = prev.find((i) => String(i.id) === key);
      if (existing) {
        return prev.map((i) =>
          String(i.id) === key ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id ?? product.sku,
          nombre: product.nombre,
          precio: Number(product.precio) || 0,
          imagen: product.imagen,
          cantidad: 1,
        },
      ];
    });
    setPulseKey((k) => k + 1);
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => String(i.id) !== String(id)));
  }, []);

  const updateQty = useCallback((id, delta) => {
    setItems((prev) =>
      prev
        .map((i) =>
          String(i.id) === String(id)
            ? { ...i, cantidad: Math.max(0, i.cantidad + delta) }
            : i
        )
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(
    () => items.reduce((s, i) => s + i.cantidad, 0),
    [items]
  );
  const total = useMemo(
    () => items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        addToCart,
        removeItem,
        updateQty,
        clear,
        pulseKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
