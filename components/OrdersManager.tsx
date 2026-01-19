
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MaterialOrder, Project, MaterialItem, OrderStatus, Supplier, OrderQuote, PaymentMethod, ItemQuoteEntry } from '../types';
import { classifyMaterial } from '../services/gemini';
import { Icons } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface OrdersManagerProps {
  orders: MaterialOrder[];
  projects: Project[];
  suppliers: Supplier[];
  onUpdateOrder: (order: MaterialOrder) => void;
  onCreateOrder: (order: MaterialOrder) => void;
  viewingOrderId: string | null;
  setViewingOrderId: (id: string | null) => void;
  onApproveOrder?: (order: MaterialOrder) => void;
}

type SortConfig = {
  key: 'projectName' | 'id' | 'total' | 'status' | 'requestDate';
  direction: 'asc' | 'desc';
} | null;

const OrdersManager: React.FC<OrdersManagerProps> = ({ 
  orders, 
  projects, 
  suppliers, 
  onUpdateOrder, 
  onCreateOrder,
  viewingOrderId,
  setViewingOrderId,
  onApproveOrder
}) => {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'requestDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [newOrder, setNewOrder] = useState<Partial<MaterialOrder>>({
    projectId: '',
    items: [],
    status: OrderStatus.PENDING_QUOTES,
    requestDate: new Date().toISOString(),
    orderQuotes: []
  });

  const [newItem, setNewItem] = useState<Partial<MaterialItem>>({ name: '', quantity: 1, unit: 'un' });
  const [isClassifying, setIsClassifying] = useState(false);

  // Estado para o formulário de Nova Proposta
  const [quoteFormData, setQuoteFormData] = useState<{
    supplierId: string;
    deliveryDays: number;
    isFreightIncluded: boolean;
    freightCost: number;
    billingTerms: string;
    itemPrices: Record<string, number>;
  }>({
    supplierId: '',
    deliveryDays: 0,
    isFreightIncluded: true,
    freightCost: 0,
    billingTerms: '',
    itemPrices: {}
  });

  const orderInProgress = useMemo(() => orders.find(o => o.id === viewingOrderId), [orders, viewingOrderId]);

  const calculateTotalOrderCost = (order: MaterialOrder) => {
    const selectedQuote = order.orderQuotes.find(q => q.isSelected);
    if (selectedQuote) return selectedQuote.totalPrice;
    
    if (order.orderQuotes.length > 0) {
      return Math.min(...order.orderQuotes.map(q => q.totalPrice));
    }
    return 0;
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      if (searchTerm) {
        const project = projects.find(p => p.id === order.projectId);
        const searchLower = searchTerm.toLowerCase();
        if (
          !order.id.toLowerCase().includes(searchLower) &&
          !(project?.name.toLowerCase().includes(searchLower)) &&
          !order.status.toLowerCase().includes(searchLower) &&
          !order.items.some(item => item.name.toLowerCase().includes(searchLower))
        ) return false;
      }
      return true;
    });

    // Ordenação
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'projectName') {
          const projectA = projects.find(p => p.id === a.projectId);
          const projectB = projects.find(p => p.id === b.projectId);
          aValue = projectA?.name || '';
          bValue = projectB?.name || '';
        } else if (sortConfig.key === 'id') {
          aValue = a.id;
          bValue = b.id;
        } else if (sortConfig.key === 'total') {
          aValue = calculateTotalOrderCost(a);
          bValue = calculateTotalOrderCost(b);
        } else if (sortConfig.key === 'status') {
          aValue = a.status;
          bValue = b.status;
        } else if (sortConfig.key === 'requestDate') {
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
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
  }, [orders, searchTerm, sortConfig, projects]);

  // Paginação
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const requestSort = (key: 'projectName' | 'id' | 'total' | 'status' | 'requestDate') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: 'projectName' | 'id' | 'total' | 'status' | 'requestDate' }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <svg className={`w-3 h-3 ml-1 ${theme === 'dark' ? 'opacity-20' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    ) : (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    );
  };

  const handleAddItem = async () => {
    if (!newItem.name) return;
    setIsClassifying(true);
    const aiData = await classifyMaterial(newItem.name);
    const item: MaterialItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      quantity: newItem.quantity || 1,
      unit: aiData.unit,
      category: aiData.category
    };
    setNewOrder(prev => ({ ...prev, items: [...(prev.items || []), item] }));
    setNewItem({ name: '', quantity: 1, unit: 'un' });
    setIsClassifying(false);
  };

  const handleSaveOrder = () => {
    if (!newOrder.projectId || !newOrder.items?.length) return;
    const orderToSave: MaterialOrder = {
      ...(newOrder as MaterialOrder),
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      requestDate: new Date().toISOString(),
      requestedBy: 'Felipe Paiva',
      orderQuotes: []
    };
    onCreateOrder(orderToSave);
    setShowForm(false);
  };

  const handleOpenQuoteForm = () => {
    if (!orderInProgress) return;
    // Inicializa os preços dos itens com 0
    const initialPrices: Record<string, number> = {};
    orderInProgress.items.forEach(item => {
      initialPrices[item.id] = 0;
    });
    setQuoteFormData({
      supplierId: '',
      deliveryDays: 1,
      isFreightIncluded: true,
      freightCost: 0,
      billingTerms: 'Faturamento 28 dias',
      itemPrices: initialPrices
    });
    setShowQuoteForm(true);
  };

  const handleSaveQuote = () => {
    if (!orderInProgress || !quoteFormData.supplierId) return;

    const itemsSubtotal = orderInProgress.items.reduce((acc, item) => {
      const price = quoteFormData.itemPrices[item.id] || 0;
      return acc + (price * item.quantity);
    }, 0);

    const finalTotal = itemsSubtotal + (quoteFormData.isFreightIncluded ? 0 : quoteFormData.freightCost);

    // Fix: Explicitly cast Object.entries to [string, number][] to avoid type incompatibility with ItemQuoteEntry.
    const itemQuoteEntries: ItemQuoteEntry[] = (Object.entries(quoteFormData.itemPrices) as [string, number][]).map(([itemId, unitPrice]) => ({
      itemId,
      unitPrice
    }));

    const newQuote: OrderQuote = {
      id: Math.random().toString(36).substr(2, 9),
      supplierId: quoteFormData.supplierId,
      totalPrice: finalTotal,
      deliveryDays: quoteFormData.deliveryDays,
      isSelected: false,
      isFreightIncluded: quoteFormData.isFreightIncluded,
      freightCost: quoteFormData.freightCost,
      billingTerms: quoteFormData.billingTerms,
      itemPrices: itemQuoteEntries
    };

    const updatedQuotes = [...orderInProgress.orderQuotes, newQuote];
    onUpdateOrder({
      ...orderInProgress,
      orderQuotes: updatedQuotes,
      status: updatedQuotes.length >= 3 ? OrderStatus.READY_FOR_APPROVAL : OrderStatus.PENDING_QUOTES
    });
    setShowQuoteForm(false);
  };

  const handleSelectQuote = (orderId: string, quoteId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === OrderStatus.APPROVED) return;
    
    const updatedQuotes = order.orderQuotes.map(q => ({
      ...q,
      isSelected: q.id === quoteId
    }));
    
    onUpdateOrder({ ...order, orderQuotes: updatedQuotes });
  };

  const handleUpdateQuoteDetails = (orderId: string, quoteId: string, field: 'paymentMethod' | 'observations', value: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === OrderStatus.APPROVED) return;
    
    const updatedQuotes = order.orderQuotes.map(q => 
      q.id === quoteId ? { ...q, [field]: value } : q
    );
    
    onUpdateOrder({ ...order, orderQuotes: updatedQuotes });
  };

  const handleApproveOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.orderQuotes.some(q => q.isSelected)) {
      const minPrice = Math.min(...order.orderQuotes.map(q => q.totalPrice));
      const minIdx = order.orderQuotes.findIndex(q => q.totalPrice === minPrice);
      order.orderQuotes[minIdx].isSelected = true;
    }
    
    const approvedOrder = { ...order, status: OrderStatus.APPROVED };
    onUpdateOrder(approvedOrder);
    
    // Chamar callback para criar conta a pagar automaticamente
    if (onApproveOrder) {
      onApproveOrder(approvedOrder);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    onUpdateOrder({ ...order, status: OrderStatus.REJECTED });
  };

  if (viewingOrderId) {
    const order = orders.find(o => o.id === viewingOrderId);
    const project = projects.find(p => p.id === order?.projectId);
    const selectedQuote = order?.orderQuotes.find(q => q.isSelected);
    const isApproved = order?.status === OrderStatus.APPROVED;
    
    if (!order) return null;

    return (
      <div className={`space-y-8 md:space-y-12 animate-subtle-fade ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
        <div className={`flex items-center gap-4 md:gap-6 border-b pb-6 md:pb-8 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
          <button 
            onClick={() => setViewingOrderId(null)}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl border flex items-center justify-center hover:border-[#F4C150] transition-all group shrink-0 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}
          >
            <svg className={`w-5 h-5 group-hover:text-[#F4C150] ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className={`text-xl md:text-2xl font-black tracking-tighter uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Requisição #{order.id.split('-')[1]}</h2>
            <p className={`text-[10px] md:text-xs font-medium truncate ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>
              {isApproved ? 'Pedido Aprovado e Finalizado' : 'Análise de propostas comerciais por lote'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
           {/* Lado Esquerdo: Itens do Pedido */}
           <div className="lg:col-span-1 space-y-4 md:space-y-6">
              <div className={`border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                 <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#F4C150] mb-6 md:mb-8">Itens Solicitados</h3>
                 <div className="space-y-3">
                    {order.items.map(item => (
                      <div key={item.id} className={`p-3 md:p-4 border rounded-xl flex justify-between items-center ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-[#F8F9FA] border-[#E5E7EB]'}`}>
                         <div className="min-w-0">
                            <p className={`text-xs font-black uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{item.name}</p>
                            <p className={`text-[8px] md:text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>{item.category}</p>
                         </div>
                         <div className="text-right shrink-0">
                            <p className="text-xs font-black text-[#F4C150]">{item.quantity} {item.unit}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className={`border rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                 <p className={`text-[9px] md:text-[10px] font-black uppercase mb-1 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Responsável</p>
                 <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0 ${theme === 'dark' ? 'bg-[#222] border-[#333] text-white' : 'bg-[#F4C150] border-[#F4C150] text-black'}`}>FP</div>
                    <span className={`text-xs font-bold uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{order.requestedBy}</span>
                 </div>
              </div>
           </div>

           {/* Lado Direito: Cotações Globais */}
           <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                 <div>
                    <h3 className={`text-lg md:text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Propostas Comerciais</h3>
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Comparativo de orçamento completo</p>
                 </div>
                 {!isApproved && (
                   <button 
                      onClick={handleOpenQuoteForm}
                      className="w-full sm:w-auto text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white text-black px-6 md:px-8 py-3 rounded-xl hover:bg-[#F4C150] transition-all"
                   >
                      + Nova Proposta
                   </button>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 {order.orderQuotes.map((quote, i) => {
                    const supplier = suppliers.find(s => s.id === quote.supplierId);
                    // Em um pedido aprovado, apenas mostramos a proposta selecionada (ou todas, mas visualmente desativadas)
                    if (isApproved && !quote.isSelected) return null;

                    return (
                      <div 
                        key={quote.id} 
                        onClick={() => !isApproved && handleSelectQuote(order.id, quote.id)}
                        className={`p-6 md:p-8 transition-all rounded-[2rem] md:rounded-[2.5rem] border-2 flex flex-col justify-between ${
                          quote.isSelected 
                            ? 'border-[#F4C150] bg-[#F4C150]/5 shadow-[0_0_40px_rgba(244,193,80,0.1)]' 
                            : (theme === 'dark' ? 'border-[#222222] bg-[#161616]' : 'border-[#E5E7EB] bg-white')
                        } ${!isApproved ? 'cursor-pointer hover:border-gray-700' : ''}`}
                      >
                         <div className="flex justify-between items-start mb-8 md:mb-12">
                            <div className="flex flex-col min-w-0">
                               <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-600' : 'text-[#9CA3AF]'}`}>Cotação 0{i+1}</span>
                               <p className={`text-base md:text-lg font-black uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{supplier?.name}</p>
                            </div>
                            {quote.isSelected && <div className="w-4 h-4 bg-[#F4C150] rounded-full shrink-0 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"></path></svg></div>}
                         </div>

                         <div className="space-y-6 md:space-y-8">
                            <div className="flex justify-between items-end">
                               <div>
                                  <p className={`text-[9px] md:text-[10px] font-black uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Valor do Pacote</p>
                                  <p className={`text-2xl md:text-3xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>R$ {quote.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                               </div>
                               <div className="text-right">
                                  <p className={`text-[9px] md:text-[10px] font-black uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Lead Time</p>
                                  <p className={`text-base md:text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{quote.deliveryDays} DIAS</p>
                               </div>
                            </div>
                            
                            <div className={`pt-4 md:pt-6 border-t flex flex-col gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'border-[#1A1A1A]' : 'border-[#E5E7EB]'}`}>
                               <div className="flex justify-between">
                                  <span className={theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}>Frete: {quote.isFreightIncluded ? 'Incluso' : `R$ ${quote.freightCost?.toLocaleString()}`}</span>
                                  <span className="text-[#F4C150]">{quote.billingTerms}</span>
                               </div>
                               {isApproved && quote.paymentMethod && (
                                 <div className={`flex justify-between border-t pt-2 mt-2 ${theme === 'dark' ? 'border-[#222]' : 'border-[#E5E7EB]'}`}>
                                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}>Pagamento:</span>
                                    <span className={theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}>{quote.paymentMethod}</span>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    );
                 })}

                 {/* Skeleton completion só se não aprovado */}
                 {!isApproved && [...Array(Math.max(0, 3 - order.orderQuotes.length))].map((_, i) => (
                    <div key={i} className={`p-8 md:p-12 border-2 border-dashed rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
                       <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-[#9CA3AF]'}`}>Aguardando Proposta {order.orderQuotes.length + i + 1}</p>
                    </div>
                 ))}
              </div>

              {/* Detalhes do Fechamento (Aparece ao selecionar e se NÃO aprovado) */}
              {selectedQuote && !isApproved && (
                <div className={`border rounded-[2rem] p-6 md:p-10 space-y-8 animate-subtle-fade shadow-sm ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest text-[#F4C150]">Detalhes do Acordo Comercial</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Método de Pagamento</label>
                         <select 
                            className={`w-full p-5 border rounded-2xl text-xs font-bold tracking-widest focus:border-[#F4C150] outline-none transition-all uppercase ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                            value={selectedQuote.paymentMethod || ''}
                            onChange={(e) => handleUpdateQuoteDetails(order.id, selectedQuote.id, 'paymentMethod', e.target.value)}
                         >
                            <option value="">SELECIONAR MÉTODO</option>
                            <option value="PIX">PIX (À Vista)</option>
                            <option value="Boleto">Boleto Bancário</option>
                            <option value="Cartão Crédito">Cartão de Crédito</option>
                            <option value="Cartão Débito">Cartão de Débito</option>
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Observações do Lote</label>
                         <textarea 
                            placeholder="EX: ENTREGA NO PORTÃO 2, DESCARGA POR CONTA DO FORNECEDOR..."
                            className={`w-full p-5 border rounded-2xl text-xs font-bold tracking-widest focus:border-[#F4C150] outline-none transition-all uppercase min-h-[100px] resize-none ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
                            value={selectedQuote.observations || ''}
                            onChange={(e) => handleUpdateQuoteDetails(order.id, selectedQuote.id, 'observations', e.target.value)}
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* Se estiver aprovado, mostrar resumo fixo do fechamento */}
              {isApproved && selectedQuote && (
                <div className={`border rounded-[2rem] p-6 md:p-10 space-y-6 shadow-sm ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest text-green-500">Contrato Fechado</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-2">
                         <p className={`font-bold uppercase tracking-widest text-[9px] ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Método Definido</p>
                         <p className={`font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{selectedQuote.paymentMethod}</p>
                      </div>
                      <div className="space-y-2">
                         <p className={`font-bold uppercase tracking-widest text-[9px] ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Faturamento</p>
                         <p className={`font-black ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{selectedQuote.billingTerms}</p>
                      </div>
                      <div className={`md:col-span-2 space-y-2 pt-4 border-t ${theme === 'dark' ? 'border-[#222]' : 'border-[#E5E7EB]'}`}>
                         <p className={`font-bold uppercase tracking-widest text-[9px] ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Observações Técnicas</p>
                         <p className={`italic ${theme === 'dark' ? 'text-gray-300' : 'text-[#6B7280]'}`}>{selectedQuote.observations || 'Nenhuma observação registrada.'}</p>
                      </div>
                   </div>
                </div>
              )}

              {/* Approval Actions só se NÃO aprovado */}
              {!isApproved && (
                <div className={`pt-8 md:pt-12 border-t flex flex-col sm:flex-row justify-between items-center gap-6 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
                  <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${order.orderQuotes.length >= 3 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>
                        {order.orderQuotes.length}/3 Cotações Coletadas
                      </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => handleRejectOrder(order.id)}
                        className="w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        Reprovar
                      </button>
                      <button 
                        onClick={() => handleApproveOrder(order.id)}
                        disabled={order.orderQuotes.length < 3 || !selectedQuote || !selectedQuote.paymentMethod}
                        className={`w-full sm:w-auto px-8 md:px-12 py-3.5 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-2xl disabled:opacity-20 transition-all shadow-[0_0_40px_rgba(244,193,80,0.1)] ${theme === 'dark' ? 'bg-[#F4C150] text-black' : 'bg-[#F4C150] text-[#1F2937]'}`}
                      >
                        {!selectedQuote?.paymentMethod ? 'Selecione o Pagamento' : 'Aprovar Pedido Completo'}
                      </button>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Modal para Nova Proposta Detalhada */}
        {showQuoteForm && typeof document !== 'undefined' && createPortal(
          <>
            <div 
              className={`fixed backdrop-blur-xl z-[9999] ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }} 
              onClick={() => setShowQuoteForm(false)}
            ></div>
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl rounded-[2.5rem] border shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col z-[10000] ${theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`} style={{ animation: 'fadeInModal 0.3s ease-out' }}>
              <div className={`p-6 md:p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                <div>
                  <h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Inserir Nova Proposta</h3>
                  <p className="text-[9px] text-[#F4C150] font-bold uppercase tracking-widest">Detalhamento Comercial por Fornecedor</p>
                </div>
                <button onClick={() => setShowQuoteForm(false)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1A1A1A] text-white hover:text-[#F4C150]' : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#F4C150] hover:border-[#D1D5DB]'}`}>✕</button>
              </div>
              
              <div className={`p-6 md:p-8 space-y-8 flex-1 overflow-y-auto custom-scroll ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Fornecedor</label>
                    <select 
                      className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none focus:border-[#F4C150] uppercase transition-all ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                      value={quoteFormData.supplierId}
                      onChange={(e) => setQuoteFormData({...quoteFormData, supplierId: e.target.value})}
                    >
                      <option value="">SELECIONAR PARCEIRO</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Prazo Entrega (Dias)</label>
                    <input 
                      type="number"
                      className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none focus:border-[#F4C150] ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                      value={quoteFormData.deliveryDays}
                      onChange={(e) => setQuoteFormData({...quoteFormData, deliveryDays: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Faturamento</label>
                    <input 
                      type="text"
                      className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none focus:border-[#F4C150] uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                      value={quoteFormData.billingTerms}
                      onChange={(e) => setQuoteFormData({...quoteFormData, billingTerms: e.target.value})}
                    />
                  </div>
                </div>

                <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-[#F8F9FA] border-[#E5E7EB]'}`}>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F4C150]">Valores Unitários por Item</h4>
                  <div className="space-y-3">
                    {orderInProgress?.items.map(item => (
                      <div key={item.id} className={`grid grid-cols-2 sm:grid-cols-4 items-center gap-4 p-3 border rounded-2xl ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                        <div className="col-span-2">
                          <p className={`text-xs font-black uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{item.name}</p>
                          <p className={`text-[9px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>{item.quantity} {item.unit}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-3">
                          <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-600' : 'text-[#9CA3AF]'}`}>R$</span>
                          <input 
                            type="number"
                            placeholder="PREÇO UNIT"
                            className={`w-full p-3 border rounded-xl text-xs font-black outline-none focus:border-[#F4C150] ${theme === 'dark' ? 'bg-[#121212] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                            value={quoteFormData.itemPrices[item.id] || ''}
                            onChange={(e) => setQuoteFormData({
                              ...quoteFormData, 
                              itemPrices: { ...quoteFormData.itemPrices, [item.id]: Number(e.target.value) }
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className={`p-6 rounded-3xl border flex justify-between items-center ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Frete do Fornecedor</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setQuoteFormData({...quoteFormData, isFreightIncluded: true})}
                          className={`text-[9px] font-black uppercase px-4 py-2 rounded-lg border transition-all ${quoteFormData.isFreightIncluded ? 'bg-[#F4C150] text-black border-[#F4C150]' : (theme === 'dark' ? 'bg-[#121212] text-gray-500 border-[#222]' : 'bg-[#F8F9FA] text-[#6B7280] border-[#E5E7EB]')}`}
                        >Incluso</button>
                        <button 
                          onClick={() => setQuoteFormData({...quoteFormData, isFreightIncluded: false})}
                          className={`text-[9px] font-black uppercase px-4 py-2 rounded-lg border transition-all ${!quoteFormData.isFreightIncluded ? 'bg-white text-black border-white' : (theme === 'dark' ? 'bg-[#121212] text-gray-500 border-[#222]' : 'bg-[#F8F9FA] text-[#6B7280] border-[#E5E7EB]')}`}
                        >À Parte</button>
                      </div>
                    </div>
                    {!quoteFormData.isFreightIncluded && (
                      <div className="flex flex-col items-end">
                        <label className={`text-[9px] font-black uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Custo Frete</label>
                        <input 
                          type="number"
                          className={`w-24 p-2 border rounded-lg text-xs font-black outline-none focus:border-[#F4C150] ${theme === 'dark' ? 'bg-[#121212] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                          value={quoteFormData.freightCost}
                          onChange={(e) => setQuoteFormData({...quoteFormData, freightCost: Number(e.target.value)})}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-6 rounded-3xl border flex justify-between items-center ${theme === 'dark' ? 'bg-[#F4C150]/10 border-[#F4C150]/20' : 'bg-[#F4C150]/5 border-[#F4C150]/20'}`}>
                    <div>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-[#6B7280]'}`}>Valor Final do Pacote</p>
                       <p className={`text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
                         R$ {(
                           (Object.entries(quoteFormData.itemPrices) as [string, number][]).reduce((acc, [id, price]) => {
                             const q = orderInProgress?.items.find(i => i.id === id)?.quantity || 0;
                             return acc + (price * q);
                           }, 0) + (quoteFormData.isFreightIncluded ? 0 : quoteFormData.freightCost)
                         ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#F4C150] flex items-center justify-center text-black">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-6 md:p-8 border-t flex justify-end gap-6 ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                <button onClick={() => setShowQuoteForm(false)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>Cancelar</button>
                <button 
                  onClick={handleSaveQuote}
                  disabled={!quoteFormData.supplierId}
                  className={`px-12 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all ${theme === 'dark' ? 'bg-white text-black hover:bg-[#F4C150]' : 'bg-[#F4C150] text-[#1F2937] hover:bg-[#ffcf66]'}`}
                >
                  Salvar Proposta
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-8 md:space-y-12 animate-subtle-fade ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
      <div className={`flex flex-col gap-4 border-b pb-6 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Central de Pedidos</h2>
            <p className="text-xs text-[#F4C150] font-black uppercase tracking-[0.3em] mt-1">Gestão de suprimentos e aprovações</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-[#F4C150] text-black px-8 md:px-10 py-3.5 md:py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(244,193,80,0.1)] hover:scale-105 transition-all"
          >
            Nova Requisição
          </button>
        </div>
        <div className="relative group w-full sm:w-80">
          <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-[#F4C150] transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-[#9CA3AF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          <input 
            type="text" 
            placeholder="PESQUISAR POR OBRA, ID, STATUS..."
            className={`w-full pl-12 pr-6 py-4 border rounded-2xl text-[10px] font-black tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white placeholder:text-gray-700' : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={`border rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-[#222222] bg-[#1a1a1a]/50' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('projectName')}
                >
                  <div className="flex items-center">Obra / Canteiro <SortIcon column="projectName" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('id')}
                >
                  <div className="flex items-center">ID Pedido <SortIcon column="id" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('total')}
                >
                  <div className="flex items-center">Valor Total <SortIcon column="total" /></div>
                </th>
                <th 
                  className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">Status Atual <SortIcon column="status" /></div>
                </th>
                <th className={`px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-right ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Ações</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-y divide-[#1A1A1A]' : 'divide-y divide-[#E5E7EB]'}>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`p-12 md:p-20 text-center ${theme === 'dark' ? 'opacity-30' : 'opacity-40'}`}>
                     <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-white' : 'text-[#6B7280]'}`}>Nenhum pedido encontrado</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => {
                  const project = projects.find(p => p.id === order.projectId);
                  const total = calculateTotalOrderCost(order);
                  
                  return (
                    <tr key={order.id} className={`transition-colors group ${theme === 'dark' ? 'hover:bg-white/[0.02]' : index % 2 === 0 ? 'bg-white hover:bg-[#F8F9FA]' : 'bg-[#F8F9FA] hover:bg-[#F2F3F5]'}`}>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-black uppercase tracking-tight transition-colors truncate max-w-[150px] ${theme === 'dark' ? 'text-white group-hover:text-[#F4C150]' : 'text-[#1F2937] group-hover:text-[#F4C150]'}`}>{project?.name || 'EXTERNO'}</p>
                        <p className={`text-[8px] md:text-[9px] font-bold uppercase mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Ref: {new Date(order.requestDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <span className={`text-[10px] md:text-xs font-black font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-[#9CA3AF]'}`}>#{order.id.split('-')[1]}</span>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-black ${order.orderQuotes.length === 0 ? (theme === 'dark' ? 'text-gray-600 italic' : 'text-[#9CA3AF] italic') : (theme === 'dark' ? 'text-white' : 'text-[#1F2937]')}`}>
                          {order.orderQuotes.length === 0 ? 'EM COTAÇÃO' : `R$ ${total.toLocaleString()}`}
                        </p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full border ${
                          order.status === OrderStatus.PENDING_QUOTES ? (theme === 'dark' ? 'border-[#444] text-gray-500' : 'border-[#D1D5DB] text-[#6B7280] bg-[#F2F3F5]') :
                          order.status === OrderStatus.READY_FOR_APPROVAL ? 'border-[#F4C150] text-[#F4C150]' :
                          order.status === OrderStatus.REJECTED ? (theme === 'dark' ? 'border-red-900/50 text-red-500 bg-red-500/5' : 'border-red-200 text-red-600 bg-red-50') :
                          (theme === 'dark' ? 'border-green-900/50 text-green-500 bg-green-500/5' : 'border-green-200 text-green-600 bg-green-50')
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8 text-right">
                        <div className="flex items-center justify-end gap-2 md:gap-3">
                          <button 
                            onClick={() => setViewingOrderId(order.id)}
                            className={`p-2.5 md:p-3 border rounded-xl transition-all shrink-0 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-gray-400 hover:text-white hover:border-white' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#F4C150] hover:border-[#F4C150]/50'}`}
                            title="Ver Detalhes"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"></path><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2"></path></svg>
                          </button>
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
              Total: {filteredAndSortedOrders.length}
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

      {showForm && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`fixed backdrop-blur-xl z-[9999] ${theme === 'dark' ? 'bg-black/80' : 'bg-black/50'}`} 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0, padding: 0 }} 
            onClick={() => setShowForm(false)}
          ></div>
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-[2.5rem] md:rounded-[3rem] border shadow-2xl overflow-y-auto max-h-[90vh] z-[10000] ${theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`} style={{ animation: 'fadeInModal 0.3s ease-out' }}>
            <div className={`p-6 md:p-10 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <div>
                <h3 className={`text-base md:text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Formulário de Material</h3>
                <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Preenchimento Técnico</p>
              </div>
              <button onClick={() => setShowForm(false)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1A1A1A] text-white hover:text-[#F4C150]' : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#F4C150] hover:border-[#D1D5DB]'}`}>✕</button>
            </div>
            <div className={`p-6 md:p-10 space-y-6 md:space-y-10 ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
              <div className="space-y-3">
                <label className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ml-4 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Canteiro de Obras</label>
                <select 
                  className={`w-full p-4 md:p-5 border rounded-2xl outline-none focus:border-[#F4C150] text-xs font-bold uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                  value={newOrder.projectId}
                  onChange={(e) => setNewOrder({ ...newOrder, projectId: e.target.value })}
                >
                  <option value="">SELECIONAR OBRA</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
              </div>

              <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border space-y-4 md:space-y-6 ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-[#F8F9FA] border-[#E5E7EB]'}`}>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#F4C150]">Itens da Solicitação</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <input 
                    type="text" 
                    placeholder="DESCRIÇÃO"
                    className={`flex-1 p-4 md:p-5 border rounded-2xl outline-none focus:border-[#F4C150] text-xs font-bold uppercase ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      className={`w-20 md:w-24 p-4 md:p-5 border rounded-2xl outline-none focus:border-[#F4C150] text-xs font-bold ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white' : 'bg-white border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                    <button 
                      onClick={handleAddItem}
                      disabled={isClassifying}
                      className="bg-white text-black px-6 md:px-8 rounded-2xl font-black uppercase text-[10px] tracking-tighter disabled:opacity-50 hover:bg-[#F4C150] transition-colors"
                    >
                      {isClassifying ? '...' : 'ADD'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 md:mt-8">
                  {newOrder.items?.map((item, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 md:p-4 border rounded-xl ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black bg-[#F4C150] text-black px-2 md:px-3 py-1 rounded-lg uppercase shrink-0">{item.category}</span>
                        <span className={`text-[10px] md:text-xs font-bold uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{item.name}</span>
                      </div>
                      <span className="text-[10px] md:text-xs font-black text-[#F4C150] shrink-0">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={`p-6 md:p-10 border-t flex flex-col sm:flex-row justify-end gap-4 md:gap-6 ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <button onClick={() => setShowForm(false)} className={`order-2 sm:order-1 text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>Cancelar</button>
              <button 
                onClick={handleSaveOrder}
                disabled={!newOrder.projectId || !newOrder.items?.length}
                className={`order-1 sm:order-2 px-10 md:px-12 py-4 md:py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10 transition-colors ${theme === 'dark' ? 'bg-[#F4C150] text-black hover:bg-[#ffcf66]' : 'bg-[#F4C150] text-[#1F2937] hover:bg-[#ffcf66]'}`}
              >
                Confirmar Lote
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default OrdersManager;
