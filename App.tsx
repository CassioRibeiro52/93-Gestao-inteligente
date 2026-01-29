
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Customer, Sale, User, Expense, Product, PaymentStatus } from './types';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import SalesManager from './components/SalesManager';
import Agenda from './components/Agenda';
import Settings from './components/Settings';
import Landing from './components/Landing';
import Tutorial from './components/Tutorial';
import ExpenseManager from './components/ExpenseManager';
import InventoryManager from './components/InventoryManager';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showTutorial, setShowTutorial] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const isMounted = useRef(false);

  const FASHION_IMAGE_URL = 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000';

  useEffect(() => {
    const initApp = () => {
      try {
        const savedUser = localStorage.getItem('gestao93_current_user');
        if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            const userId = parsedUser.id;
            
            const tutorialSeen = localStorage.getItem(`gestao93_tutorial_seen_${userId}`);
            if (!tutorialSeen) setShowTutorial(true);

            const safeParse = (key: string, fallback: any) => {
              try {
                const data = localStorage.getItem(key);
                if (!data || data === 'undefined' || data === 'null') return fallback;
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : fallback;
              } catch { 
                return fallback; 
              }
            };

            setCustomers(safeParse(`gestao93_customers_${userId}`, []));
            setSales(safeParse(`gestao93_sales_${userId}`, []));
            setExpenses(safeParse(`gestao93_expenses_${userId}`, []));
            setProducts(safeParse(`gestao93_products_${userId}`, []));
          }
        }
      } catch (e) {
        setInitError("Erro ao carregar dados salvos.");
      } finally {
        setLoading(false);
        isMounted.current = true;
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (loading || !user || !isMounted.current) return;

    const timer = setTimeout(() => {
      try {
        setSyncStatus('syncing');
        const userId = user.id;
        localStorage.setItem(`gestao93_customers_${userId}`, JSON.stringify(customers));
        localStorage.setItem(`gestao93_sales_${userId}`, JSON.stringify(sales));
        localStorage.setItem(`gestao93_expenses_${userId}`, JSON.stringify(expenses));
        localStorage.setItem(`gestao93_products_${userId}`, JSON.stringify(products));
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [customers, sales, expenses, products, user, loading]);

  const handleLogout = () => {
    localStorage.removeItem('gestao93_current_user');
    setUser(null);
    setActiveView('dashboard');
  };

  const handleAddSale = (newSale: Omit<Sale, 'id'>) => {
    const saleId = Math.random().toString(36).substr(2, 9);
    const saleWithId = { ...newSale, id: saleId };
    
    // Vincular parcelas ao ID da venda
    saleWithId.installments = saleWithId.installments.map(inst => ({ ...inst, saleId }));

    setSales(prev => [...prev, saleWithId]);

    if (newSale.updateStock && newSale.productId) {
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === newSale.productId 
            ? { ...p, stock: Math.max(0, p.stock - 1) } 
            : p
        )
      );
    }
  };

  const handlePayInstallment = (saleId: string, installmentId: string, isPaying: boolean) => {
    setSales(prevSales => prevSales.map(sale => {
      if (sale.id !== saleId) return sale;

      const updatedInstallments = sale.installments.map(inst => {
        if (inst.id === installmentId) {
          return {
            ...inst,
            paidAmount: isPaying ? inst.amount : 0,
            status: isPaying ? PaymentStatus.PAID : PaymentStatus.PENDING
          };
        }
        return inst;
      });

      // Recalcular status da venda
      const allPaid = updatedInstallments.every(i => i.status === PaymentStatus.PAID);
      const somePaid = updatedInstallments.some(i => i.status === PaymentStatus.PAID || i.paidAmount > 0);

      return {
        ...sale,
        installments: updatedInstallments,
        status: allPaid ? PaymentStatus.PAID : somePaid ? PaymentStatus.PARTIAL : PaymentStatus.PENDING
      };
    }));
  };

  const clearUserData = () => {
    if (!user) return;
    const userId = user.id;
    localStorage.removeItem(`gestao93_customers_${userId}`);
    localStorage.removeItem(`gestao93_sales_${userId}`);
    localStorage.removeItem(`gestao93_expenses_${userId}`);
    localStorage.removeItem(`gestao93_products_${userId}`);
    setCustomers([]);
    setSales([]);
    setExpenses([]);
    setProducts([]);
    alert("Dados zerados.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950 text-white font-black uppercase italic tracking-tighter">
        Gestão 93...
      </div>
    );
  }

  if (!user) return <Landing onLogin={setUser} />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard sales={sales} customers={customers} expenses={expenses} products={products} />;
      case 'customers': return <CustomerList customers={customers} sales={sales} onAdd={(c) => setCustomers([...customers, { ...c, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }])} onDelete={(id) => setCustomers(customers.filter(c => c.id !== id))} />;
      case 'sales-cash': return <SalesManager mode="cash" sales={sales} customers={customers} products={products} onAddSale={handleAddSale} onUpdateSale={(s) => setSales(sales.map(sale => sale.id === s.id ? s : sale))} />;
      case 'sales-credit': return <SalesManager mode="credit" sales={sales} customers={customers} products={products} onAddSale={handleAddSale} onUpdateSale={(s) => setSales(sales.map(sale => sale.id === s.id ? s : sale))} />;
      case 'inventory': return <InventoryManager products={products} onAdd={(p) => setProducts([...products, { ...p, id: Math.random().toString(36).substr(2, 9) }])} onDelete={(id) => setProducts(products.filter(p => p.id !== id))} onUpdate={(p) => setProducts(products.map(prod => prod.id === p.id ? p : prod))} />;
      case 'expenses': return <ExpenseManager expenses={expenses} onAdd={(description, amount) => setExpenses([...expenses, { id: Math.random().toString(36).substr(2, 9), description, amount }])} onDelete={(id) => setExpenses(expenses.filter(e => e.id !== id))} />;
      case 'agenda': return <Agenda sales={sales} customers={customers} onPayInstallment={handlePayInstallment} />;
      case 'settings': return <Settings user={user} customers={customers} sales={sales} products={products} onUpdateProfile={(u) => { setUser(u); localStorage.setItem('gestao93_current_user', JSON.stringify(u)); }} onImport={(data) => { setCustomers(data.customers); setSales(data.sales); setProducts(data.products || []); }} onClear={clearUserData} />;
      default: return <Dashboard sales={sales} customers={customers} expenses={expenses} products={products} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      <div className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${FASHION_IMAGE_URL})` }} />
      
      {showTutorial && <Tutorial activeView={activeView} onClose={() => { if(user) localStorage.setItem(`gestao93_tutorial_seen_${user.id}`, 'true'); setShowTutorial(false); }} />}
      
      <nav className="w-full md:w-64 bg-indigo-950 text-white flex flex-col shrink-0 z-50 shadow-2xl relative overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-indigo-900/50">
          <div className="bg-indigo-600 p-2 rounded-xl shrink-0 shadow-lg border border-white/20">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tighter italic uppercase text-white truncate">Gestão 93</h1>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-300">Nuvem {syncStatus === 'synced' ? 'Ok' : '...'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-4 space-y-1 px-3 overflow-y-auto no-scrollbar">
          <NavItem icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Início" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" label="Estoque" active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <NavItem icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" label="Clientes" active={activeView === 'customers'} onClick={() => setActiveView('customers')} />
          <div className="pt-4 pb-1 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Operacional</div>
          <NavItem icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" label="Venda Vista" active={activeView === 'sales-cash'} onClick={() => setActiveView('sales-cash')} />
          <NavItem icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Venda Prazo" active={activeView === 'sales-credit'} onClick={() => setActiveView('sales-credit')} />
          <NavItem icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Agenda" active={activeView === 'agenda'} onClick={() => setActiveView('agenda')} />
          <NavItem icon="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" label="Despesas" active={activeView === 'expenses'} onClick={() => setActiveView('expenses')} />
          <div className="pt-4 pb-1 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Sistema</div>
          <NavItem icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35" label="Ajustes" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>
        
        <div className="p-4 bg-black/30 border-t border-indigo-900/50">
           <div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="Logo" className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black truncate text-white uppercase">{user.name}</p>
                <p className="text-[8px] text-indigo-300 font-bold">Premium Account</p>
              </div>
              <button onClick={handleLogout} className="text-indigo-200 hover:text-rose-400 transition transform hover:scale-110">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1" /></svg>
              </button>
           </div>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen z-10">
        <div className="max-w-6xl mx-auto pb-12">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group ${active ? 'bg-indigo-600 text-white shadow-xl border border-white/10' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
    <span className={`text-sm font-bold tracking-tight whitespace-nowrap ${active ? 'font-black' : ''}`}>{label}</span>
    {active && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></div>}
  </button>
);

export default App;
