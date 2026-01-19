
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { AccountPayable, AccountReceivable, Project, PaymentStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CashFlowProps {
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  projects: Project[];
}

const CashFlow: React.FC<CashFlowProps> = ({
  accountsPayable,
  accountsReceivable,
  projects
}) => {
  const { theme } = useTheme();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const cashFlowData = useMemo(() => {
    const data: Record<string, { date: string; income: number; expense: number; balance: number }> = {};
    const today = new Date();
    const monthsToShow = period === 'month' ? 6 : period === 'quarter' ? 4 : 2;
    
    // Inicializar meses
    for (let i = 0; i < monthsToShow; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      data[key] = {
        date: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        income: 0,
        expense: 0,
        balance: 0
      };
    }

    // Processar receitas pagas
    accountsReceivable
      .filter(ar => ar.status === PaymentStatus.PAID && ar.paymentDate)
      .forEach(ar => {
        const paymentDate = new Date(ar.paymentDate!);
        const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        if (data[key]) {
          data[key].income += ar.amount;
        }
      });

    // Processar despesas pagas
    accountsPayable
      .filter(ap => ap.status === PaymentStatus.PAID && ap.paymentDate)
      .forEach(ap => {
        const paymentDate = new Date(ap.paymentDate!);
        const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        if (data[key]) {
          data[key].expense += ap.amount;
        }
      });

    // Calcular saldo acumulado
    let runningBalance = 0;
    const sortedKeys = Object.keys(data).sort();
    
    return sortedKeys.map(key => {
      runningBalance += data[key].income - data[key].expense;
      return {
        ...data[key],
        balance: runningBalance
      };
    }).reverse();
  }, [accountsPayable, accountsReceivable, period]);

  const projectedData = useMemo(() => {
    const data: Record<string, { date: string; projectedIncome: number; projectedExpense: number }> = {};
    const today = new Date();
    
    // Próximos 3 meses
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      data[key] = {
        date: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        projectedIncome: 0,
        projectedExpense: 0
      };
    }

    // Projeção de receitas pendentes
    accountsReceivable
      .filter(ar => ar.status === PaymentStatus.PENDING)
      .forEach(ar => {
        const dueDate = new Date(ar.dueDate);
        const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        if (data[key]) {
          data[key].projectedIncome += ar.amount;
        }
      });

    // Projeção de despesas pendentes
    accountsPayable
      .filter(ap => ap.status === PaymentStatus.PENDING)
      .forEach(ap => {
        const dueDate = new Date(ap.dueDate);
        const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        if (data[key]) {
          data[key].projectedExpense += ap.amount;
        }
      });

    return Object.keys(data).sort().map(key => data[key]);
  }, [accountsPayable, accountsReceivable]);

  const currentBalance = useMemo(() => {
    const totalIncome = accountsReceivable
      .filter(ar => ar.status === PaymentStatus.PAID)
      .reduce((acc, ar) => acc + ar.amount, 0);
    
    const totalExpense = accountsPayable
      .filter(ap => ap.status === PaymentStatus.PAID)
      .reduce((acc, ap) => acc + ap.amount, 0);

    return totalIncome - totalExpense;
  }, [accountsPayable, accountsReceivable]);

  const pendingIncome = useMemo(() => {
    return accountsReceivable
      .filter(ar => ar.status === PaymentStatus.PENDING)
      .reduce((acc, ar) => acc + ar.amount, 0);
  }, [accountsReceivable]);

  const pendingExpense = useMemo(() => {
    return accountsPayable
      .filter(ap => ap.status === PaymentStatus.PENDING)
      .reduce((acc, ap) => acc + ap.amount, 0);
  }, [accountsPayable]);

  const categoryExpenses = useMemo(() => {
    const categories: Record<string, number> = {};
    accountsPayable
      .filter(ap => ap.status === PaymentStatus.PAID)
      .forEach(ap => {
        categories[ap.category] = (categories[ap.category] || 0) + ap.amount;
      });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [accountsPayable]);

  const COLORS = ['#F4C150', '#888888', '#444444', '#222222', '#111111'];

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Saldo Atual</p>
          <p className={`text-3xl font-black tracking-tighter ${currentBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {(currentBalance / 1000).toFixed(0)}k
          </p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Receitas Pendentes</p>
          <p className="text-3xl font-black tracking-tighter text-[#F4C150]">R$ {(pendingIncome / 1000).toFixed(0)}k</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Despesas Pendentes</p>
          <p className="text-3xl font-black tracking-tighter text-red-500">R$ {(pendingExpense / 1000).toFixed(0)}k</p>
        </div>
        <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Saldo Projetado</p>
          <p className={`text-3xl font-black tracking-tighter ${(currentBalance + pendingIncome - pendingExpense) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {((currentBalance + pendingIncome - pendingExpense) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-end">
        <div className={`flex gap-2 p-1 rounded-xl border ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222]' : 'bg-[#F2F3F5] border-[#E5E7EB]'}`}>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
              period === 'month' ? 'bg-[#F4C150] text-black' : theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
              period === 'quarter' ? 'bg-[#F4C150] text-black' : theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'
            }`}
          >
            Trimestral
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
              period === 'year' ? 'bg-[#F4C150] text-black' : theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={`lg:col-span-2 p-6 md:p-10 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 md:mb-10 gap-4">
            <div>
              <h3 className={`text-lg md:text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Fluxo de Caixa</h3>
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Entradas e Saídas por Período</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>ENTRADAS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>SAÍDAS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#F4C150]"></div>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>SALDO</span>
              </div>
            </div>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <LineChart data={cashFlowData.length > 0 ? cashFlowData : [{date:'',income:0,expense:0,balance:0}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#E5E7EB'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
                <Tooltip
                  cursor={{fill: theme === 'dark' ? '#1A1A1A' : '#F8F9FA'}}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#161616' : '#FFFFFF', border: theme === 'dark' ? '1px solid #222' : '1px solid #E5E7EB', borderRadius: '1rem', color: theme === 'dark' ? '#fff' : '#1F2937', fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="balance" stroke="#F4C150" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expenses */}
        <div className={`p-6 md:p-10 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <h3 className={`text-lg md:text-xl font-black uppercase tracking-tighter mb-8 ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Despesas por Categoria</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={categoryExpenses.length > 0 ? categoryExpenses : [{name:'Sem dados',value:0}]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#E5E7EB'} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#fff' : '#1F2937', fontSize: 9, fontWeight: 900}} width={80} />
                <Tooltip
                  cursor={{fill: theme === 'dark' ? '#1A1A1A' : '#F8F9FA'}}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#161616' : '#FFFFFF', border: theme === 'dark' ? '1px solid #222' : '1px solid #E5E7EB', borderRadius: '1rem', color: theme === 'dark' ? '#fff' : '#1F2937', fontSize: '10px' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projected Cash Flow */}
      {projectedData.length > 0 && (
        <div className={`p-6 md:p-10 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
          <h3 className={`text-lg md:text-xl font-black uppercase tracking-tighter mb-8 ${theme === 'dark' ? '' : 'text-[#1F2937]'}`}>Projeção Futura (Próximos 3 Meses)</h3>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={projectedData.length > 0 ? projectedData : [{date:'Sem dados',projectedIncome:0,projectedExpense:0}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#E5E7EB'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#444' : '#6B7280', fontSize: 9, fontWeight: 900}} />
                <Tooltip
                  cursor={{fill: theme === 'dark' ? '#1A1A1A' : '#F8F9FA'}}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#161616' : '#FFFFFF', border: theme === 'dark' ? '1px solid #222' : '1px solid #E5E7EB', borderRadius: '1rem', color: theme === 'dark' ? '#fff' : '#1F2937', fontSize: '10px' }}
                />
                <Bar dataKey="projectedIncome" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="projectedExpense" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
