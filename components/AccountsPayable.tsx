
import React, { useState, useMemo } from 'react';
import { AccountPayable, Project, Supplier, PaymentStatus, PaymentMethod, TransactionCategory } from '../types';

interface AccountsPayableProps {
  accountsPayable: AccountPayable[];
  projects: Project[];
  suppliers: Supplier[];
  onUpdate: (account: AccountPayable) => void;
  onCreate: (account: AccountPayable) => void;
}

const AccountsPayable: React.FC<AccountsPayableProps> = ({
  accountsPayable,
  projects,
  suppliers,
  onUpdate,
  onCreate
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');

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
    return accountsPayable.filter(account => {
      if (filterStatus !== 'all' && account.status !== filterStatus) return false;
      if (filterProject !== 'all' && account.projectId !== filterProject) return false;
      if (filterSupplier !== 'all' && account.supplierId !== filterSupplier) return false;
      return true;
    });
  }, [accountsPayable, filterStatus, filterProject, filterSupplier]);

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
        return 'border-[#F4C150] text-[#F4C150] bg-[#F4C150]/5';
      case PaymentStatus.PAID:
        return 'border-green-500 text-green-500 bg-green-500/5';
      case PaymentStatus.OVERDUE:
        return 'border-red-500 text-red-500 bg-red-500/5';
      case PaymentStatus.CANCELLED:
        return 'border-gray-600 text-gray-600 bg-gray-600/5';
      default:
        return 'border-gray-500 text-gray-500';
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
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pendentes</p>
          <p className="text-3xl font-black tracking-tighter text-[#F4C150]">{stats.pending}</p>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pagas</p>
          <p className="text-3xl font-black tracking-tighter text-green-500">{stats.paid}</p>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vencidas</p>
          <p className="text-3xl font-black tracking-tighter text-red-500">{stats.overdue}</p>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Pendente</p>
          <p className="text-2xl font-black tracking-tighter">R$ {(stats.totalPending / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-[#161616] p-6 md:p-8 rounded-[2rem] border border-[#222222]">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total Pago</p>
          <p className="text-2xl font-black tracking-tighter text-green-500">R$ {(stats.totalPaid / 1000).toFixed(0)}k</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#222222] pb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'all')}
            className="px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-xs font-bold text-white focus:border-[#F4C150] outline-none"
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
            className="px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-xs font-bold text-white focus:border-[#F4C150] outline-none"
          >
            <option value="all">Todas as Obras</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-4 py-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-xs font-bold text-white focus:border-[#F4C150] outline-none"
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

      {/* Accounts Table */}
      <div className="bg-[#161616] border border-[#222222] rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#222222] bg-[#1a1a1a]/50">
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Fornecedor</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Obra</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Descrição</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Valor</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimento</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                <th className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 md:p-20 text-center opacity-30">
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">Nenhuma conta encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(account => {
                  const supplier = suppliers.find(s => s.id === account.supplierId);
                  const project = projects.find(p => p.id === account.projectId);
                  const overdue = isOverdue(account.dueDate) && account.status === PaymentStatus.PENDING;
                  
                  return (
                    <tr key={account.id} className="border-b border-[#1A1A1A] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className="text-xs md:text-sm font-black uppercase truncate max-w-[150px]">{supplier?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className="text-xs md:text-sm font-bold uppercase truncate max-w-[150px]">{project?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className="text-xs md:text-sm font-bold truncate max-w-[200px]">{account.description}</p>
                        <p className="text-[8px] md:text-[9px] text-gray-600 uppercase mt-1">{account.category}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className="text-xs md:text-sm font-black">R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-6 md:px-10 py-6 md:py-8">
                        <p className={`text-xs md:text-sm font-bold ${overdue ? 'text-red-500' : ''}`}>
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
                              className="p-2 bg-[#1A1A1A] border border-[#222222] rounded-xl text-gray-400 hover:text-green-500 hover:border-green-500 transition-all"
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
      </div>

      {/* Create Account Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-[#121212] w-full max-w-2xl rounded-[3rem] border border-[#222222] shadow-2xl animate-subtle-fade overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-[#1A1A1A] flex justify-between items-center bg-[#161616]">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Nova Conta a Pagar</h3>
                <p className="text-[10px] text-[#F4C150] font-black uppercase tracking-widest">Registro Manual</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:text-[#F4C150]">✕</button>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Obra</label>
                  <select
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none uppercase"
                    value={newAccount.projectId}
                    onChange={(e) => setNewAccount({...newAccount, projectId: e.target.value})}
                  >
                    <option value="">SELECIONAR OBRA</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Fornecedor</label>
                  <select
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none uppercase"
                    value={newAccount.supplierId}
                    onChange={(e) => setNewAccount({...newAccount, supplierId: e.target.value})}
                  >
                    <option value="">SELECIONAR FORNECEDOR</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Descrição</label>
                <input
                  type="text"
                  placeholder="EX: COMPRA DE MATERIAIS PARA OBRA"
                  className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none uppercase"
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none"
                    value={newAccount.amount || ''}
                    onChange={(e) => setNewAccount({...newAccount, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Vencimento</label>
                  <input
                    type="date"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none"
                    value={newAccount.dueDate}
                    onChange={(e) => setNewAccount({...newAccount, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Categoria</label>
                  <select
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none uppercase"
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
            <div className="p-10 border-t border-[#1A1A1A] flex justify-end gap-6 bg-[#161616]">
              <button onClick={() => setShowForm(false)} className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cancelar</button>
              <button
                onClick={handleCreateAccount}
                disabled={!newAccount.projectId || !newAccount.supplierId || !newAccount.description || !newAccount.amount}
                className="bg-[#F4C150] text-black px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[70] flex items-center justify-center p-4">
          <div className="bg-[#121212] w-full max-w-md rounded-[3rem] border border-[#222222] shadow-2xl animate-subtle-fade">
            <div className="p-10 border-b border-[#1A1A1A] flex justify-between items-center bg-[#161616]">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Registrar Pagamento</h3>
                <p className="text-[10px] text-[#F4C150] font-black uppercase tracking-widest">Confirmação de Pagamento</p>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:text-[#F4C150]">✕</button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Data do Pagamento</label>
                <input
                  type="date"
                  className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Método de Pagamento</label>
                <select
                  className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold focus:border-[#F4C150] outline-none uppercase"
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
            <div className="p-10 border-t border-[#1A1A1A] flex justify-end gap-6 bg-[#161616]">
              <button onClick={() => setShowPaymentModal(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cancelar</button>
              <button
                onClick={() => handleMarkAsPaid(showPaymentModal)}
                className="bg-green-500 text-white px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-green-600"
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;
