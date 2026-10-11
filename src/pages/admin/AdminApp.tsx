import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { DEMO_MODE } from '../../data/payments';
import { resetDemo, seedDemo, useAdminData } from '../../store/admin';
import { PayProvider } from './PayModal';
import Overview from './Overview';
import Orders from './Orders';
import Inbox from './Inbox';
import Payouts from './Payouts';
import { I } from './ui';
import '../../admin.css';

seedDemo();

export default function AdminApp() {
  const { orders, messages } = useAdminData();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);
  useEffect(() => { document.title = 'Cha Bao · Admin'; return () => { document.title = 'Cha Bao'; }; }, []);

  const newOrders = orders.filter((o) => o.status === 'new').length;
  const openMsgs = messages.filter((m) => m.status === 'open').length;
  const cancels = messages.filter((m) => m.status === 'open' && m.kind === 'cancel').length;

  const nav = [
    { to: '/admin', end: true, icon: 'grid' as const, label: 'Today' },
    { to: '/admin/orders', icon: 'ticket' as const, label: 'Orders', badge: newOrders },
    { to: '/admin/inbox', icon: 'inbox' as const, label: 'Inbox', badge: openMsgs, alert: cancels > 0 },
    { to: '/admin/payouts', icon: 'send' as const, label: 'Payouts' },
  ];

  return (
    <div className="adm">
      <PayProvider>
        <aside className="a-side">
          <Link to="/admin" className="a-brand">
            <span className="a-brand-mark">茶包</span>
            <span><b>Cha Bao</b><em>Back of house</em></span>
          </Link>
          <nav className="a-nav">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `a-nav-link ${isActive ? 'on' : ''}`}>
                <I n={n.icon} /><span>{n.label}</span>
                {!!n.badge && <b className={n.alert ? 'alert' : ''}>{n.badge}</b>}
              </NavLink>
            ))}
          </nav>
          <div className="a-side-foot">
            <div className="a-clock"><b>{now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })}</b><span>Nairobi</span></div>
            {DEMO_MODE && (
              <div className="a-demo">
                <span><i />Demo mode</span>
                <p>No real money moves. Data lives in this browser.</p>
                <button onClick={() => { if (confirm('Reset demo orders, messages and payouts?')) resetDemo(); }}><I n="refresh" size={13} /> Reset demo data</button>
              </div>
            )}
            <Link to="/" className="a-back"><I n="back" size={14} /> View site</Link>
          </div>
        </aside>
        <main className="a-main">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="payouts" element={<Payouts />} />
          </Routes>
        </main>
      </PayProvider>
    </div>
  );
}
