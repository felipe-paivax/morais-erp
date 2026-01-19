
import React, { useState } from 'react';
import { AccountPayable, AccountReceivable, Project, Supplier, Client } from '../types';
import AccountsPayable from './AccountsPayable';
import AccountsReceivable from './AccountsReceivable';
import CashFlow from './CashFlow';
import FinancialReports from './FinancialReports';
import { useTheme } from '../contexts/ThemeContext';

interface FinanceManagerProps {
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  projects: Project[];
  suppliers: Supplier[];
  clients: Client[];
  onUpdateAccountPayable: (account: AccountPayable) => void;
  onCreateAccountPayable: (account: AccountPayable) => void;
  onUpdateAccountReceivable: (account: AccountReceivable) => void;
  onCreateAccountReceivable: (account: AccountReceivable) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({
  accountsPayable,
  accountsReceivable,
  projects,
  suppliers,
  clients,
  onUpdateAccountPayable,
  onCreateAccountPayable,
  onUpdateAccountReceivable,
  onCreateAccountReceivable
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable' | 'cashflow' | 'reports'>('payable');

  const tabs = [
    { id: 'payable' as const, label: 'Contas a Pagar', desc: 'Despesas e fornecedores' },
    { id: 'receivable' as const, label: 'Contas a Receber', desc: 'Receitas e clientes' },
    { id: 'cashflow' as const, label: 'Fluxo de Caixa', desc: 'Entradas e saídas' },
    { id: 'reports' as const, label: 'Relatórios', desc: 'Análises financeiras' },
  ];

  return (
    <div className={`space-y-8 md:space-y-12 animate-subtle-fade ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-6 gap-4 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
        <div>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Módulo Financeiro</h2>
          <p className="text-xs text-[#F4C150] font-black uppercase tracking-[0.3em] mt-1">Gestão completa de fluxo e custos</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`flex flex-wrap gap-3 border-b pb-4 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-[#F4C150] text-black shadow-[0_0_30px_rgba(244,193,80,0.2)]'
                : (theme === 'dark' ? 'bg-[#1A1A1A] text-gray-500 border border-[#222222] hover:border-gray-700' : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:border-[#D1D5DB]')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'payable' && (
          <AccountsPayable
            accountsPayable={accountsPayable}
            projects={projects}
            suppliers={suppliers}
            onUpdate={onUpdateAccountPayable}
            onCreate={onCreateAccountPayable}
          />
        )}
        {activeTab === 'receivable' && (
          <AccountsReceivable
            accountsReceivable={accountsReceivable}
            projects={projects}
            clients={clients}
            onUpdate={onUpdateAccountReceivable}
            onCreate={onCreateAccountReceivable}
          />
        )}
        {activeTab === 'cashflow' && (
          <CashFlow
            accountsPayable={accountsPayable}
            accountsReceivable={accountsReceivable}
            projects={projects}
          />
        )}
        {activeTab === 'reports' && (
          <FinancialReports
            accountsPayable={accountsPayable}
            accountsReceivable={accountsReceivable}
            projects={projects}
          />
        )}
      </div>
    </div>
  );
};

export default FinanceManager;
