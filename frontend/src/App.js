import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/CartContext";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Admin from "@/pages/Admin";
import { WhatsAppFloating } from "@/components/store/WhatsAppFloating";
import { TopBar } from "@/components/store/TopBar";

function FloatingWrapper() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <WhatsAppFloating />;
}

function TopBarWrapper() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <TopBar />;
}

function App() {
  useEffect(() => {
    const url = `${process.env.PUBLIC_URL || ""}/nexo-logo.png`;
    document.body.style.setProperty("--watermark-image", `url("${url}")`);
    document.title = "Nexo Store · Conectamos lo que necesitás";
  }, []);
  return (
    <div className="App">
      <CartProvider>
        <BrowserRouter>
          <TopBarWrapper />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categoria/:cat" element={<Home />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <FloatingWrapper />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </CartProvider>
    </div>
  );
}

export default App;
