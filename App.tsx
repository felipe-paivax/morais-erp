
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrdersManager from './components/OrdersManager';
import ProjectDetail from './components/ProjectDetail';
import SuppliersManager from './components/SuppliersManager';
import MaterialsManager from './components/MaterialsManager';
import FinanceManager from './components/FinanceManager';
import { Project, MaterialOrder, Client, Supplier, OrderStatus, OrderQuote, Material, AccountPayable, AccountReceivable, PaymentStatus, TransactionCategory } from './types';
import { Icons } from './constants';

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '11 99999-9999', document: '123.456.789-00' },
  { id: '2', name: 'Maria Oliveira', email: 'maria@email.com', phone: '11 88888-8888', document: '987.654.321-11' }
];

const generateLargeSupplierBase = (count: number): Supplier[] => {
  const categories = ['Geral', 'Estrutural', 'Acabamento', 'Elétrica', 'Hidráulica', 'Serviços'];
  const names = ['Constru', 'Metais', 'Pedra', 'Aço', 'Gesso', 'Madeiras', 'Tintas', 'Tubos', 'Cabos', 'Vidros', 'Cerâmica', 'Mármores', 'Eletro', 'Soluções', 'Parceiros', 'Engenharia', 'Brasil', 'Norte', 'Sul', 'Master'];
  const suffixes = ['Ltda', 'S.A.', 'e Filhos', 'Indústria', 'Comércio', 'Distribuidora', 'Express', 'Pro'];
  return Array.from({ length: count }, (_, i) => {
    const name = `${names[Math.floor(Math.random() * names.length)]} ${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    return {
      id: `S-${1000 + i}`,
      name: name,
      category: categories[Math.floor(Math.random() * categories.length)],
      email: `vendas${i}@${name.toLowerCase().replace(/[^a-z]/g, '')}.com.br`,
      phone: `(11) 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
      document: `${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`,
      rating: 3 + (Math.random() * 2)
    };
  });
};

const MOCK_SUPPLIERS = generateLargeSupplierBase(270);

const MOCK_MATERIALS: Material[] = [
  { id: 'M-001', name: 'Cimento CP-II 50kg', category: 'Básico', unit: 'sc', description: 'Cimento Portland para uso geral' },
  { id: 'M-002', name: 'Areia Média Lavada', category: 'Agregados', unit: 'm3', description: 'Areia fina para reboco e assentamento' },
  { id: 'M-003', name: 'Brita 1', category: 'Agregados', unit: 'm3', description: 'Pedra britada para concreto' },
  { id: 'M-004', name: 'Ferro 10mm CA-50', category: 'Estrutural', unit: 'm', description: 'Barra de aço para reforço estrutural' },
  { id: 'M-005', name: 'Tijolo Baiano 9 Furos', category: 'Básico', unit: 'un', description: 'Tijolo cerâmico de vedação' }
];

const MOCK_PROJECTS: Project[] = [
  { id: 'P1', name: 'Residência Granja Viana', clientId: '1', budget: 150000, startDate: '2023-10-01', status: 'In Progress' },
  { id: 'P2', name: 'Escritório Morumbi', clientId: '2', budget: 85000, startDate: '2023-11-15', status: 'Planning' }
];

const generateGlobalQuotes = (selected: boolean = false): OrderQuote[] => {
  return MOCK_SUPPLIERS.slice(0, 3).map((s, i) => ({
    id: Math.random().toString(36).substr(2, 9),
    supplierId: s.id,
    totalPrice: 2500 + (Math.random() * 5000),
    deliveryDays: 2 + i,
    isSelected: selected && i === 0,
    isFreightIncluded: true,
    itemPrices: [],
    billingTerms: 'Faturamento 28 dias'
  }));
};

const MOCK_ORDERS: MaterialOrder[] = [
  {
    id: 'REQ-1001',
    projectId: 'P1',
    requestDate: '2024-01-10T10:00:00Z',
    status: OrderStatus.APPROVED,
    requestedBy: 'Felipe Paiva',
    items: [
      { id: 'i1', name: 'Prego 18x27', quantity: 10, unit: 'kg', category: 'Fixação' },
      { id: 'i2', name: 'Tábua de Pinus 3m', quantity: 20, unit: 'un', category: 'Madeiramento' },
      { id: 'i3', name: 'Ferro 10mm CA-50', quantity: 50, unit: 'm', category: 'Estrutural' }
    ],
    orderQuotes: generateGlobalQuotes(true)
  },
  {
    id: 'REQ-1002',
    projectId: 'P1',
    requestDate: '2024-01-15T14:30:00Z',
    status: OrderStatus.READY_FOR_APPROVAL,
    requestedBy: 'Felipe Paiva',
    items: [
      { id: 'i4', name: 'Cimento CP-II', quantity: 100, unit: 'sc', category: 'Básico' },
      { id: 'i5', name: 'Argamassa AC-III', quantity: 40, unit: 'sc', category: 'Acabamento' },
      { id: 'i6', name: 'Areia Média', quantity: 5, unit: 'm3', category: 'Agregados' }
    ],
    orderQuotes: generateGlobalQuotes(false)
  }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [orders, setOrders] = useState<MaterialOrder[]>(MOCK_ORDERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS);
  const [clients] = useState<Client[]>(MOCK_CLIENTS);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    clientId: '',
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Planning'
  });

  useEffect(() => {
    const savedOrders = localStorage.getItem('morais_erp_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    const savedProjects = localStorage.getItem('morais_erp_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedSuppliers = localStorage.getItem('morais_erp_suppliers');
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));

    const savedMaterials = localStorage.getItem('morais_erp_materials');
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    setSelectedProjectId(null);
    setViewingOrderId(null);
  };

  const handleUpdateOrder = (updated: MaterialOrder) => {
    const newOrders = orders.map(o => o.id === updated.id ? updated : o);
    setOrders(newOrders);
    localStorage.setItem('morais_erp_orders', JSON.stringify(newOrders));
  };

  const handleCreateOrder = (newOrder: MaterialOrder) => {
    const newOrders = [newOrder, ...orders];
    setOrders(newOrders);
    localStorage.setItem('morais_erp_orders', JSON.stringify(newOrders));
  };

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.clientId) return;
    const projectToSave: Project = { ...newProject as Project, id: `P${projects.length + 1 + Math.floor(Math.random() * 100)}` };
    const updatedProjects = [projectToSave, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem('morais_erp_projects', JSON.stringify(updatedProjects));
    setShowProjectModal(false);
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    const updatedSuppliers = suppliers.map(s => s.id === updated.id ? updated : s);
    setSuppliers(updatedSuppliers);
    localStorage.setItem('morais_erp_suppliers', JSON.stringify(updatedSuppliers));
  };

  const handleCreateSupplier = (newSupplier: Supplier) => {
    const updatedSuppliers = [newSupplier, ...suppliers];
    setSuppliers(updatedSuppliers);
    localStorage.setItem('morais_erp_suppliers', JSON.stringify(updatedSuppliers));
  };

  const handleUpdateMaterial = (updated: Material) => {
    const updatedMaterials = materials.map(m => m.id === updated.id ? updated : m);
    setMaterials(updatedMaterials);
    localStorage.setItem('morais_erp_materials', JSON.stringify(updatedMaterials));
  };

  const handleCreateMaterial = (newMaterial: Material) => {
    const updatedMaterials = [newMaterial, ...materials];
    setMaterials(updatedMaterials);
    localStorage.setItem('morais_erp_materials', JSON.stringify(updatedMaterials));
  };

  const handleViewOrder = (orderId: string) => {
    setViewingOrderId(orderId);
    setActiveTab('orders');
    setSelectedProjectId(null);
  };

  const handleUpdateAccountPayable = (account: AccountPayable) => {
    const updated = accountsPayable.map(a => a.id === account.id ? account : a);
    setAccountsPayable(updated);
    localStorage.setItem('morais_erp_accounts_payable', JSON.stringify(updated));
  };

  const handleCreateAccountPayable = (account: AccountPayable) => {
    const updated = [account, ...accountsPayable];
    setAccountsPayable(updated);
    localStorage.setItem('morais_erp_accounts_payable', JSON.stringify(updated));
  };

  const handleUpdateAccountReceivable = (account: AccountReceivable) => {
    const updated = accountsReceivable.map(a => a.id === account.id ? account : a);
    setAccountsReceivable(updated);
    localStorage.setItem('morais_erp_accounts_receivable', JSON.stringify(updated));
  };

  const handleCreateAccountReceivable = (account: AccountReceivable) => {
    const updated = [account, ...accountsReceivable];
    setAccountsReceivable(updated);
    localStorage.setItem('morais_erp_accounts_receivable', JSON.stringify(updated));
  };

  const handleApproveOrder = (order: MaterialOrder) => {
    // Atualizar o pedido
    handleUpdateOrder(order);

    // Criar conta a pagar automaticamente
    const selectedQuote = order.orderQuotes.find(q => q.isSelected);
    if (selectedQuote) {
      const supplier = suppliers.find(s => s.id === selectedQuote.supplierId);
      if (supplier) {
        // Calcular data de vencimento baseada nos termos de faturamento
        let dueDate = new Date();
        const billingTerms = selectedQuote.billingTerms || '';
        const daysMatch = billingTerms.match(/(\d+)\s*dia/i);
        if (daysMatch) {
          dueDate.setDate(dueDate.getDate() + parseInt(daysMatch[1]));
        } else {
          // Padrão: 30 dias
          dueDate.setDate(dueDate.getDate() + 30);
        }

        // Determinar categoria baseada nos itens do pedido
        const categories = order.items.map(item => item.category || 'Outros');
        const mostCommonCategory = categories.reduce((a, b, _, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        ) as TransactionCategory;
        
        const categoryMap: Record<string, TransactionCategory> = {
          'Estrutural': 'Materiais',
          'Básico': 'Materiais',
          'Agregados': 'Materiais',
          'Fixação': 'Materiais',
          'Madeiramento': 'Materiais',
          'Acabamento': 'Materiais'
        };

        const accountPayable: AccountPayable = {
          id: `AP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          orderId: order.id,
          projectId: order.projectId,
          supplierId: selectedQuote.supplierId,
          description: `Pedido ${order.id} - ${order.items.map(i => i.name).join(', ')}`,
          amount: selectedQuote.totalPrice,
          dueDate: dueDate.toISOString().split('T')[0],
          status: PaymentStatus.PENDING,
          paymentMethod: selectedQuote.paymentMethod,
          category: categoryMap[mostCommonCategory] || 'Materiais',
          billingTerms: selectedQuote.billingTerms,
          observations: selectedQuote.observations,
          createdAt: new Date().toISOString(),
          createdBy: order.requestedBy
        };

        handleCreateAccountPayable(accountPayable);
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-[#121212] border border-[#1A1A1A] p-12 rounded-[3rem] shadow-2xl animate-subtle-fade text-white">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-[#F4C150] rounded-3xl flex items-center justify-center p-4 mx-auto mb-6">
              <img src="https://moraisarquitetura.com.br/wp-content/uploads/2025/12/morais-logo-simbolo-preto.svg" alt="Logo" className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">MORAIS ARQUITETURA</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#F4C150] font-black mt-2">Enterprise Resource Planning</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Usuário</label>
              <input type="text" placeholder="ADMIN" className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Senha</label>
              <input type="password" placeholder="••••••••" className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none" />
            </div>
            <button onClick={() => setIsLoggedIn(true)} className="w-full py-6 bg-[#F4C150] text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[#ffcf66] transition-all mt-8 shadow-[0_0_30px_rgba(244,193,80,0.2)]">
              Acessar ERP
            </button>
          </div>
          <p className="mt-12 text-center text-[9px] text-gray-600 uppercase tracking-widest font-bold">Morais Arquitetura © 2025</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard projects={projects} orders={orders} />;
      case 'materials': return <MaterialsManager materials={materials} onUpdateMaterial={handleUpdateMaterial} onCreateMaterial={handleCreateMaterial} />;
      case 'orders': return <OrdersManager orders={orders} projects={projects} suppliers={suppliers} onUpdateOrder={handleUpdateOrder} onCreateOrder={handleCreateOrder} viewingOrderId={viewingOrderId} setViewingOrderId={setViewingOrderId} />;
      case 'suppliers': return <SuppliersManager suppliers={suppliers} onUpdateSupplier={handleUpdateSupplier} onCreateSupplier={handleCreateSupplier} />;
      case 'finance': return <FinanceManager accountsPayable={accountsPayable} accountsReceivable={accountsReceivable} projects={projects} suppliers={suppliers} clients={clients} onUpdateAccountPayable={handleUpdateAccountPayable} onCreateAccountPayable={handleCreateAccountPayable} onUpdateAccountReceivable={handleUpdateAccountReceivable} onCreateAccountReceivable={handleCreateAccountReceivable} />;
      case 'projects':
        if (selectedProjectId) {
          const project = projects.find(p => p.id === selectedProjectId);
          const projectOrders = orders.filter(o => o.projectId === selectedProjectId);
          if (!project) return null;
          return <ProjectDetail project={project} client={clients.find(c => c.id === project.clientId)} orders={projectOrders} onBack={() => setSelectedProjectId(null)} onViewOrder={handleViewOrder} />;
        }
        return (
          <div className="space-y-12">
            <div className="flex justify-between items-end border-b border-[#222222] pb-6">
               <div><h2 className="text-3xl font-black tracking-tighter">Obras em Andamento</h2><p className="text-xs text-gray-500 font-medium">Monitoramento técnico de execução</p></div>
               <button onClick={() => setShowProjectModal(true)} className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-8 py-3 rounded-xl hover:bg-[#F4C150] transition-all">Novo Canteiro</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-white">
              {projects.map(p => (
                <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className="group bg-[#161616] border border-[#222222] p-10 rounded-[2.5rem] hover:border-[#F4C150] transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-start mb-16 relative z-10">
                    <span className={`text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-full ${p.status === 'In Progress' ? 'bg-[#F4C150] text-black' : 'bg-[#222] text-gray-500'}`}>{p.status === 'In Progress' ? 'Em Execução' : 'Planejamento'}</span>
                    <span className="text-[10px] font-black text-gray-600">ID: {p.id}</span>
                  </div>
                  <h3 className="font-black text-2xl mb-2 group-hover:text-[#F4C150] transition-colors relative z-10">{p.name}</h3>
                  <p className="text-xs text-gray-500 font-medium relative z-10">Início: {new Date(p.startDate).toLocaleDateString()}</p>
                  <div className="flex items-end justify-between mt-12 relative z-10">
                    <div><p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Budget Total</p><p className="font-black text-xl">R$ {p.budget.toLocaleString()}</p></div>
                    <div className="w-12 h-12 rounded-2xl border border-[#222222] flex items-center justify-center group-hover:bg-[#F4C150] group-hover:text-black transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path></svg></div>
                  </div>
                </div>
              ))}
            </div>
            {showProjectModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
                <div className="bg-[#121212] w-full max-w-2xl rounded-[3rem] border border-[#222222] shadow-2xl animate-subtle-fade overflow-hidden">
                  <div className="p-10 border-b border-[#1A1A1A] flex justify-between items-center bg-[#161616]">
                    <div><h3 className="text-lg font-black uppercase tracking-tight text-white">Nova Obra</h3><p className="text-[10px] text-[#F4C150] font-black uppercase tracking-widest">Abertura de Canteiro Técnico</p></div>
                    <button onClick={() => setShowProjectModal(false)} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:text-[#F4C150]">✕</button>
                  </div>
                  <div className="p-10 space-y-8 text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Nome da Obra</label>
                        <input type="text" placeholder="EX: RESIDÊNCIA ALPHAVILLE" className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] transition-all outline-none uppercase" value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Cliente Responsável</label>
                        <select className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] transition-all outline-none uppercase" value={newProject.clientId} onChange={(e) => setNewProject({...newProject, clientId: e.target.value})}>
                          <option value="">SELECIONAR CLIENTE</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Orçamento Estimado (R$)</label><input type="number" placeholder="0,00" className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none" value={newProject.budget} onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})} /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Data Prevista de Início</label><input type="date" className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none" value={newProject.startDate} onChange={(e) => setNewProject({...newProject, startDate: e.target.value})} /></div>
                    </div>
                  </div>
                  <div className="p-10 border-t border-[#1A1A1A] flex justify-end gap-6 bg-[#161616]">
                    <button onClick={() => setShowProjectModal(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cancelar</button>
                    <button onClick={handleCreateProject} disabled={!newProject.name || !newProject.clientId} className="bg-[#F4C150] text-black px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10 shadow-[0_0_30px_rgba(244,193,80,0.1)]">Abrir Canteiro</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
