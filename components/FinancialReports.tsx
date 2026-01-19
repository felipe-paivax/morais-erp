
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AccountPayable, AccountReceivable, Project, PaymentStatus, TransactionCategory } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface FinancialReportsProps {
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  projects: Project[];
}

const FinancialReports: React.FC<FinancialReportsProps> = ({
  accountsPayable,
  accountsReceivable,
  projects
}) => {
  const { theme } = useTheme();
  const dre = useMemo(() => {
    const totalRevenue = accountsReceivable
      .filter(ar => ar.status === PaymentStatus.PAID)
      .reduce((acc, ar) => acc + ar.amount, 0);

    const totalExpenses = accountsPayable
      .filter(ap => ap.status === PaymentStatus.PAID)
      .reduce((acc, ap) => acc + ap.amount, 0);

    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      grossProfit,
      profitMargin
    };
  }, [accountsPayable, accountsReceivable]);

  const expensesByCategory = useMemo(() => {
    const categories: Record<TransactionCategory, number> = {
      'Materiais': 0,
      'Serviços': 0,
      'Administrativo': 0,
      'Mão de Obra': 0,
      'Equipamentos': 0,
      'Outros': 0
    };

    accountsPayable
      .filter(ap => ap.status === PaymentStatus.PAID)
      .forEach(ap => {
        categories[ap.category] = (categories[ap.category] || 0) + ap.amount;
      });

    return Object.entries(categories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [accountsPayable]);

  const revenueByProject = useMemo(() => {
    const projectRevenue: Record<string, number> = {};

    accountsReceivable
      .filter(ar => ar.status === PaymentStatus.PAID)
      .forEach(ar => {
        projectRevenue[ar.projectId] = (projectRevenue[ar.projectId] || 0) + ar.amount;
      });

    return Object.entries(projectRevenue)
      .map(([projectId, value]) => {
        const project = projects.find(p => p.id === projectId);
        return {
          name: project?.name || 'N/A',
          revenue: value,
          budget: project?.budget || 0,
          usage: project?.budget ? (value / project.budget) * 100 : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [accountsReceivable, projects]);

  const budgetVsActual = useMemo(() => {
    return projects.map(project => {
      const actualRevenue = accountsReceivable
        .filter(ar => ar.projectId === project.id && ar.status === PaymentStatus.PAID)
        .reduce((acc, ar) => acc + ar.amount, 0);

      const actualExpenses = accountsPayable
        .filter(ap => ap.projectId === project.id && ap.status === PaymentStatus.PAID)
        .reduce((acc, ap) => acc + ap.amount, 0);

      return {
        name: project.name.split(' ')[0].toUpperCase(),
        budget: project.budget,
        actual: actualRevenue,
        expenses: actualExpenses,
        variance: actualRevenue - project.budget
      };
    });
  }, [projects, accountsPayable, accountsReceivable]);

  const COLORS = ['#F4C150', '#888888', '#444444', '#222222', '#111111', '#0a0a0a'];

  return (
    <div className="space-y-8 md:space-y-12">
      {/* DRE Card */}
      <div className={`p-8 md:p-12 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
        <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter mb-8 ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Demonstração de Resultados (DRE)</h3>
        <div className="space-y-6">
          <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
            <span className={`text-sm font-bold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-[#6B7280]'}`}>Receitas Totais</span>
            <span className="text-2xl font-black text-green-500">R$ {dre.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
            <span className={`text-sm font-bold uppercase ${theme === 'dark' ? 'text-gray-400' : 'text-[#6B7280]'}`}>Despesas Totais</span>
            <span className="text-2xl font-black text-red-500">R$ {dre.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center py-6 border-t-2 border-[#F4C150]">
            <span className={`text-lg font-black uppercase ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Resultado Líquido</span>
            <span className={`text-3xl font-black ${dre.grossProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {dre.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`pt-4 border-t ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Margem de Lucro</span>
              <span className={`text-xl font-black ${dre.profitMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {dre.profitMargin.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses by Category */}
        <div className={`p-6 md:p-10 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <h3 className={`text-lg md:text-xl font-black uppercase tracking-tighter mb-8 ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Despesas por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <PieChart>
                <Pie
                  data={expensesByCategory.length > 0 ? expensesByCategory : [{name:'Sem dados',value:0}]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#161616' : '#FFFFFF', border: theme === 'dark' ? '1px solid #222' : '1px solid #E5E7EB', borderRadius: '1rem', color: theme === 'dark' ? '#fff' : '#1F2937', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Project */}
        <div className={`p-6 md:p-10 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <h3 className={`text-lg md:text-xl font-black uppercase tracking-tighter mb-8 ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Receitas por Obra</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <BarChart data={revenueByProject.length > 0 ? revenueByProject : [{name:'Sem dados',revenue:0,budget:0,usage:0}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#E5E7EB'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} angle={-45} textAnchor="end" height={80} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
                <Tooltip
                  cursor={{fill: theme === 'dark' ? '#1A1A1A' : '#F8F9FA'}}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#161616' : '#FFFFFF', border: theme === 'dark' ? '1px solid #222' : '1px solid #E5E7EB', borderRadius: '1rem', color: theme === 'dark' ? '#fff' : '#1F2937', fontSize: '10px' }}
                />
                <Bar dataKey="revenue" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className={`p-6 md:p-10 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
        <h3 className={`text-lg md:text-xl font-black uppercase tracking-tighter mb-8 ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Orçado vs Realizado por Obra</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <BarChart data={budgetVsActual.length > 0 ? budgetVsActual : [{name:'Sem dados',budget:0,actual:0,expenses:0,variance:0}]} barGap={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#E5E7EB'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
              <Tooltip
                cursor={{fill: theme === 'dark' ? '#1A1A1A' : '#F8F9FA'}}
                contentStyle={{ backgroundColor: theme === 'dark' ? '#161616' : '#FFFFFF', border: theme === 'dark' ? '1px solid #222' : '1px solid #E5E7EB', borderRadius: '1rem', color: theme === 'dark' ? '#fff' : '#1F2937', fontSize: '10px' }}
              />
              <Legend />
              <Bar dataKey="budget" fill={theme === 'dark' ? '#333' : '#9CA3AF'} radius={[8, 8, 8, 8]} name="Orçado" />
              <Bar dataKey="actual" fill="#F4C150" radius={[8, 8, 8, 8]} name="Realizado" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Total de Obras</p>
          <p className={`text-3xl font-black tracking-tighter ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>{projects.length}</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Receitas Registradas</p>
          <p className="text-3xl font-black tracking-tighter text-green-500">{accountsReceivable.filter(ar => ar.status === PaymentStatus.PAID).length}</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Despesas Registradas</p>
          <p className="text-3xl font-black tracking-tighter text-red-500">{accountsPayable.filter(ap => ap.status === PaymentStatus.PAID).length}</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Taxa de Conversão</p>
          <p className="text-3xl font-black tracking-tighter text-[#F4C150]">
            {projects.length > 0 ? ((accountsReceivable.filter(ar => ar.status === PaymentStatus.PAID).length / projects.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
