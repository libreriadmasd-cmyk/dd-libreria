import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/context/CartContext";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Admin from "@/pages/Admin";
import { WhatsAppFloating } from "@/components/store/WhatsAppFloating";
import { TopBar } from "@/components/store/TopBar";
import { Watermark } from "@/components/store/Watermark";

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

function WatermarkWrapper() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <Watermark />;
}

function App() {
  return (
    <div className="App">
      <CartProvider>
        <BrowserRouter>
          <WatermarkWrapper />
          <TopBarWrapper />
          <Routes>
            <Route path="/" element={<Home />} />
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
