
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AccountPayable, Project, Supplier, PaymentStatus, PaymentMethod, TransactionCategory } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AccountsPayableProps {
  accountsPayable: AccountPayable[];
  projects: Project[];
  suppliers: Supplier[];
  onUpdate: (account: AccountPayable) => void;
  onCreate: (account: AccountPayable) => void;
}

type SortConfig = {
  key: keyof AccountPayable | 'supplierName' | 'projectName';
  direction: 'asc' | 'desc';
} | null;

const AccountsPayable: React.FC<AccountsPayableProps> = ({
  accountsPayable,
  projects,
  suppliers,
  onUpdate,
  onCreate
}) => {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newAccount, setNewAccount] = useState<Partial<AccountPayable>>({
    projectId: '',
    supplierId: '',
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    status: PaymentStatus.PENDING,
    category: 'Materiais',
    createdAt: new Date().toISOString(),
    createdBy: 'Felipe Paiva'
  });

  const [paymentData, setPaymentData] = useState<{
    paymentDate: string;
    paymentMethod: PaymentMethod;
  }>({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'PIX'
  });

  const filteredAccounts = useMemo(() => {
    let filtered = accountsPayable.filter(account => {
      if (filterStatus !== 'all' && account.status !== filterStatus) return false;
      if (filterProject !== 'all' && account.projectId !== filterProject) return false;
      if (filterSupplier !== 'all' && account.supplierId !== filterSupplier) return false;
      
      if (searchTerm) {
        const supplier = suppliers.find(s => s.id === account.supplierId);
        const project = projects.find(p => p.id === account.projectId);
        const searchLower = searchTerm.toLowerCase();
        if (
          !account.description.toLowerCase().includes(searchLower) &&
          !account.amount.toString().includes(searchTerm) &&
          !(supplier?.name.toLowerCase().includes(searchLower)) &&
          !(project?.name.toLowerCase().includes(searchLower)) &&
          !account.id.toLowerCase().includes(searchLower)
        ) return false;
      }
      
      return true;
    });

    // Ordenação
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'supplierName') {
          const supplierA = suppliers.find(s => s.id === a.supplierId);
          const supplierB = suppliers.find(s => s.id === b.supplierId);
          aValue = supplierA?.name || '';
          bValue = supplierB?.name || '';
        } else if (sortConfig.key === 'projectName') {
          const projectA = projects.find(p => p.id === a.projectId);
          const projectB = projects.find(p => p.id === b.projectId);
          aValue = projectA?.name || '';
          bValue = projectB?.name || '';
        } else {
          aValue = a[sortConfig.key as keyof AccountPayable] ?? '';
          bValue = b[sortConfig.key as keyof AccountPayable] ?? '';
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        } else {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [accountsPayable, filterStatus, filterProject, filterSupplier, searchTerm, sortConfig, suppliers, projects]);

  // Paginação
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterProject, filterSupplier, searchTerm, itemsPerPage]);

  const requestSort = (key: keyof AccountPayable | 'supplierName' | 'projectName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof AccountPayable | 'supplierName' | 'projectName' }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <svg className={`w-3 h-3 ml-1 ${theme === 'dark' ? 'opacity-20' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    ) : (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    );
  };

  const handleCreateAccount = () => {
    if (!newAccount.projectId || !newAccount.supplierId || !newAccount.description || !newAccount.amount) return;
    
    const accountToCreate: AccountPayable = {
      ...newAccount as AccountPayable,
      id: `AP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    onCreate(accountToCreate);
    setShowForm(false);
    setNewAccount({
      projectId: '',
      supplierId: '',
      description: '',
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      status: PaymentStatus.PENDING,
      category: 'Materiais',
      createdAt: new Date().toISOString(),
      createdBy: 'Felipe Paiva'
    });
  };

  const handleMarkAsPaid = (accountId: string) => {
    const account = accountsPayable.find(a => a.id === accountId);
    if (!account) return;
    
    onUpdate({
      ...account,
      status: PaymentStatus.PAID,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod
    });
    
    setShowPaymentModal(null);
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'PIX'
    });
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return theme === 'dark' ? 'border-[#F4C150] text-[#F4C150] bg-[#F4C150]/5' : 'border-[#F4C150] text-[#F4C150] bg-[#F4C150]/10';
      case PaymentStatus.PAID:
        return theme === 'dark' ? 'border-green-500 text-green-500 bg-green-500/5' : 'border-green-500 text-green-600 bg-green-50';
      case PaymentStatus.OVERDUE:
        return theme === 'dark' ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-red-500 text-red-600 bg-red-50';
      case PaymentStatus.CANCELLED:
        return theme === 'dark' ? 'border-gray-600 text-gray-600 bg-gray-600/5' : 'border-[#D1D5DB] text-[#6B7280] bg-[#F2F3F5]';
      default:
        return theme === 'dark' ? 'border-gray-500 text-gray-500' : 'border-[#D1D5DB] text-[#6B7280]';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !accountsPayable.find(a => a.dueDate === dueDate)?.paymentDate;
  };

  const stats = useMemo(() => {
    const pending = accountsPayable.filter(a => a.status === PaymentStatus.PENDING).length;
    const paid = accountsPayable.filter(a => a.status === PaymentStatus.PAID).length;
    const overdue = accountsPayable.filter(a => a.status === PaymentStatus.OVERDUE || isOverdue(a.dueDate)).length;
    const totalPending = accountsPayable
      .filter(a => a.status === PaymentStatus.PENDING)
      .reduce((acc, a) => acc + a.amount, 0);
    const totalPaid = accountsPayable
      .filter(a => a.status === PaymentStatus.PAID)
      .reduce((acc, a) => acc + a.amount, 0);

    return { pending, paid, overdue, totalPending, totalPaid };
  }, [accountsPayable]);

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Pendentes</p>
          <p className="text-3xl font-black tracking-tighter text-[#F4C150]">{stats.pending}</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Pagas</p>
          <p className="text-3xl font-black tracking-tighter text-green-500">{stats.paid}</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Vencidas</p>
          <p className="text-3xl font-black tracking-tighter text-red-500">{stats.overdue}</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Total Pendente</p>
          <p className={`text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>R$ {(stats.totalPending / 1000).toFixed(0)}k</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Total Pago</p>
          <p className="text-2xl font-black tracking-tighter text-green-500">R$ {(stats.totalPaid / 1000).toFixed(0)}k</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className={`flex flex-col gap-4 border-b pb-6 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex flex-wrap gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'all')}
              className={`px-4 py-2 border rounded-xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
            >
              <option value="all">Todos os Status</option>
              <option value={PaymentStatus.PENDING}>Pendente</option>
              <option value={PaymentStatus.PAID}>Pago</option>
              <option value={PaymentStatus.OVERDUE}>Vencido</option>
              <option value={PaymentStatus.CANCELLED}>Cancelado</option>
            </select>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className={`px-4 py-2 border rounded-xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
            >
              <option value="all">Todas as Obras</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className={`px-4 py-2 border rounded-xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
            >
              <option value="all">Todos os Fornecedores</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#F4C150] text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#ffcf66] transition-all"
          >
            + Nova Conta
          </button>
        </div>
        <div className="relative group w-full">
          <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-[#F4C150] transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-[#9CA3AF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          <input 
            type="text" 
            placeholder="PESQUISAR POR DESCRIÇÃO, FORNECEDOR, OBRA..."
            className={`w-full pl-12 pr-6 py-4 border rounded-2xl text-[10px] font-black tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white placeholder:text-gray-700' : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className={`border rounded-[2rem] overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-[#222222] bg-[#1a1a1a]/50' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('supplierName')}
                >
                  <div className="flex items-center">Fornecedor <SortIcon column="supplierName" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('projectName')}
                >
                  <div className="flex items-center">Obra <SortIcon column="projectName" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('description')}
                >
                  <div className="flex items-center">Descrição <SortIcon column="description" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('amount')}
                >
                  <div className="flex items-center">Valor <SortIcon column="amount" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('dueDate')}
                >
                  <div className="flex items-center">Vencimento <SortIcon column="dueDate" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">Status <SortIcon column="status" /></div>
                </th>
                <th className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Ações</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-y divide-[#1A1A1A]' : 'divide-y divide-[#E5E7EB]'}>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`p-12 md:p-20 text-center ${theme === 'dark' ? 'opacity-30' : 'opacity-40'}`}>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-white' : 'text-[#6B7280]'}`}>Nenhuma conta encontrada</p>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((account, index) => {
                  const supplier = suppliers.find(s => s.id === account.supplierId);
                  const project = projects.find(p => p.id === account.projectId);
                  const overdue = isOverdue(account.dueDate) && account.status === PaymentStatus.PENDING;
                  
                  return (
                    <tr key={account.id} className={`transition-colors group ${theme === 'dark' ? 'border-b border-[#1A1A1A] hover:bg-white/[0.02]' : index % 2 === 0 ? 'bg-white hover:bg-[#F8F9FA]' : 'bg-[#F8F9FA] hover:bg-[#F2F3F5]'}`}>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-black uppercase truncate max-w-[150px] ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{supplier?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-bold uppercase truncate max-w-[150px] ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{project?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-bold truncate max-w-[200px] ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{account.description}</p>
                        <p className={`text-[8px] md:text-[9px] uppercase mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>{account.category}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-bold ${overdue ? 'text-red-500' : (theme === 'dark' ? 'text-white' : 'text-[#1F2937]')}`}>
                          {new Date(account.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full border ${getStatusColor(account.status)}`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {account.status === PaymentStatus.PENDING && (
                            <button
                              onClick={() => setShowPaymentModal(account.id)}
                              className={`p-2 border rounded-xl transition-all ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-gray-400 hover:text-green-500 hover:border-green-500' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-green-500 hover:border-green-500'}`}
                              title="Marcar como Pago"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div className={`px-6 md:px-8 py-4 md:py-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/30 border-[#222]' : 'bg-[#F8F9FA] border-[#E5E7EB]'}`}>
          <div className="flex items-center gap-4">
            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Exibir:</span>
            <select 
              className={`border text-[10px] font-black px-2 py-1 rounded-lg outline-none focus:border-[#F4C150] ${theme === 'dark' ? 'bg-[#121212] border-[#222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>
              Total: {filteredAccounts.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 border rounded-xl transition-all disabled:opacity-20 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222] text-gray-500 hover:text-white' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:border-[#D1D5DB]'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
            <span className={`px-4 py-2 border border-[#F4C150]/20 rounded-xl text-[10px] font-black text-[#F4C150] ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
              PÁGINA {currentPage} DE {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 border rounded-xl transition-all disabled:opacity-20 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222] text-gray-500 hover:text-white' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:border-[#D1D5DB]'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {showForm && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`fixed backdrop-blur-xl z-[9999] ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }} 
            onClick={() => setShowForm(false)}
          ></div>
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-[3rem] border shadow-2xl overflow-y-auto max-h-[90vh] z-[10000] ${theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`} style={{ animation: 'fadeInModal 0.3s ease-out' }}>
            <div className={`p-10 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <div>
                <h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Nova Conta a Pagar</h3>
                <p className="text-[10px] text-[#F4C150] font-black uppercase tracking-widest">Registro Manual</p>
              </div>
              <button onClick={() => setShowForm(false)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1A1A1A] text-white hover:text-[#F4C150]' : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#F4C150] hover:border-[#D1D5DB]'}`}>✕</button>
            </div>
            <div className={`p-10 space-y-8 ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Obra</label>
                  <select
                    className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={newAccount.projectId}
                    onChange={(e) => setNewAccount({...newAccount, projectId: e.target.value})}
                  >
                    <option value="">SELECIONAR OBRA</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Fornecedor</label>
                  <select
                    className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={newAccount.supplierId}
                    onChange={(e) => setNewAccount({...newAccount, supplierId: e.target.value})}
                  >
                    <option value="">SELECIONAR FORNECEDOR</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Descrição</label>
                <input
                  type="text"
                  placeholder="EX: COMPRA DE MATERIAIS PARA OBRA"
                  className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={newAccount.amount || ''}
                    onChange={(e) => setNewAccount({...newAccount, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Vencimento</label>
                  <input
                    type="date"
                    className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={newAccount.dueDate}
                    onChange={(e) => setNewAccount({...newAccount, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Categoria</label>
                  <select
                    className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={newAccount.category}
                    onChange={(e) => setNewAccount({...newAccount, category: e.target.value as TransactionCategory})}
                  >
                    <option value="Materiais">MATERIAIS</option>
                    <option value="Serviços">SERVIÇOS</option>
                    <option value="Administrativo">ADMINISTRATIVO</option>
                    <option value="Mão de Obra">MÃO DE OBRA</option>
                    <option value="Equipamentos">EQUIPAMENTOS</option>
                    <option value="Outros">OUTROS</option>
                  </select>
                </div>
              </div>
            </div>
            <div className={`p-10 border-t flex justify-end gap-6 ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <button onClick={() => setShowForm(false)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>Cancelar</button>
              <button
                onClick={handleCreateAccount}
                disabled={!newAccount.projectId || !newAccount.supplierId || !newAccount.description || !newAccount.amount}
                className={`px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10 transition-colors ${theme === 'dark' ? 'bg-[#F4C150] text-black hover:bg-[#ffcf66]' : 'bg-[#F4C150] text-[#1F2937] hover:bg-[#ffcf66]'}`}
              >
                Criar Conta
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Payment Modal */}
      {showPaymentModal && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`fixed backdrop-blur-xl z-[9999] ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }} 
            onClick={() => setShowPaymentModal(null)}
          ></div>
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-[3rem] border shadow-2xl z-[10000] ${theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`} style={{ animation: 'fadeInModal 0.3s ease-out' }}>
            <div className={`p-10 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <div>
                <h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Registrar Pagamento</h3>
                <p className="text-[10px] text-[#F4C150] font-black uppercase tracking-widest">Confirmação de Pagamento</p>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1A1A1A] text-white hover:text-[#F4C150]' : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#F4C150] hover:border-[#D1D5DB]'}`}>✕</button>
            </div>
            <div className={`p-10 space-y-8 ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Data do Pagamento</label>
                <input
                  type="date"
                  className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Método de Pagamento</label>
                <select
                  className={`w-full p-5 border rounded-2xl text-xs font-bold focus:border-[#F4C150] outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value as PaymentMethod})}
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">BOLETO BANCÁRIO</option>
                  <option value="Cartão Crédito">CARTÃO DE CRÉDITO</option>
                  <option value="Cartão Débito">CARTÃO DE DÉBITO</option>
                </select>
              </div>
            </div>
            <div className={`p-10 border-t flex justify-end gap-6 ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <button onClick={() => setShowPaymentModal(null)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>Cancelar</button>
              <button
                onClick={() => handleMarkAsPaid(showPaymentModal)}
                className="bg-green-500 text-white px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-green-600 transition-colors"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default AccountsPayable;
