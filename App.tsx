
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrdersManager from './components/OrdersManager';
import ProjectDetail from './components/ProjectDetail';
import SuppliersManager from './components/SuppliersManager';
import MaterialsManager from './components/MaterialsManager';
import FinanceManager from './components/FinanceManager';
import { Project, MaterialOrder, Client, Supplier, OrderStatus, OrderQuote, Material, AccountPayable, AccountReceivable, PaymentStatus, TransactionCategory } from './types';
import { Icons } from './constants';
import { useTheme } from './contexts/ThemeContext';

// Lista de obras fornecidas
const OBRA_NAMES = [
  'Alexandre e Érika',
  'Alvaro e Valquiria',
  'Andressa Jeice',
  'Eduardo e Carina',
  'Eduardo e Juliana',
  'Fábio e Alessandra',
  'Fábio e Evelise',
  'Fábio e Patricia',
  'Felipe e Walesca',
  'Flávio e Edna',
  'Gustavo e Fabiana',
  'Isaías e Marcela',
  'Leandro e Amanda',
  'Leonardo e Julia',
  'Leonardo e Juliana',
  'Luiz e Aurélio',
  'Marc e Eliete',
  'Marcel e Ana',
  'Márcio e Cristiane',
  'Marco Aurélio José Mendes e Ana P. P. Lemos',
  'Matheus e Tiemi',
  'Menyere Botelho Reis e Renata',
  'Michel Roberto Bervian',
  'MPSV PARTICIPAÇÕES IMOBILIARIAS LTDA',
  'Neide e Júlia',
  'Raquel e André',
  'Renato e Cássia',
  'Rodrigo e Giovana',
  'Silvano Alves Toledo e Marina M. M. Toledo',
  'Vinicius e Ana',
  'Weber Porto'
];

// Função para gerar orçamento baseado no nome (variação realista)
const generateBudget = (index: number): number => {
  const baseBudget = 120000 + (Math.random() * 180000); // Entre 120k e 300k
  return Math.round(baseBudget);
};

// Função para gerar data de início (distribuída ao longo do último ano)
const generateStartDate = (index: number): string => {
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 365); // Últimos 365 dias
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysAgo);
  return startDate.toISOString().split('T')[0];
};

// Gerar clientes baseados nas obras
const MOCK_CLIENTS: Client[] = OBRA_NAMES.map((name, index) => {
  const nameParts = name.toLowerCase().replace(/ e /g, ' ').split(' ').filter(p => p.length > 2);
  const firstName = nameParts[0] || 'cliente';
  const email = `${firstName}${index}@email.com`;
  const phone = `(11) 9${String(Math.floor(1000 + index * 37)).slice(0, 4)}-${String(Math.floor(1000 + index * 23)).slice(0, 4)}`;
  const doc = `${String(100 + index).padStart(3, '0')}.${String(100 + index * 2).padStart(3, '0')}.${String(100 + index * 3).padStart(3, '0')}-${String(10 + index).padStart(2, '0')}`;
  
  return {
    id: `C-${index + 1}`,
    name: name,
    email: email,
    phone: phone,
    document: doc
  };
});

// Gerar projetos baseados nas obras
const MOCK_PROJECTS: Project[] = OBRA_NAMES.map((name, index) => ({
  id: `P-${index + 1}`,
  name: name,
  clientId: `C-${index + 1}`,
  budget: generateBudget(index),
  startDate: generateStartDate(index),
  status: 'In Progress' as const
}));

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

const generateGlobalQuotes = (selected: boolean = false, basePrice: number = 5000): OrderQuote[] => {
  return MOCK_SUPPLIERS.slice(0, 3).map((s, i) => ({
    id: Math.random().toString(36).substr(2, 9),
    supplierId: s.id,
    totalPrice: basePrice + (Math.random() * basePrice * 0.3), // Variação de até 30%
    deliveryDays: 2 + i,
    isSelected: selected && i === 0,
    isFreightIncluded: true,
    itemPrices: [],
    billingTerms: 'Faturamento 28 dias'
  }));
};

// Função para gerar pedidos realistas para os projetos
const generateOrdersForProjects = (): MaterialOrder[] => {
  const orders: MaterialOrder[] = [];
  const orderStatuses = [
    OrderStatus.APPROVED,
    OrderStatus.DELIVERED,
    OrderStatus.READY_FOR_APPROVAL,
    OrderStatus.PENDING_QUOTES,
    OrderStatus.APPROVED,
    OrderStatus.DELIVERED
  ];
  
  const materialItems = [
    [
      { id: 'i1', name: 'Cimento CP-II 50kg', quantity: 50 + Math.floor(Math.random() * 100), unit: 'sc', category: 'Básico' },
      { id: 'i2', name: 'Areia Média Lavada', quantity: 3 + Math.floor(Math.random() * 5), unit: 'm3', category: 'Agregados' },
      { id: 'i3', name: 'Brita 1', quantity: 2 + Math.floor(Math.random() * 4), unit: 'm3', category: 'Agregados' }
    ],
    [
      { id: 'i4', name: 'Ferro 10mm CA-50', quantity: 100 + Math.floor(Math.random() * 200), unit: 'm', category: 'Estrutural' },
      { id: 'i5', name: 'Ferro 12mm CA-50', quantity: 50 + Math.floor(Math.random() * 100), unit: 'm', category: 'Estrutural' },
      { id: 'i6', name: 'Tijolo Baiano 9 Furos', quantity: 500 + Math.floor(Math.random() * 1000), unit: 'un', category: 'Básico' }
    ],
    [
      { id: 'i7', name: 'Argamassa AC-III', quantity: 30 + Math.floor(Math.random() * 50), unit: 'sc', category: 'Acabamento' },
      { id: 'i8', name: 'Rejunte Branco', quantity: 10 + Math.floor(Math.random() * 20), unit: 'kg', category: 'Acabamento' },
      { id: 'i9', name: 'Tinta Acrílica Branca', quantity: 20 + Math.floor(Math.random() * 40), unit: 'gal', category: 'Acabamento' }
    ],
    [
      { id: 'i10', name: 'Prego 18x27', quantity: 20 + Math.floor(Math.random() * 30), unit: 'kg', category: 'Fixação' },
      { id: 'i11', name: 'Tábua de Pinus 3m', quantity: 30 + Math.floor(Math.random() * 50), unit: 'un', category: 'Madeiramento' },
      { id: 'i12', name: 'Viga de Madeira 6x12', quantity: 10 + Math.floor(Math.random() * 20), unit: 'un', category: 'Madeiramento' }
    ],
    [
      { id: 'i13', name: 'Tubo PVC 50mm', quantity: 20 + Math.floor(Math.random() * 40), unit: 'm', category: 'Hidráulica' },
      { id: 'i14', name: 'Conexão PVC 50mm', quantity: 15 + Math.floor(Math.random() * 25), unit: 'un', category: 'Hidráulica' },
      { id: 'i15', name: 'Fio Elétrico 2.5mm', quantity: 100 + Math.floor(Math.random() * 200), unit: 'm', category: 'Elétrica' }
    ]
  ];

  let orderCounter = 1001;
  
  // Gerar pedidos para cada projeto (entre 2 e 8 pedidos por projeto)
  MOCK_PROJECTS.forEach((project, projectIndex) => {
    const numOrders = 2 + Math.floor(Math.random() * 6); // Entre 2 e 7 pedidos
    
    for (let i = 0; i < numOrders; i++) {
      const daysAgo = Math.floor(Math.random() * 180); // Últimos 180 dias
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() - daysAgo);
      
      const statusIndex = Math.floor(Math.random() * orderStatuses.length);
      const status = orderStatuses[statusIndex];
      const itemsSet = materialItems[Math.floor(Math.random() * materialItems.length)];
      
      // Calcular preço baseado nos itens
      const basePrice = itemsSet.reduce((sum, item) => {
        const unitPrice = item.category === 'Estrutural' ? 15 : 
                         item.category === 'Básico' ? 30 :
                         item.category === 'Acabamento' ? 25 :
                         item.category === 'Hidráulica' ? 8 :
                         item.category === 'Elétrica' ? 5 : 10;
        return sum + (item.quantity * unitPrice);
      }, 0);
      
      const isSelected = status === OrderStatus.APPROVED || status === OrderStatus.DELIVERED;
      
      orders.push({
        id: `REQ-${orderCounter++}`,
        projectId: project.id,
        requestDate: requestDate.toISOString(),
        status: status,
        requestedBy: 'Felipe Paiva',
        items: itemsSet.map(item => ({ ...item, id: `${item.id}-${orderCounter}` })),
        orderQuotes: generateGlobalQuotes(isSelected, basePrice)
      });
    }
  });

  return orders;
};

const MOCK_ORDERS: MaterialOrder[] = generateOrdersForProjects();

const App: React.FC = () => {
  const { theme } = useTheme();
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
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [projectFilterStatus, setProjectFilterStatus] = useState<string>('all');
  const [projectFilterClient, setProjectFilterClient] = useState<string>('all');
  const [projectSortConfig, setProjectSortConfig] = useState<{ key: 'name' | 'status' | 'startDate' | 'budget' | 'progress'; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  const [projectCurrentPage, setProjectCurrentPage] = useState(1);
  const [projectItemsPerPage, setProjectItemsPerPage] = useState(10);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    clientId: '',
    budget: 0,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Planning'
  });

  // Calcular progresso de cada obra (sempre executado, não condicional)
  const projectsWithProgress = useMemo(() => {
    const calculateTotalOrderCost = (order: MaterialOrder) => {
      const selectedQuote = order.orderQuotes.find(q => q.isSelected);
      if (selectedQuote) return selectedQuote.totalPrice;
      if (order.orderQuotes.length > 0) {
        return Math.min(...order.orderQuotes.map(q => q.totalPrice));
      }
      return 0;
    };

    return projects.map(project => {
      const projectOrders = orders.filter(o => o.projectId === project.id);
      const projectInvested = projectOrders
        .filter(o => o.status === OrderStatus.APPROVED || o.status === OrderStatus.DELIVERED)
        .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);
      const progress = project.budget > 0 ? (projectInvested / project.budget) * 100 : 0;
      return { ...project, progress: Math.min(progress, 100) };
    });
  }, [projects, orders]);

  // Filtrar e ordenar obras (sempre executado, não condicional)
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projectsWithProgress.filter(project => {
      // Filtro por status
      if (projectFilterStatus !== 'all') {
        if (projectFilterStatus === 'In Progress' && project.status !== 'In Progress') return false;
        if (projectFilterStatus === 'Completed' && project.status !== 'Completed') return false;
        if (projectFilterStatus === 'Planning' && project.status !== 'Planning') return false;
      }
      
      // Filtro por cliente
      if (projectFilterClient !== 'all' && project.clientId !== projectFilterClient) return false;
      
      // Filtro por pesquisa
      if (projectSearchTerm) {
        const searchLower = projectSearchTerm.toLowerCase();
        if (
          !project.name.toLowerCase().includes(searchLower) &&
          !project.id.toLowerCase().includes(searchLower) &&
          !project.status.toLowerCase().includes(searchLower) &&
          !project.budget.toString().includes(projectSearchTerm)
        ) return false;
      }
      return true;
    });

    // Ordenação
    if (projectSortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (projectSortConfig.key === 'name') {
          aValue = a.name;
          bValue = b.name;
        } else if (projectSortConfig.key === 'status') {
          aValue = a.status;
          bValue = b.status;
        } else if (projectSortConfig.key === 'startDate') {
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
        } else if (projectSortConfig.key === 'budget') {
          aValue = a.budget;
          bValue = b.budget;
        } else if (projectSortConfig.key === 'progress') {
          aValue = a.progress;
          bValue = b.progress;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return projectSortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return projectSortConfig.direction === 'asc' ? 1 : -1;
        } else {
          if (aValue < bValue) return projectSortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return projectSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [projectsWithProgress, projectSearchTerm, projectFilterStatus, projectFilterClient, projectSortConfig]);

  // Paginação de projetos
  const paginatedProjects = useMemo(() => {
    const startIndex = (projectCurrentPage - 1) * projectItemsPerPage;
    return filteredAndSortedProjects.slice(startIndex, startIndex + projectItemsPerPage);
  }, [filteredAndSortedProjects, projectCurrentPage, projectItemsPerPage]);

  const projectTotalPages = Math.ceil(filteredAndSortedProjects.length / projectItemsPerPage);

  useEffect(() => {
    setProjectCurrentPage(1);
  }, [projectSearchTerm, projectFilterStatus, projectFilterClient, projectItemsPerPage]);

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
      <div className={`min-h-screen flex items-center justify-center p-8 ${theme === 'dark' ? 'bg-[#000000]' : 'bg-[#F5F5F5]'}`}>
        <div className={`w-full max-w-md p-12 rounded-[3rem] shadow-2xl animate-subtle-fade border ${theme === 'dark' ? 'bg-[#121212] border-[#1A1A1A] text-white' : 'bg-white border-[#E0E0E0] text-[#0B0B0B]'}`}>
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-[#F4C150] rounded-3xl flex items-center justify-center p-4 mx-auto mb-6">
              <img src="https://moraisarquitetura.com.br/wp-content/uploads/2025/12/morais-logo-simbolo-preto.svg" alt="Logo" className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">MORAIS ARQUITETURA</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#F4C150] font-black mt-2">Enterprise Resource Planning</p>
          </div>
            <div className="space-y-5">
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Usuário</label>
              <input type="text" placeholder="ADMIN" className={`w-full p-5 rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border border-[#222222] text-white' : 'bg-[#F5F5F5] border border-[#D0D0D0] text-[#0B0B0B]'}`} />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Senha</label>
              <input type="password" placeholder="••••••••" className={`w-full p-5 rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border border-[#222222] text-white' : 'bg-[#F5F5F5] border border-[#D0D0D0] text-[#0B0B0B]'}`} />
            </div>
            <button onClick={() => setIsLoggedIn(true)} className="w-full py-6 bg-[#F4C150] text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[#ffcf66] transition-all mt-8 shadow-[0_0_30px_rgba(244,193,80,0.2)]">
              Acessar ERP
            </button>
          </div>
          <p className={`mt-12 text-center text-[9px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>Morais Arquitetura © 2025</p>
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
        
        // Calcular estatísticas gerais
        const calculateTotalOrderCost = (order: MaterialOrder) => {
          const selectedQuote = order.orderQuotes.find(q => q.isSelected);
          if (selectedQuote) return selectedQuote.totalPrice;
          if (order.orderQuotes.length > 0) {
            return Math.min(...order.orderQuotes.map(q => q.totalPrice));
          }
          return 0;
        };

        const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
        const totalInvested = orders
          .filter(o => o.status === OrderStatus.APPROVED || o.status === OrderStatus.DELIVERED)
          .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);
        const totalPending = orders
          .filter(o => o.status !== OrderStatus.APPROVED && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.REJECTED)
          .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);
        const totalAvailable = totalBudget - totalInvested - totalPending;
        const totalOrders = orders.length;
        const inProgressCount = projects.filter(p => p.status === 'In Progress').length;

        // Usar o paginatedProjects calculado no nível do componente
        const displayProjects = paginatedProjects;

        const requestProjectSort = (key: 'name' | 'status' | 'startDate' | 'budget' | 'progress') => {
          let direction: 'asc' | 'desc' = 'asc';
          if (projectSortConfig && projectSortConfig.key === key && projectSortConfig.direction === 'asc') {
            direction = 'desc';
          }
          setProjectSortConfig({ key, direction });
        };

        const ProjectSortIcon = ({ column }: { column: 'name' | 'status' | 'startDate' | 'budget' | 'progress' }) => {
          if (!projectSortConfig || projectSortConfig.key !== column) {
            return <svg className="w-3 h-3 ml-1 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
          }
          return projectSortConfig.direction === 'asc' ? (
            <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          ) : (
            <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          );
        };

        return (
          <div className={`space-y-8 md:space-y-12 ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
            {/* Header */}
            <div className={`flex justify-between items-end border-b pb-6 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
              <div>
                <h2 className={`text-3xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Obras em Andamento</h2>
                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Monitoramento técnico de execução</p>
              </div>
            </div>

            {/* Indicadores Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className={`p-6 md:p-8 rounded-[2rem] border min-w-0 ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB] shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Total de Obras</p>
                <p className={`text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{projects.length}</p>
                <p className={`text-[9px] md:text-[10px] font-black uppercase mt-2 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>{inProgressCount} Em Execução</p>
              </div>
              <div className={`p-6 md:p-8 rounded-[2rem] border min-w-0 ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB] shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Orçamento Total</p>
                <p className={`text-lg md:text-xl font-black tracking-tighter break-words leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-[9px] md:text-[10px] font-black uppercase mt-2 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Alocado</p>
              </div>
              <div className={`p-6 md:p-8 rounded-[2rem] border min-w-0 ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB] shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Investimento Realizado</p>
                <p className="text-lg md:text-xl font-black tracking-tighter text-[#F4C150] break-words leading-tight">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-[9px] md:text-[10px] font-black uppercase mt-2 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Executado</p>
              </div>
              <div className={`p-6 md:p-8 rounded-[2rem] border min-w-0 ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB] shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Pedidos Emitidos</p>
                <p className="text-2xl font-black tracking-tighter text-blue-500">{totalOrders}</p>
                <p className={`text-[9px] md:text-[10px] font-black uppercase mt-2 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Requisições</p>
              </div>
            </div>

            {/* Filtros e Ações */}
            <div className={`flex flex-col gap-4 border-b pb-6 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="flex flex-wrap gap-4">
                  <select
                    value={projectFilterStatus}
                    onChange={(e) => setProjectFilterStatus(e.target.value)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="In Progress">Em Execução</option>
                    <option value="Completed">Concluída</option>
                    <option value="Planning">Planejamento</option>
                  </select>
                  <select
                    value={projectFilterClient}
                    onChange={(e) => setProjectFilterClient(e.target.value)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  >
                    <option value="all">Todos os Clientes</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={() => setShowProjectModal(true)} className="bg-[#F4C150] text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#ffcf66] transition-all shadow-sm">
                  + Nova Obra
                </button>
              </div>
              {/* Barra de Pesquisa */}
              <div className="relative group w-full">
                <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-[#F4C150] transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <input 
                  type="text" 
                  placeholder="PESQUISAR POR NOME, ID, STATUS..."
                  className={`w-full pl-12 pr-6 py-4 border rounded-2xl text-[10px] font-black tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white placeholder:text-gray-700' : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tabela de Obras */}
            <div className={`border rounded-[2rem] overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-[#222222] bg-[#1a1a1a]/50' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                      <th 
                        className={`px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                        onClick={() => requestProjectSort('name')}
                      >
                        <div className="flex items-center">Obra <ProjectSortIcon column="name" /></div>
                      </th>
                      <th 
                        className={`px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                        onClick={() => requestProjectSort('status')}
                      >
                        <div className="flex items-center">Status <ProjectSortIcon column="status" /></div>
                      </th>
                      <th 
                        className={`px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                        onClick={() => requestProjectSort('startDate')}
                      >
                        <div className="flex items-center">Início <ProjectSortIcon column="startDate" /></div>
                      </th>
                      <th 
                        className={`px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                        onClick={() => requestProjectSort('budget')}
                      >
                        <div className="flex items-center">Orçamento <ProjectSortIcon column="budget" /></div>
                      </th>
                      <th 
                        className={`px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap min-w-[200px] cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                        onClick={() => requestProjectSort('progress')}
                      >
                        <div className="flex items-center">Progresso <ProjectSortIcon column="progress" /></div>
                      </th>
                      <th className={`px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right whitespace-nowrap ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`p-12 md:p-20 text-center ${theme === 'dark' ? 'opacity-30' : 'opacity-50'}`}>
                          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-white' : 'text-[#6B7280]'}`}>Nenhuma obra encontrada</p>
                        </td>
                      </tr>
                    ) : (
                      displayProjects.map((project, index) => {
                        const projectOrders = orders.filter(o => o.projectId === project.id);
                        const projectInvested = projectOrders
                          .filter(o => o.status === OrderStatus.APPROVED || o.status === OrderStatus.DELIVERED)
                          .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);
                        const projectPending = projectOrders
                          .filter(o => o.status !== OrderStatus.APPROVED && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.REJECTED)
                          .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);

                        return (
                          <tr key={project.id} className={`border-b transition-colors group ${theme === 'dark' ? 'border-[#1A1A1A] hover:bg-white/[0.02]' : `border-[#E5E7EB] ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'} hover:bg-[#F2F3F5]`}`}>
                            <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8">
                              <p className={`text-xs md:text-sm font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{project.name}</p>
                              <p className={`text-[8px] md:text-[9px] uppercase mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>ID: {project.id}</p>
                            </td>
                            <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 whitespace-nowrap">
                              <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full border inline-block ${
                                project.status === 'In Progress' 
                                  ? 'bg-[#F4C150] text-black border-[#F4C150]' 
                                  : project.status === 'Completed'
                                  ? 'bg-green-500/10 text-green-500 border-green-500/50'
                                  : theme === 'dark' 
                                    ? 'bg-[#222] text-gray-500 border-[#222]'
                                    : 'bg-[#F2F3F5] text-[#6B7280] border-[#E5E7EB]'
                              }`}>
                                {project.status === 'In Progress' ? 'Em Execução' : project.status === 'Completed' ? 'Concluída' : 'Planejamento'}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 whitespace-nowrap">
                              <p className={`text-xs md:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
                                {new Date(project.startDate).toLocaleDateString('pt-BR')}
                              </p>
                            </td>
                            <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 whitespace-nowrap">
                              <p className={`text-xs md:text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </td>
                            <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-[120px]">
                                  <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#E5E7EB]'}`}>
                                    <div 
                                      className="h-full bg-[#F4C150] transition-all"
                                      style={{ width: `${Math.min(project.progress, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="text-right min-w-[60px]">
                                  <p className={`text-xs md:text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{project.progress.toFixed(1)}%</p>
                                  <p className={`text-[8px] md:text-[9px] ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>
                                    R$ {projectInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 text-right whitespace-nowrap">
                              <button 
                                onClick={() => setSelectedProjectId(project.id)}
                                className={`p-2.5 md:p-3 border rounded-xl transition-all shrink-0 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-gray-400 hover:text-white hover:border-white' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:border-[#D1D5DB]'}`}
                                title="Ver Detalhes"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"></path>
                                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"></path>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* Paginação */}
              <div className={`px-4 md:px-8 py-4 md:py-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/30 border-[#222]' : 'bg-[#F8F9FA] border-[#E5E7EB]'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Exibir:</span>
                  <select 
                    className={`border text-[10px] font-black px-2 py-1 rounded-lg outline-none focus:border-[#F4C150] ${theme === 'dark' ? 'bg-[#121212] border-[#222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={projectItemsPerPage}
                    onChange={(e) => setProjectItemsPerPage(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>
                    Total: {filteredAndSortedProjects.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setProjectCurrentPage(p => Math.max(1, p - 1))}
                    disabled={projectCurrentPage === 1}
                    className={`p-2 border rounded-xl transition-all disabled:opacity-20 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222] text-gray-500 hover:text-white' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </button>
                  <span className={`px-4 py-2 border border-[#F4C150]/20 rounded-xl text-[10px] font-black text-[#F4C150] ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
                    PÁGINA {projectCurrentPage} DE {projectTotalPages || 1}
                  </span>
                  <button 
                    onClick={() => setProjectCurrentPage(p => Math.min(projectTotalPages, p + 1))}
                    disabled={projectCurrentPage === projectTotalPages || projectTotalPages === 0}
                    className={`p-2 border rounded-xl transition-all disabled:opacity-20 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222] text-gray-500 hover:text-white' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </button>
                </div>
              </div>
            </div>
            {showProjectModal && typeof document !== 'undefined' && createPortal(
              <>
                <div 
                  className={`fixed backdrop-blur-xl z-[9999] ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }} 
                  onClick={() => setShowProjectModal(false)}
                ></div>
                <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-[3rem] border shadow-2xl overflow-hidden z-[10000] ${theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`} style={{ animation: 'fadeInModal 0.3s ease-out' }}>
                  <div className={`p-10 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                    <div><h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Nova Obra</h3><p className="text-[10px] text-[#F4C150] font-black uppercase tracking-widest">Abertura de Canteiro Técnico</p></div>
                    <button onClick={() => setShowProjectModal(false)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1A1A1A] text-white hover:text-[#F4C150]' : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#F4C150] hover:border-[#D1D5DB]'}`}>✕</button>
                  </div>
                  <div className={`p-10 space-y-8 ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Nome da Obra</label>
                        <input type="text" placeholder="EX: RESIDÊNCIA ALPHAVILLE" className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`} value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Cliente Responsável</label>
                        <select className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`} value={newProject.clientId} onChange={(e) => setNewProject({...newProject, clientId: e.target.value})}>
                          <option value="">SELECIONAR CLIENTE</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Orçamento Estimado (R$)</label><input type="number" placeholder="0,00" className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`} value={newProject.budget} onChange={(e) => setNewProject({...newProject, budget: Number(e.target.value)})} /></div>
                      <div className="space-y-2"><label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Data Prevista de Início</label><input type="date" className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`} value={newProject.startDate} onChange={(e) => setNewProject({...newProject, startDate: e.target.value})} /></div>
                    </div>
                  </div>
                  <div className={`p-10 border-t flex justify-end gap-6 ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                    <button onClick={() => setShowProjectModal(false)} className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Cancelar</button>
                    <button onClick={handleCreateProject} disabled={!newProject.name || !newProject.clientId} className="bg-[#F4C150] text-[#1F2937] px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10 shadow-[0_0_30px_rgba(244,193,80,0.1)] hover:bg-[#ffcf66] transition-colors">Abrir Canteiro</button>
                  </div>
                </div>
              </>,
              document.body
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
