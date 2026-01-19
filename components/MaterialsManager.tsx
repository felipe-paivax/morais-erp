
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Material } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface MaterialsManagerProps {
  materials: Material[];
  onUpdateMaterial: (material: Material) => void;
  onCreateMaterial: (material: Material) => void;
}

type SortConfig = {
  key: keyof Material;
  direction: 'asc' | 'desc';
} | null;

const MaterialsManager: React.FC<MaterialsManagerProps> = ({ materials, onUpdateMaterial, onCreateMaterial }) => {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    category: 'Básico',
    unit: 'un',
    description: '',
    minStock: 0
  });

  const categories = ['Básico', 'Estrutural', 'Acabamento', 'Elétrica', 'Hidráulica', 'Madeiramento', 'Fixação', 'Agregados', 'Pintura', 'Metais', 'Geral'];
  const units = ['un', 'kg', 'm', 'm2', 'm3', 'sc', 'lt', 'pc', 'par', 'rl'];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const sortedMaterials = useMemo(() => {
    const sortableItems = [...filteredMaterials];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredMaterials, sortConfig]);

  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedMaterials.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedMaterials, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);

  const requestSort = (key: keyof Material) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      category: 'Básico',
      unit: 'un',
      description: '',
      minStock: 0
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.category) return;

    if (editingMaterial) {
      onUpdateMaterial({ ...editingMaterial, ...formData } as Material);
    } else {
      const newMaterial: Material = {
        ...formData as Material,
        id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      onCreateMaterial(newMaterial);
    }
    setShowForm(false);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData(material);
    setShowForm(true);
  };

  const SortIcon = ({ column }: { column: keyof Material }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <svg className={`w-3 h-3 ml-1 ${theme === 'dark' ? 'opacity-20' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    ) : (
      <svg className="w-3 h-3 ml-1 text-[#F4C150]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
    );
  };

  return (
    <div className={`space-y-8 animate-subtle-fade ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8 gap-6 ${theme === 'dark' ? 'border-[#222222]' : 'border-[#E5E7EB]'}`}>
        <div>
          <h2 className={`text-2xl md:text-4xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>Catálogo de Materiais</h2>
          <p className="text-xs text-[#F4C150] font-black uppercase tracking-[0.3em] mt-2">Gestão de {materials.length} itens cadastrados</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group w-full sm:w-80">
            <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-[#F4C150] transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-[#9CA3AF]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <input 
              type="text" 
              placeholder="PESQUISAR MATERIAL OU CATEGORIA..."
              className={`w-full pl-12 pr-6 py-4 border rounded-2xl text-[10px] font-black tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#161616] border-[#222222] text-white placeholder:text-gray-700' : 'bg-white border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="whitespace-nowrap bg-[#F4C150] text-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(244,193,80,0.1)] hover:scale-105 transition-all"
          >
            Novo Material
          </button>
        </div>
      </div>

      <div className={`border rounded-[2rem] overflow-hidden flex flex-col shadow-sm ${theme === 'dark' ? 'bg-[#161616] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`}>
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-[#222222] bg-[#1a1a1a]/50' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
                <th 
                  className={`px-8 py-6 text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">Descrição do Item <SortIcon column="name" /></div>
                </th>
                <th 
                  className={`px-8 py-6 text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('category')}
                >
                  <div className="flex items-center">Categoria <SortIcon column="category" /></div>
                </th>
                <th 
                  className={`px-8 py-6 text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
                  onClick={() => requestSort('unit')}
                >
                  <div className="flex items-center">Und. Medida <SortIcon column="unit" /></div>
                </th>
                <th className={`px-8 py-6 text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>ID Técnico</th>
                <th className={`px-8 py-6 text-[9px] font-black uppercase tracking-widest text-right ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>Ações</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-y divide-[#1A1A1A]' : 'divide-y divide-[#E5E7EB]'}>
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-8 py-32 text-center ${theme === 'dark' ? 'opacity-20' : 'opacity-40'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-white' : 'text-[#6B7280]'}`}>Nenhum material encontrado no catálogo</p>
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((material, index) => (
                  <tr key={material.id} className={`transition-colors group ${theme === 'dark' ? 'hover:bg-white/[0.02]' : index % 2 === 0 ? 'bg-white hover:bg-[#F8F9FA]' : 'bg-[#F8F9FA] hover:bg-[#F2F3F5]'}`}>
                    <td className="px-8 py-6">
                      <p className={`text-xs font-black uppercase tracking-tight transition-colors ${theme === 'dark' ? 'text-white group-hover:text-[#F4C150]' : 'text-[#1F2937] group-hover:text-[#F4C150]'}`}>{material.name}</p>
                      <p className={`text-[8px] font-bold tracking-widest uppercase mt-0.5 truncate max-w-[300px] ${theme === 'dark' ? 'text-gray-600' : 'text-[#6B7280]'}`}>{material.description || 'Sem descrição técnica'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black uppercase px-3 py-1 border rounded-full ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222] text-gray-400' : 'bg-[#F2F3F5] border-[#E5E7EB] text-[#4B5563]'}`}>
                        {material.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-[#4B5563]'}`}>{material.unit}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black font-mono ${theme === 'dark' ? 'text-gray-600' : 'text-[#9CA3AF]'}`}>{material.id}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleEdit(material)}
                        className={`p-3 border rounded-xl transition-all ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222] text-gray-500 hover:text-[#F4C150] hover:border-[#F4C150]/50' : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#F4C150] hover:border-[#F4C150]/50'}`}
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

        <div className={`px-8 py-6 border-t flex flex-col sm:flex-row justify-between items-center gap-6 ${theme === 'dark' ? 'bg-[#1a1a1a]/30 border-[#222]' : 'bg-[#F8F9FA] border-[#E5E7EB]'}`}>
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
               Total: {sortedMaterials.length}
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
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-[2.5rem] border shadow-2xl overflow-y-auto max-h-[90vh] z-[10000] ${theme === 'dark' ? 'bg-[#121212] border-[#222222]' : 'bg-white border-[#E5E7EB]'}`} style={{ animation: 'fadeInModal 0.3s ease-out' }}>
            <div className={`p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <div>
                <h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>{editingMaterial ? 'Editar Material' : 'Novo Registro'}</h3>
                <p className="text-[9px] text-[#F4C150] font-bold uppercase tracking-widest">Informação Técnica de Insumo</p>
              </div>
              <button onClick={() => setShowForm(false)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1A1A1A] text-white hover:text-[#F4C150]' : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#F4C150] hover:border-[#D1D5DB]'}`}>✕</button>
            </div>
            
            <div className={`p-8 space-y-8 ${theme === 'dark' ? 'text-white' : 'text-[#1F2937]'}`}>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Nome do Material</label>
                <input 
                  type="text" 
                  placeholder="EX: CIMENTO CP-II 50KG"
                  className={`w-full p-5 border rounded-2xl text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Categoria</label>
                  <select 
                    className={`w-full p-5 border rounded-2xl text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Unidade</label>
                  <select 
                    className={`w-full p-5 border rounded-2xl text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] hover:border-[#D1D5DB]'}`}
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ml-4 tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-[#6B7280]'}`}>Descrição Técnica / Observações</label>
                <textarea 
                  placeholder="DETALHAMENTO DO MATERIAL, MARCAS DE PREFERÊNCIA, ETC..."
                  className={`w-full p-5 border rounded-2xl text-xs font-bold tracking-widest focus:border-[#F4C150] transition-all outline-none uppercase min-h-[100px] resize-none ${theme === 'dark' ? 'bg-[#1A1A1A] border-[#222222] text-white' : 'bg-[#F8F9FA] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB]'}`}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className={`p-8 border-t flex flex-col sm:flex-row justify-end gap-6 ${theme === 'dark' ? 'border-[#1A1A1A] bg-[#161616]' : 'border-[#E5E7EB] bg-[#F8F9FA]'}`}>
              <button onClick={() => setShowForm(false)} className={`order-2 sm:order-1 text-[10px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-white' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>Cancelar</button>
              <button 
                onClick={handleSave}
                disabled={!formData.name || !formData.category}
                className={`order-1 sm:order-2 px-12 py-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-10 shadow-[0_0_30px_rgba(244,193,80,0.1)] transition-colors ${theme === 'dark' ? 'bg-[#F4C150] text-black hover:bg-[#ffcf66]' : 'bg-[#F4C150] text-[#1F2937] hover:bg-[#ffcf66]'}`}
              >
                {editingMaterial ? 'Confirmar Edição' : 'Concluir Cadastro'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default MaterialsManager;
