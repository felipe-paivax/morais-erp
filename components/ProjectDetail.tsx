
import React from 'react';
import { Project, MaterialOrder, Client, OrderStatus } from '../types';

interface ProjectDetailProps {
  project: Project;
  client?: Client;
  orders: MaterialOrder[];
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, client, orders, onBack, onViewOrder }) => {
  
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

  return (
    <div className="space-y-12 animate-subtle-fade text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#222222] flex items-center justify-center hover:border-[#F4C150] transition-all group"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{project.name}</h2>
              <span className={`text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-full ${project.status === 'In Progress' ? 'bg-[#F4C150] text-black' : 'bg-[#222] text-gray-500'}`}>
                {project.status === 'In Progress' ? 'Em Execução' : 'Planejamento'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">ID TÉCNICO: {project.id} • INÍCIO EM {new Date(project.startDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Status de Entrega</p>
           <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                 <div className="h-full bg-[#F4C150]" style={{ width: `${Math.min(budgetUsage, 100)}%` }}></div>
              </div>
              <span className="text-sm font-black tracking-tighter">{budgetUsage.toFixed(1)}%</span>
           </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#161616] p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Orçamento Alocado</p>
          <p className="text-3xl font-black tracking-tighter">R$ {project.budget.toLocaleString()}</p>
        </div>
        <div className="bg-[#161616] p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Investimento Realizado</p>
          <p className="text-3xl font-black tracking-tighter text-[#F4C150]">R$ {actualSpent.toLocaleString()}</p>
        </div>
        <div className="bg-[#161616] p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Comprometido / Pendente</p>
          <p className="text-3xl font-black tracking-tighter text-blue-500">R$ {pendingSpent.toLocaleString()}</p>
        </div>
        <div className="bg-[#161616] p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Saldo Disponível</p>
          <p className="text-3xl font-black tracking-tighter text-gray-400">R$ {(project.budget - actualSpent - pendingSpent).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Histórico de Pedidos</h3>
              <span className="text-[10px] font-black bg-[#1A1A1A] px-4 py-1.5 rounded-lg border border-[#222] text-gray-500 uppercase">{orders.length} Requisições</span>
           </div>
           <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="p-20 border-2 border-dashed border-[#222] rounded-[2rem] flex flex-col items-center justify-center opacity-30">
                  <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum pedido vinculado</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-[#161616] border border-[#222222] p-8 rounded-[2rem] flex items-center justify-between hover:border-gray-700 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#0B0B0B] rounded-xl flex items-center justify-center font-black text-[10px] text-gray-500 border border-[#222]">
                        #{order.id.split('-')[1]}
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase">{order.items.length} ITENS NO LOTE</p>
                        <p className="text-[10px] text-gray-600 font-bold mt-1 uppercase">EMISSÃO EM {new Date(order.requestDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                       <div>
                         <p className="text-[9px] font-black text-gray-600 uppercase mb-1">VALOR DO LOTE</p>
                         <p className="text-lg font-black tracking-tight">R$ {calculateTotalOrderCost(order).toLocaleString()}</p>
                       </div>
                       <div className="flex flex-col gap-2 items-end">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            order.status === OrderStatus.APPROVED ? 'border-[#F4C150] text-[#F4C150]' : 'border-gray-700 text-gray-600'
                          }`}>
                            {order.status}
                          </span>
                          <button 
                            onClick={() => onViewOrder(order.id)}
                            className="text-[9px] font-black uppercase tracking-widest bg-white text-black px-4 py-1.5 rounded-lg hover:bg-[#F4C150] transition-all"
                          >
                            Analisar
                          </button>
                       </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <div className="bg-[#161616] border border-[#222222] rounded-[2.5rem] p-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#F4C150] mb-8">Informação do Cliente</h3>
              <div className="space-y-6">
                 {client ? (
                   <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-600 uppercase">Titular</p>
                      <p className="text-lg font-black">{client.name.toUpperCase()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-600 uppercase">Contato</p>
                      <p className="text-sm font-bold text-gray-400">{client.email}</p>
                      <p className="text-sm font-bold text-gray-400">{client.phone}</p>
                    </div>
                   </>
                 ) : (
                   <p className="text-xs text-gray-600 italic">Dados do cliente não vinculados.</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
