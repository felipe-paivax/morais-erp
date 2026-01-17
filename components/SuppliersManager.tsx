
import React, { useState, useMemo, useEffect } from 'react';
import { Supplier } from '../types';

interface SuppliersManagerProps {
  suppliers: Supplier[];
  onUpdateSupplier: (supplier: Supplier) => void;
  onCreateSupplier: (supplier: Supplier) => void;
}

type SortConfig = {
  key: keyof Supplier;
  direction: 'asc' | 'desc';
} | null;

const SuppliersManager: React.FC<SuppliersManagerProps> = ({ suppliers, onUpdateSupplier, onCreateSupplier }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de Paginação e Ordenação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    category: 'Geral',
    email: '',
    phone: '',
    document: '',
    contactPerson: '',
    website: '',
    rating: 5.0
  });

  // Resetar página quando a busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // 1. Filtragem
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.document && s.document.includes(searchTerm))
    );
  }, [suppliers, searchTerm]);

  // 2. Ordenação
  const sortedSuppliers = useMemo(() => {
    const sortableItems = [...filteredSuppliers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredSuppliers, sortConfig]);

  // 3. Paginação
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSuppliers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);

  const requestSort = (key: keyof Supplier) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      category: 'Geral',
      email: '',
      phone: '',
      document: '',
      contactPerson: '',
      website: '',
      rating: 5.0
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return;

    if (editingSupplier) {
      onUpdateSupplier({ ...editingSupplier, ...formData } as Supplier);
    } else {
      const newSupplier: Supplier = {
        ...formData as Supplier,
        id: `S-${Math.floor(1000 + Math.random() * 9000)}`,
        rating: 5.0
      };
      onCreateSupplier(newSupplier);
    }
    setShowForm(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowForm(true);
  };

  const SortIcon = ({ column }: { column: keyof Supplier }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return (
        <svg className="w-3 h-3 ml-1 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
  };

  return (
    <div className="space-y-8 animate-subtle-fade text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#222222] pb-8 gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Base de Fornecedores</h2>
          <p className="text-xs text-[#F4C150] font-black uppercase tracking-[0.3em] mt-2">Gestão de {suppliers.length} parceiros homologados</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group w-full sm:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#F4C150] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <input 
              type="text" 
              placeholder="PESQUISAR NOME, CATEGORIA OU CNPJ..."
              className="w-full pl-12 pr-6 py-4 bg-[#161616] border border-[#222222] rounded-2xl text-[10px] font-black tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase placeholder:text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="whitespace-nowrap bg-[#F4C150] text-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(244,193,80,0.1)] hover:scale-105 transition-all"
          >
            Novo Cadastro
          </button>
        </div>
      </div>

      {/* Scalable List / Table Section */}
      <div className="bg-[#161616] border border-[#222222] rounded-[2rem] overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222222] bg-[#1a1a1a]/50">
                <th 
                  className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-600 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">Identificação / Empresa <SortIcon column="name" /></div>
                </th>
                <th 
                  className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-600 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('category')}
                >
                  <div className="flex items-center">Categoria / Segmento <SortIcon column="category" /></div>
                </th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-600">Contato Direto</th>
                <th 
                  className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-600 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('rating')}
                >
                  <div className="flex items-center">Rating <SortIcon column="rating" /></div>
                </th>
                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-gray-600 text-right">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhum fornecedor encontrado na base</p>
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0B0B0B] border border-[#222] rounded-xl flex items-center justify-center font-black text-[10px] text-[#F4C150] group-hover:border-[#F4C150]/30 transition-all">
                          {supplier.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight group-hover:text-[#F4C150] transition-colors">{supplier.name}</p>
                          <p className="text-[8px] text-gray-600 font-bold tracking-widest uppercase mt-0.5">{supplier.document || 'DOC NÃO CADASTRADO'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] font-black uppercase px-3 py-1 bg-[#1A1A1A] border border-[#222] rounded-full text-gray-400">
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-bold text-gray-300">{supplier.email}</p>
                      <p className="text-[9px] text-gray-600 font-black mt-0.5">{supplier.phone || 'SEM TELEFONE'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5">
                        <div className="flex">
                           {[...Array(5)].map((_, i) => (
                             <svg key={i} className={`w-2.5 h-2.5 ${i < Math.floor(supplier.rating) ? 'text-[#F4C150]' : 'text-gray-800'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                           ))}
                        </div>
                        <span className="text-[9px] font-black text-[#F4C150] ml-1">{supplier.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleEdit(supplier)}
                        className="p-3 bg-[#1A1A1A] border border-[#222] rounded-xl text-gray-500 hover:text-[#F4C150] hover:border-[#F4C150]/50 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Pagination Controls */}
        <div className="bg-[#1a1a1a]/30 px-8 py-6 border-t border-[#222] flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Itens por página:</span>
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
               Total: {sortedSuppliers.length}
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
             
             <div className="flex items-center gap-1">
                <span className="px-4 py-2 bg-[#1A1A1A] border border-[#F4C150]/20 rounded-xl text-[10px] font-black text-[#F4C150]">
                  PÁGINA {currentPage} DE {totalPages || 1}
                </span>
             </div>

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

      {/* Registration Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="bg-[#121212] w-full max-w-2xl rounded-[2.5rem] border border-[#222222] shadow-2xl animate-subtle-fade overflow-y-auto max-h-[90vh]">
            <div className="p-8 border-b border-[#1A1A1A] flex justify-between items-center bg-[#161616]">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{editingSupplier ? 'Editar Registro' : 'Novo Credenciamento'}</h3>
                <p className="text-[9px] text-[#F4C150] font-bold uppercase tracking-widest">Ficha Cadastral de Fornecedor</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:text-[#F4C150]">✕</button>
            </div>
            
            <div className="p-8 space-y-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Razão Social / Fantasia</label>
                  <input 
                    type="text" 
                    placeholder="EX: MATERIAIS CONSTRUBEM LTDA"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Categoria Técnica</label>
                  <select 
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Geral">Suprimentos Gerais</option>
                    <option value="Estrutural">Materiais Estruturais</option>
                    <option value="Acabamento">Materiais de Acabamento</option>
                    <option value="Elétrica">Materiais Elétricos</option>
                    <option value="Hidráulica">Materiais Hidráulicos</option>
                    <option value="Serviços">Prestação de Serviços</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Documento (CNPJ)</label>
                  <input 
                    type="text" 
                    placeholder="00.000.000/0001-00"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none"
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Responsável Comercial</label>
                  <input 
                    type="text" 
                    placeholder="NOME DO VENDEDOR"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Canal de E-mail</label>
                  <input 
                    type="email" 
                    placeholder="vendas@fornecedor.com.br"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Contato Telefônico</label>
                  <input 
                    type="text" 
                    placeholder="(11) 99999-9999"
                    className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Website / Portfólio</label>
                <input 
                  type="text" 
                  placeholder="https://www.fornecedor.com.br"
                  className="w-full p-5 bg-[#1A1A1A] border border-[#222222] rounded-2xl text-white text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>

            <div className="p-8 border-t border-[#1A1A1A] flex flex-col sm:flex-row justify-end gap-6 bg-[#161616]">
              <button onClick={() => setShowForm(false)} className="order-2 sm:order-1 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Cancelar</button>
              <button 
                onClick={handleSave}
                disabled={!formData.name || !formData.email}
                className="order-1 sm:order-2 bg-[#F4C150] text-black px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10 shadow-[0_0_30px_rgba(244,193,80,0.1)]"
              >
                {editingSupplier ? 'Confirmar Edição' : 'Concluir Cadastro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersManager;
