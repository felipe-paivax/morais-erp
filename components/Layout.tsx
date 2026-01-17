
import React, { useState } from 'react';
import { Icons, COLORS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Visão geral e métricas', icon: Icons.Dashboard },
    { id: 'projects', label: 'Obras', desc: 'Gestão de portfólio', icon: Icons.Project },
    { id: 'materials', label: 'Materiais', desc: 'Catálogo técnico', icon: Icons.Supplies },
    { id: 'orders', label: 'Pedidos', desc: 'Suprimentos e cotações', icon: Icons.Supplies },
    { id: 'suppliers', label: 'Fornecedores', desc: 'Parceiros e contatos', icon: Icons.Users },
    { id: 'finance', label: 'Financeiro', desc: 'Fluxo e custos', icon: Icons.Finance },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-white overflow-hidden relative">
      {/* Backdrop for mobile */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#121212] flex flex-col border-r border-[#1A1A1A] transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F4C150] rounded-xl flex items-center justify-center p-2">
             <img 
               src="https://moraisarquitetura.com.br/wp-content/uploads/2025/12/morais-logo-simbolo-preto.svg" 
               alt="Logo" 
               className="w-full h-full"
             />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-white">MORAES</h1>
            <p className="text-[10px] text-[#F4C150] font-bold uppercase tracking-widest mt-1">Admin Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center px-4 py-4 transition-all duration-200 rounded-xl group ${
                activeTab === item.id 
                ? 'sidebar-item-active' 
                : 'hover:bg-white/5 text-gray-500 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-4 transition-colors ${activeTab === item.id ? 'text-[#F4C150]' : 'text-gray-600 group-hover:text-gray-300'}`} />
              <div className="text-left">
                <p className={`text-sm font-bold ${activeTab === item.id ? 'text-white' : 'text-inherit'}`}>{item.label}</p>
                <p className="text-[10px] opacity-40 font-medium">{item.desc}</p>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-[#222222] flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#F4C150] border border-[#F4C150]/20 flex items-center justify-center text-black font-black text-xs">MA</div>
             <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate uppercase tracking-tighter">Felipe Paiva</p>
                <p className="text-[9px] text-[#F4C150] font-black uppercase">Administrador</p>
             </div>
             <button 
              onClick={onLogout}
              className="text-gray-600 hover:text-red-500 transition-colors"
              title="Sair do Sistema"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0B]">
        <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-[#1A1A1A] bg-[#0B0B0B] z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#1A1A1A] border border-[#222222] text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
            <div>
               <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase text-white truncate max-w-[150px] md:max-w-none">
                 {navItems.find(i => i.id === activeTab)?.label || activeTab}
               </h2>
               <p className="hidden md:block text-xs text-gray-500 font-medium">Gestão inteligente e monitoramento em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-2 text-[10px] md:text-xs font-bold bg-[#1A1A1A] px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-[#222222]">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-400">STATUS:</span> ONLINE
            </div>
            <button className="bg-[#1A1A1A] p-2 md:p-2.5 rounded-xl border border-[#222222] hover:border-gray-600 transition-all">
               <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 md:p-12 custom-scroll">
          <div className="max-w-[1400px] mx-auto animate-subtle-fade">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
