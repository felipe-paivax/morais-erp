
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Project, MaterialOrder, OrderStatus } from '../types';

interface DashboardProps {
  projects: Project[];
  orders: MaterialOrder[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects, orders }) => {
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  
  const calculateTotalOrderCost = (order: MaterialOrder) => {
    const selectedQuote = order.orderQuotes.find(q => q.isSelected);
    if (selectedQuote) return selectedQuote.totalPrice;
    
    if (order.orderQuotes.length > 0) {
      return Math.min(...order.orderQuotes.map(q => q.totalPrice));
    }
    return 0;
  };

  const actualSpend = orders.filter(o => o.status === OrderStatus.APPROVED || o.status === OrderStatus.DELIVERED)
    .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);

  const chartData = projects.map(p => {
    const projectSpend = orders
      .filter(o => o.projectId === p.id && (o.status === OrderStatus.APPROVED || o.status === OrderStatus.DELIVERED))
      .reduce((acc, o) => acc + calculateTotalOrderCost(o), 0);
    return {
      name: p.name.split(' ')[0].toUpperCase(),
      orcado: p.budget,
      gasto: projectSpend,
    };
  });

  const orderStats = [
    { name: 'Pendente', value: orders.filter(o => o.status === OrderStatus.PENDING_QUOTES).length, color: '#444' },
    { name: 'Em Aprovação', value: orders.filter(o => o.status === OrderStatus.READY_FOR_APPROVAL).length, color: '#888' },
    { name: 'Aprovado', value: orders.filter(o => o.status === OrderStatus.APPROVED).length, color: '#F4C150' },
  ];

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Metric Cards - Improved Grid for Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] relative overflow-hidden group hover:border-[#F4C150]/30 transition-all">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#F4C150]/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
             <svg className="w-5 h-5 md:w-6 md:h-6 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"></path></svg>
          </div>
          <p className="text-3xl md:text-[40px] font-black tracking-tighter leading-none mb-1 md:mb-2 truncate">R$ {(totalBudget/1000).toFixed(0)}k</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Orçado</p>
          <p className="text-[9px] md:text-[10px] text-[#F4C150] font-black mt-3 md:mt-4">Planejamento Global</p>
        </div>

        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] relative overflow-hidden group hover:border-[#F4C150]/30 transition-all">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
             <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeWidth="2"></path></svg>
          </div>
          <p className="text-3xl md:text-[40px] font-black tracking-tighter leading-none mb-1 md:mb-2 truncate">R$ {(actualSpend/1000).toFixed(0)}k</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gasto Consolidado</p>
          <p className="text-[9px] md:text-[10px] text-blue-500 font-black mt-3 md:mt-4">Fluxo de Caixa Ativo</p>
        </div>

        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] relative overflow-hidden group hover:border-[#F4C150]/30 transition-all">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
             <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"></path></svg>
          </div>
          <p className="text-3xl md:text-[40px] font-black tracking-tighter leading-none mb-1 md:mb-2">{orders.length}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pedidos Emitidos</p>
          <p className="text-[9px] md:text-[10px] text-green-500 font-black mt-3 md:mt-4">Suprimentos em Dia</p>
        </div>

        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222] relative overflow-hidden group hover:border-[#F4C150]/30 transition-all">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
             <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" strokeWidth="2"></path><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" strokeWidth="2"></path></svg>
          </div>
          <p className="text-3xl md:text-[40px] font-black tracking-tighter leading-none mb-1 md:mb-2">{projects.length}</p>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Obras em Gestão</p>
          <p className="text-[9px] md:text-[10px] text-purple-500 font-black mt-3 md:mt-4">Portfólio Ativo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Costs Chart */}
        <div className="lg:col-span-2 bg-[#161616] p-6 md:p-10 rounded-[2rem] border border-[#222222]">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 md:mb-10 gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Fluxo Financeiro por Obra</h3>
              <p className="text-xs text-gray-500 font-medium">Comparativo Orçado x Realizado</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#333]"></div><span className="text-[10px] font-bold text-gray-500">ORÇADO</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#F4C150]"></div><span className="text-[10px] font-bold text-gray-500">GASTO</span></div>
            </div>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={12}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 9, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: '#1A1A1A'}} 
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #222', borderRadius: '1rem', color: '#fff', fontSize: '10px' }} 
                />
                <Bar dataKey="orcado" fill="#333" radius={[8, 8, 8, 8]} barSize={16} />
                <Bar dataKey="gasto" fill="#F4C150" radius={[8, 8, 8, 8]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status List */}
        <div className="bg-[#161616] p-6 md:p-10 rounded-[2rem] border border-[#222222]">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-6 md:mb-8">Status de Suprimentos</h3>
          <div className="space-y-4 md:space-y-6">
            {orderStats.map((stat, i) => (
              <div key={stat.name} className="flex items-center gap-3 md:gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-[#222222]">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-black text-sm md:text-base" style={{ backgroundColor: stat.color }}>
                    {i+1}
                 </div>
                 <div className="flex-1">
                    <p className="text-xs md:text-sm font-bold">{stat.name}</p>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">Processamento Atual</p>
                 </div>
                 <div className="text-right">
                    <p className="text-base md:text-lg font-black">{stat.value}</p>
                    <p className="text-[9px] md:text-[10px] text-[#F4C150] font-black uppercase">QTD</p>
                 </div>
              </div>
            ))}
            
            <div className="pt-6 md:pt-8 border-t border-[#222222]">
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3 md:mb-4">Média de Performance</p>
               <div className="flex items-end gap-2">
                  <p className="text-3xl md:text-4xl font-black tracking-tighter">98%</p>
                  <p className="text-[10px] text-green-500 font-bold mb-1 uppercase">Produtividade</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
