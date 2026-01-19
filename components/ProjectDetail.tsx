
import React, { useState, useMemo, useEffect } from 'react';
import { Project, MaterialOrder, Client, OrderStatus } from '../types';

interface ProjectDetailProps {
  project: Project;
  client?: Client;
  orders: MaterialOrder[];
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
}

type PeriodFilter = '1week' | '15days' | 'all';

type SortConfig = {
  key: 'id' | 'items' | 'requestDate' | 'total' | 'status';
  direction: 'asc' | 'desc';
} | null;

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, client, orders, onBack, onViewOrder }) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'requestDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const calculateTotalOrderCost = (order: MaterialOrder) => {
    const selectedQuote = order.orderQuotes.find(q => q.isSelected);
    if (selectedQuote) return selectedQuote.totalPrice;
    
    // Se não houver selecionado, pega o mais barato para estimar o comprometido
    if (order.orderQuotes.length > 0) {
      return Math.min(...order.orderQuotes.map(q => q.totalPrice));
    }
    return 0;
  };

  const actualSpent = orders
    .filter(o => o.status === OrderStatus.APPROVED || o.status === OrderStatus.DELIVERED)
    .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);

  const pendingSpent = orders
    .filter(o => o.status !== OrderStatus.APPROVED && o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.REJECTED)
    .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);

  const budgetUsage = (actualSpent / project.budget) * 100;

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    let filtered = orders.filter(order => {
      // Filtro de período
      const orderDate = new Date(order.requestDate);
      let passesPeriodFilter = true;
      
      if (periodFilter === '1week') {
        passesPeriodFilter = orderDate >= oneWeekAgo;
      } else if (periodFilter === '15days') {
        passesPeriodFilter = orderDate >= fifteenDaysAgo;
      }
      
      // Filtro de status
      const passesStatusFilter = statusFilter === 'all' || order.status === statusFilter;
      
      // Filtro de pesquisa
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !order.id.toLowerCase().includes(searchLower) &&
          !order.status.toLowerCase().includes(searchLower) &&
          !order.items.some(item => item.name.toLowerCase().includes(searchLower)) &&
          !calculateTotalOrderCost(order).toString().includes(searchTerm)
        ) return false;
      }
      
      return passesPeriodFilter && passesStatusFilter;
    });

    // Ordenação
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'id') {
          aValue = a.id;
          bValue = b.id;
        } else if (sortConfig.key === 'items') {
          aValue = a.items.length;
          bValue = b.items.length;
        } else if (sortConfig.key === 'requestDate') {
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
        } else if (sortConfig.key === 'total') {
          aValue = calculateTotalOrderCost(a);
          bValue = calculateTotalOrderCost(b);
        } else if (sortConfig.key === 'status') {
          aValue = a.status;
          bValue = b.status;
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
  }, [orders, periodFilter, statusFilter, searchTerm, sortConfig]);

  // Paginação
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, statusFilter, searchTerm, itemsPerPage]);

  const requestSort = (key: 'id' | 'items' | 'requestDate' | 'total' | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: 'id' | 'items' | 'requestDate' | 'total' | 'status' }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <svg className="w-3 h-3 ml-1 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    ) : (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    );
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_QUOTES:
        return 'border-[#444] text-gray-500';
      case OrderStatus.READY_FOR_APPROVAL:
        return 'border-[#F4C150] text-[#F4C150]';
      case OrderStatus.APPROVED:
        return 'border-green-900/50 text-green-500 bg-green-500/5';
      case OrderStatus.REJECTED:
        return 'border-red-900/50 text-red-500 bg-red-500/5';
      case OrderStatus.DELIVERED:
        return 'border-blue-900/50 text-blue-500 bg-blue-500/5';
      default:
        return 'border-gray-500 text-gray-500';
    }
  };

  return (
    <div className="space-y-12 animate-subtle-fade text-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 border-b border-[#222222] pb-6 lg:pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <button 
            onClick={onBack}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#1A1A1A] border border-[#222222] flex items-center justify-center hover:border-[#F4C150] transition-all group shrink-0"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter uppercase break-words">{project.name}</h2>
              <span className={`text-[10px] font-black px-3 sm:px-4 py-1.5 uppercase tracking-widest rounded-full shrink-0 ${project.status === 'In Progress' ? 'bg-[#F4C150] text-black' : 'bg-[#222] text-gray-500'}`}>
                {project.status === 'In Progress' ? 'Em Execução' : 'Planejamento'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1 break-words">ID TÉCNICO: {project.id} • INÍCIO EM {new Date(project.startDate).toLocaleDateString()}</p>
            {client && (
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1 break-words">CLIENTE: {client.name.toUpperCase()} • EMAIL: {client.email} • TELEFONE: {client.phone}</p>
            )}
          </div>
        </div>
        <div className="text-left lg:text-right shrink-0">
           <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Status de Entrega</p>
           <div className="flex items-center gap-3">
              <div className="w-24 sm:w-32 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                 <div className="h-full bg-[#F4C150]" style={{ width: `${Math.min(budgetUsage, 100)}%` }}></div>
              </div>
              <span className="text-sm font-black tracking-tighter whitespace-nowrap">{budgetUsage.toFixed(1)}%</span>
           </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] min-w-0 flex flex-col">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 whitespace-nowrap shrink-0">Orçamento Alocado</p>
          <div className="min-h-[2rem] flex items-center overflow-x-auto hide-scrollbar">
            <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.5rem)' }}>R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] min-w-0 flex flex-col">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 whitespace-nowrap shrink-0">Investimento Realizado</p>
          <div className="min-h-[2rem] flex items-center overflow-x-auto hide-scrollbar">
            <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-[#F4C150] whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.5rem)' }}>R$ {actualSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] min-w-0 flex flex-col">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 whitespace-nowrap shrink-0">Comprometido / Pendente</p>
          <div className="min-h-[2rem] flex items-center overflow-x-auto hide-scrollbar">
            <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-blue-500 whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.5rem)' }}>R$ {pendingSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] min-w-0 flex flex-col">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 whitespace-nowrap shrink-0">Saldo Disponível</p>
          <div className="min-h-[2rem] flex items-center overflow-x-auto hide-scrollbar">
            <p className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-gray-400 whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.5rem)' }}>R$ {(project.budget - actualSpent - pendingSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Orders List */}
        <div className="space-y-8">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#222222] pb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Histórico de Pedidos</h3>
                <p className="text-xs text-[#F4C150] font-black uppercase tracking-[0.3em] mt-1">Gestão de requisições e aprovações</p>
              </div>
              <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-xs font-bold text-white focus:border-[#F4C150] outline-none"
                >
                  <option value="all">Todas as Informações</option>
                  <option value="15days">Últimos 15 Dias</option>
                  <option value="1week">Última Semana</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-xs font-bold text-white focus:border-[#F4C150] outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value={OrderStatus.PENDING_QUOTES}>Aguardando Cotações</option>
                  <option value={OrderStatus.READY_FOR_APPROVAL}>Pronto para Aprovação</option>
                  <option value={OrderStatus.APPROVED}>Aprovado</option>
                  <option value={OrderStatus.REJECTED}>Rejeitado</option>
                  <option value={OrderStatus.DELIVERED}>Entregue</option>
                </select>
                <span className="text-[10px] font-black bg-[#1A1A1A] px-4 py-2 rounded-lg border border-[#222] text-gray-500 uppercase">
                  {filteredOrders.length} Requisições
                </span>
              </div>
              <div className="relative group w-full sm:w-80">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#F4C150] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <input 
                  type="text" 
                  placeholder="PESQUISAR POR ID, STATUS, ITENS..."
                  className="w-full pl-12 pr-6 py-4 bg-[#161616] border border-[#222222] rounded-2xl text-[10px] font-black tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase placeholder:text-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
           </div>

           {/* Orders Table */}
           <div className="bg-[#161616] border border-[#222222] rounded-[2rem] overflow-hidden">
             <div className="overflow-x-auto custom-scroll">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead>
                   <tr className="border-b border-[#222222] bg-[#1a1a1a]/50">
                     <th 
                       className="px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                       onClick={() => requestSort('id')}
                     >
                       <div className="flex items-center">ID Pedido <SortIcon column="id" /></div>
                     </th>
                     <th 
                       className="px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                       onClick={() => requestSort('items')}
                     >
                       <div className="flex items-center">Itens <SortIcon column="items" /></div>
                     </th>
                     <th 
                       className="px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                       onClick={() => requestSort('requestDate')}
                     >
                       <div className="flex items-center">Data de Emissão <SortIcon column="requestDate" /></div>
                     </th>
                     <th 
                       className="px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap min-w-[120px] cursor-pointer hover:text-white transition-colors"
                       onClick={() => requestSort('total')}
                     >
                       <div className="flex items-center">Valor Total <SortIcon column="total" /></div>
                     </th>
                     <th 
                       className="px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                       onClick={() => requestSort('status')}
                     >
                       <div className="flex items-center">Status <SortIcon column="status" /></div>
                     </th>
                     <th className="px-4 md:px-6 lg:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 text-right whitespace-nowrap">Ações</th>
                   </tr>
                 </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="p-12 md:p-20 text-center opacity-30">
                         <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Nenhum pedido encontrado</p>
                       </td>
                     </tr>
                   ) : (
                     paginatedOrders.map(order => (
                       <tr key={order.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02] transition-colors group">
                         <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8">
                           <span className="text-[10px] md:text-xs font-black font-mono text-gray-400 whitespace-nowrap">#{order.id.split('-')[1]}</span>
                         </td>
                         <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8">
                           <p className="text-xs md:text-sm font-black uppercase whitespace-nowrap">{order.items.length} {order.items.length === 1 ? 'ITEM' : 'ITENS'}</p>
                         </td>
                         <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 whitespace-nowrap">
                           <p className="text-xs md:text-sm font-bold">
                             {new Date(order.requestDate).toLocaleDateString('pt-BR')}
                           </p>
                           <p className="text-[8px] md:text-[9px] text-gray-600 uppercase mt-1">
                             {new Date(order.requestDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                           </p>
                         </td>
                         <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 min-w-[120px]">
                          <p className={`text-[10px] md:text-xs font-black break-words overflow-wrap-anywhere ${order.orderQuotes.length === 0 ? 'text-gray-600 italic' : 'text-white'}`}>
                            {order.orderQuotes.length === 0 ? 'EM COTAÇÃO' : `R$ ${calculateTotalOrderCost(order).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </p>
                         </td>
                         <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 whitespace-nowrap">
                           <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full border whitespace-nowrap inline-block ${getStatusColor(order.status)}`}>
                             {order.status}
                           </span>
                         </td>
                         <td className="px-4 md:px-6 lg:px-10 py-6 md:py-8 text-right whitespace-nowrap">
                           <div className="flex items-center justify-end gap-2 md:gap-3">
                             <button 
                               onClick={() => onViewOrder(order.id)}
                               className="p-2.5 md:p-3 bg-[#1A1A1A] border border-[#222222] rounded-xl text-gray-400 hover:text-white hover:border-white transition-all shrink-0"
                               title="Ver Detalhes"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"></path>
                                 <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"></path>
                               </svg>
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))
                   )}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div className="bg-[#1a1a1a]/30 px-6 md:px-8 py-4 md:py-6 border-t border-[#222] flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Exibir:</span>
            <select 
              className="bg-[#121212] border border-[#222] text-[10px] font-black text-white px-2 py-1 rounded-lg outline-none focus:border-[#F4C150]"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
              Total: {filteredOrders.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-[#1A1A1A] border border-[#222] rounded-xl text-gray-500 hover:text-white disabled:opacity-20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
            <span className="px-4 py-2 bg-[#1A1A1A] border border-[#F4C150]/20 rounded-xl text-[10px] font-black text-[#F4C150]">
              PÁGINA {currentPage} DE {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 bg-[#1A1A1A] border border-[#222] rounded-xl text-gray-500 hover:text-white disabled:opacity-20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </button>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
