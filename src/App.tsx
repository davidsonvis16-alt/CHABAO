import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartDrawer, Footer, Header, Toast } from './components/Chrome';
import Home from './pages/Home';
import Menu from './pages/Menu';
import DishPage from './pages/Dish';
import TeaShop from './pages/Tea';
import Checkout from './pages/Checkout';
import OrderPage from './pages/Order';
import Reserve from './pages/Reserve';
import Visit from './pages/Visit';

const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function NotFound() {
  return (
    <section className="section center" style={{ paddingTop: '12rem' }}>
      <p className="eyebrow">404</p>
      <h1>This table doesn’t exist.</h1>
    </section>
  );
}

export default function App() {
  const loc = useLocation();
  useEffect(() => { if (!loc.hash) window.scrollTo(0, 0); }, [loc.pathname, loc.hash]);
  const bare = loc.pathname === '/checkout';

  if (loc.pathname.startsWith('/admin')) {
    return <Suspense fallback={null}><Routes><Route path="/admin/*" element={<AdminApp />} /></Routes></Suspense>;
  }

  return (
    <>
      <div className="grain" aria-hidden />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <Routes location={loc}>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/dish/:id" element={<DishPage />} />
            <Route path="/tea" element={<TeaShop />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderPage />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/visit" element={<Visit />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      {!bare && <Footer />}
      <CartDrawer />
      <Toast />
    </>
  );
}
