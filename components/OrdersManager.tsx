
import React, { useState, useMemo } from 'react';
import { MaterialOrder, Project, MaterialItem, OrderStatus, Supplier, OrderQuote, PaymentMethod, ItemQuoteEntry } from '../types';
import { classifyMaterial } from '../services/gemini';
import { Icons } from '../constants';

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
  const [showForm, setShowForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  
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
      <div className="space-y-8 md:space-y-12 animate-subtle-fade">
        <div className="flex items-center gap-4 md:gap-6 border-b border-[#222222] pb-6 md:pb-8">
          <button 
            onClick={() => setViewingOrderId(null)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#1A1A1A] border border-[#222222] flex items-center justify-center hover:border-[#F4C150] transition-all group shrink-0"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase truncate">Requisição #{order.id.split('-')[1]}</h2>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate">
              {isApproved ? 'Pedido Aprovado e Finalizado' : 'Análise de propostas comerciais por lote'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
           {/* Lado Esquerdo: Itens do Pedido */}
           <div className="lg:col-span-1 space-y-4 md:space-y-6">
              <div className="bg-[#161616] border border-[#222222] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
                 <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#F4C150] mb-6 md:mb-8">Itens Solicitados</h3>
                 <div className="space-y-3">
                    {order.items.map(item => (
                      <div key={item.id} className="p-3 md:p-4 bg-[#1A1A1A] border border-[#222222] rounded-xl flex justify-between items-center">
                         <div className="min-w-0">
                            <p className="text-xs font-black uppercase truncate">{item.name}</p>
                            <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase">{item.category}</p>
                         </div>
                         <div className="text-right shrink-0">
                            <p className="text-xs font-black text-[#F4C150]">{item.quantity} {item.unit}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="bg-[#161616] border border-[#222222] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
                 <p className="text-[9px] md:text-[10px] text-gray-600 font-black uppercase mb-1">Responsável</p>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[10px] font-black shrink-0">FP</div>
                    <span className="text-xs font-bold uppercase truncate">{order.requestedBy}</span>
                 </div>
              </div>
           </div>

           {/* Lado Direito: Cotações Globais */}
           <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                 <div>
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Propostas Comerciais</h3>
                    <p className="text-xs text-gray-500 font-medium">Comparativo de orçamento completo</p>
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
                          quote.isSelected ? 'border-[#F4C150] bg-[#F4C150]/5 shadow-[0_0_40px_rgba(244,193,80,0.1)]' : 'border-[#222222] bg-[#161616]'
                        } ${!isApproved ? 'cursor-pointer hover:border-gray-700' : ''}`}
                      >
                         <div className="flex justify-between items-start mb-8 md:mb-12">
                            <div className="flex flex-col min-w-0">
                               <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-600 tracking-widest mb-1">Cotação 0{i+1}</span>
                               <p className="text-base md:text-lg font-black uppercase truncate">{supplier?.name}</p>
                            </div>
                            {quote.isSelected && <div className="w-4 h-4 bg-[#F4C150] rounded-full shrink-0 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"></path></svg></div>}
                         </div>

                         <div className="space-y-6 md:space-y-8">
                            <div className="flex justify-between items-end">
                               <div>
                                  <p className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase mb-1">Valor do Pacote</p>
                                  <p className="text-2xl md:text-3xl font-black tracking-tighter">R$ {quote.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase mb-1">Lead Time</p>
                                  <p className="text-base md:text-lg font-black">{quote.deliveryDays} DIAS</p>
                               </div>
                            </div>
                            
                            <div className="pt-4 md:pt-6 border-t border-[#1A1A1A] flex flex-col gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                               <div className="flex justify-between">
                                  <span className="text-gray-600">Frete: {quote.isFreightIncluded ? 'Incluso' : `R$ ${quote.freightCost?.toLocaleString()}`}</span>
                                  <span className="text-[#F4C150]">{quote.billingTerms}</span>
                               </div>
                               {isApproved && quote.paymentMethod && (
                                 <div className="flex justify-between border-t border-[#222] pt-2 mt-2">
                                    <span className="text-gray-500">Pagamento:</span>
                                    <span className="text-white">{quote.paymentMethod}</span>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    );
                 })}

                 {/* Skeleton completion só se não aprovado */}
                 {!isApproved && [...Array(Math.max(0, 3 - order.orderQuotes.length))].map((_, i) => (
                    <div key={i} className="p-8 md:p-12 border-2 border-dashed border-[#222222] rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
                       <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-600">Aguardando Proposta {order.orderQuotes.length + i + 1}</p>
                    </div>
                 ))}
              </div>

              {/* Detalhes do Fechamento (Aparece ao selecionar e se NÃO aprovado) */}
              {selectedQuote && !isApproved && (
                <div className="bg-[#1A1A1A] border border-[#222222] rounded-[2rem] p-6 md:p-10 space-y-8 animate-subtle-fade">
                   <h3 className="text-sm font-black uppercase tracking-widest text-[#F4C150]">Detalhes do Acordo Comercial</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Método de Pagamento</label>
                         <select 
                            className="w-full p-5 bg-[#161616] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] outline-none transition-all uppercase"
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
                         <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Observações do Lote</label>
                         <textarea 
                            placeholder="EX: ENTREGA NO PORTÃO 2, DESCARGA POR CONTA DO FORNECEDOR..."
                            className="w-full p-5 bg-[#161616] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] outline-none transition-all uppercase min-h-[100px] resize-none"
                            value={selectedQuote.observations || ''}
                            onChange={(e) => handleUpdateQuoteDetails(order.id, selectedQuote.id, 'observations', e.target.value)}
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* Se estiver aprovado, mostrar resumo fixo do fechamento */}
              {isApproved && selectedQuote && (
                <div className="bg-[#1A1A1A] border border-[#222222] rounded-[2rem] p-6 md:p-10 space-y-6">
                   <h3 className="text-sm font-black uppercase tracking-widest text-green-500">Contrato Fechado</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-2">
                         <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Método Definido</p>
                         <p className="font-black text-white">{selectedQuote.paymentMethod}</p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Faturamento</p>
                         <p className="font-black text-white">{selectedQuote.billingTerms}</p>
                      </div>
                      <div className="md:col-span-2 space-y-2 pt-4 border-t border-[#222]">
                         <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Observações Técnicas</p>
                         <p className="text-gray-300 italic">{selectedQuote.observations || 'Nenhuma observação registrada.'}</p>
                      </div>
                   </div>
                </div>
              )}

              {/* Approval Actions só se NÃO aprovado */}
              {!isApproved && (
                <div className="pt-8 md:pt-12 border-t border-[#222222] flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${order.orderQuotes.length >= 3 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">
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
                        className="w-full sm:w-auto px-8 md:px-12 py-3.5 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-[#F4C150] text-black rounded-2xl disabled:opacity-20 transition-all shadow-[0_0_40px_rgba(244,193,80,0.1)]"
                      >
                        {!selectedQuote?.paymentMethod ? 'Selecione o Pagamento' : 'Aprovar Pedido Completo'}
                      </button>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* Modal para Nova Proposta Detalhada */}
        {showQuoteForm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
            <div className="bg-[#121212] w-full max-w-4xl rounded-[2.5rem] border border-[#222222] shadow-2xl animate-subtle-fade overflow-y-auto max-h-[90vh] flex flex-col">
              <div className="p-6 md:p-8 border-b border-[#1A1A1A] flex justify-between items-center bg-[#161616]">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Inserir Nova Proposta</h3>
                  <p className="text-[9px] text-[#F4C150] font-bold uppercase tracking-widest">Detalhamento Comercial por Fornecedor</p>
                </div>
                <button onClick={() => setShowQuoteForm(false)} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:text-[#F4C150]">✕</button>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto custom-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Fornecedor</label>
                    <select 
                      className="w-full p-4 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold outline-none focus:border-[#F4C150] uppercase transition-all"
                      value={quoteFormData.supplierId}
                      onChange={(e) => setQuoteFormData({...quoteFormData, supplierId: e.target.value})}
                    >
                      <option value="">SELECIONAR PARCEIRO</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Prazo Entrega (Dias)</label>
                    <input 
                      type="number"
                      className="w-full p-4 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold outline-none focus:border-[#F4C150]"
                      value={quoteFormData.deliveryDays}
                      onChange={(e) => setQuoteFormData({...quoteFormData, deliveryDays: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Faturamento</label>
                    <input 
                      type="text"
                      className="w-full p-4 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold outline-none focus:border-[#F4C150] uppercase"
                      value={quoteFormData.billingTerms}
                      onChange={(e) => setQuoteFormData({...quoteFormData, billingTerms: e.target.value})}
                    />
                  </div>
                </div>

                <div className="bg-[#161616] p-6 rounded-3xl border border-[#222222] space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F4C150]">Valores Unitários por Item</h4>
                  <div className="space-y-3">
                    {orderInProgress?.items.map(item => (
                      <div key={item.id} className="grid grid-cols-2 sm:grid-cols-4 items-center gap-4 p-3 bg-[#1A1A1A] border border-[#222222] rounded-2xl">
                        <div className="col-span-2">
                          <p className="text-xs font-black uppercase truncate">{item.name}</p>
                          <p className="text-[9px] text-gray-500 font-bold">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-600">R$</span>
                          <input 
                            type="number"
                            placeholder="PREÇO UNIT"
                            className="w-full p-3 bg-[#121212] border border-[#222222] rounded-xl text-white text-xs font-black outline-none focus:border-[#F4C150]"
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
                  <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-[#222222] flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Frete do Fornecedor</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setQuoteFormData({...quoteFormData, isFreightIncluded: true})}
                          className={`text-[9px] font-black uppercase px-4 py-2 rounded-lg border transition-all ${quoteFormData.isFreightIncluded ? 'bg-[#F4C150] text-black border-[#F4C150]' : 'bg-[#121212] text-gray-500 border-[#222]'}`}
                        >Incluso</button>
                        <button 
                          onClick={() => setQuoteFormData({...quoteFormData, isFreightIncluded: false})}
                          className={`text-[9px] font-black uppercase px-4 py-2 rounded-lg border transition-all ${!quoteFormData.isFreightIncluded ? 'bg-white text-black border-white' : 'bg-[#121212] text-gray-500 border-[#222]'}`}
                        >À Parte</button>
                      </div>
                    </div>
                    {!quoteFormData.isFreightIncluded && (
                      <div className="flex flex-col items-end">
                        <label className="text-[9px] font-black uppercase text-gray-500 mb-1">Custo Frete</label>
                        <input 
                          type="number"
                          className="w-24 p-2 bg-[#121212] border border-[#222222] rounded-lg text-white text-xs font-black outline-none focus:border-[#F4C150]"
                          value={quoteFormData.freightCost}
                          onChange={(e) => setQuoteFormData({...quoteFormData, freightCost: Number(e.target.value)})}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#F4C150]/10 p-6 rounded-3xl border border-[#F4C150]/20 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Valor Final do Pacote</p>
                       <p className="text-2xl font-black text-white tracking-tighter">
                         R$ {(
                           // Fix: Explicitly cast Object.entries to [string, number][] to ensure numeric arithmetic on price.
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

              <div className="p-6 md:p-8 border-t border-[#1A1A1A] flex justify-end gap-6 bg-[#161616]">
                <button onClick={() => setShowQuoteForm(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cancelar</button>
                <button 
                  onClick={handleSaveQuote}
                  disabled={!quoteFormData.supplierId}
                  className="bg-white text-black px-12 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#F4C150] transition-all"
                >
                  Salvar Proposta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 animate-subtle-fade text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#222222] pb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">Central de Pedidos</h2>
          <p className="text-xs text-[#F4C150] font-black uppercase tracking-[0.3em] mt-1">Gestão de suprimentos e aprovações</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-[#F4C150] text-black px-8 md:px-10 py-3.5 md:py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(244,193,80,0.1)] hover:scale-105 transition-all"
        >
          Nova Requisição
        </button>
      </div>

      <div className="bg-[#161616] border border-[#222222] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#222222] bg-[#1a1a1a]/50">
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Obra / Canteiro</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">ID Pedido</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Valor Total</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Status Atual</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 md:p-20 text-center opacity-30">
                     <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Nenhum pedido em processamento</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const project = projects.find(p => p.id === order.projectId);
                  const total = calculateTotalOrderCost(order);
                  
                  return (
                    <tr key={order.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className="text-xs md:text-sm font-black uppercase tracking-tight group-hover:text-[#F4C150] transition-colors truncate max-w-[150px]">{project?.name || 'EXTERNO'}</p>
                        <p className="text-[8px] md:text-[9px] text-gray-600 font-bold uppercase mt-1">Ref: {new Date(order.requestDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <span className="text-[10px] md:text-xs font-black font-mono text-gray-400">#{order.id.split('-')[1]}</span>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-black ${order.orderQuotes.length === 0 ? 'text-gray-600 italic' : 'text-white'}`}>
                          {order.orderQuotes.length === 0 ? 'EM COTAÇÃO' : `R$ ${total.toLocaleString()}`}
                        </p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full border ${
                          order.status === OrderStatus.PENDING_QUOTES ? 'border-[#444] text-gray-500' :
                          order.status === OrderStatus.READY_FOR_APPROVAL ? 'border-[#F4C150] text-[#F4C150]' :
                          order.status === OrderStatus.REJECTED ? 'border-red-900/50 text-red-500 bg-red-500/5' :
                          'border-green-900/50 text-green-500 bg-green-500/5'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8 text-right">
                        <div className="flex items-center justify-end gap-2 md:gap-3">
                          <button 
                            onClick={() => setViewingOrderId(order.id)}
                            className="p-2.5 md:p-3 bg-[#1A1A1A] border border-[#222222] rounded-xl text-gray-400 hover:text-white hover:border-white transition-all shrink-0"
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
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-[#121212] w-full max-w-2xl rounded-[2.5rem] md:rounded-[3rem] border border-[#222222] shadow-2xl animate-subtle-fade overflow-y-auto max-h-[90vh]">
            <div className="p-6 md:p-10 border-b border-[#1A1A1A] flex justify-between items-center bg-[#161616]">
              <div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-tight">Formulário de Material</h3>
                <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest">Preenchimento Técnico</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:text-[#F4C150]">✕</button>
            </div>
            <div className="p-6 md:p-10 space-y-6 md:space-y-10">
              <div className="space-y-3">
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Canteiro de Obras</label>
                <select 
                  className="w-full p-4 md:p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl outline-none focus:border-[#F4C150] text-xs font-bold text-white uppercase"
                  value={newOrder.projectId}
                  onChange={(e) => setNewOrder({ ...newOrder, projectId: e.target.value })}
                >
                  <option value="">SELECIONAR OBRA</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="bg-[#1A1A1A] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-[#222222] space-y-4 md:space-y-6">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#F4C150]">Itens da Solicitação</p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <input 
                    type="text" 
                    placeholder="DESCRIÇÃO"
                    className="flex-1 p-4 md:p-5 bg-[#161616] border border-[#222222] rounded-2xl outline-none focus:border-[#F4C150] text-xs font-bold uppercase text-white"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      className="w-20 md:w-24 p-4 md:p-5 bg-[#161616] border border-[#222222] rounded-2xl outline-none focus:border-[#F4C150] text-xs font-bold text-white"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                    <button 
                      onClick={handleAddItem}
                      disabled={isClassifying}
                      className="bg-white text-black px-6 md:px-8 rounded-2xl font-black uppercase text-[10px] tracking-tighter disabled:opacity-50"
                    >
                      {isClassifying ? '...' : 'ADD'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 md:mt-8">
                  {newOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-[#161616] border border-[#222222] rounded-xl">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black bg-[#F4C150] text-black px-2 md:px-3 py-1 rounded-lg uppercase shrink-0">{item.category}</span>
                        <span className="text-[10px] md:text-xs font-bold uppercase truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] md:text-xs font-black text-[#F4C150] shrink-0">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 md:p-10 border-t border-[#1A1A1A] flex flex-col sm:flex-row justify-end gap-4 md:gap-6 bg-[#161616]">
              <button onClick={() => setShowForm(false)} className="order-2 sm:order-1 text-[10px] font-black uppercase tracking-widest text-gray-600">Cancelar</button>
              <button 
                onClick={handleSaveOrder}
                disabled={!newOrder.projectId || !newOrder.items?.length}
                className="order-1 sm:order-2 bg-[#F4C150] text-black px-10 md:px-12 py-4 md:py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10"
              >
                Confirmar Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
