import React, { useContext } from 'react';
import { ArrowLeft, Plus, Search, Tag, Check, Trash2, Edit, Package, Eye, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '../../types';
import { AuthContext } from '../../authContext';
import { getCurrencySymbol } from '../../utils/countriesData';
import { cn } from '../../lib/utils';

interface ProductTableProps {
  activeCategoryFilter: string;
  selectedCatObj?: { id: string; name: string; imageUrl?: string };
  catProducts: InventoryItem[];
  filteredCatProducts: InventoryItem[];
  search: string;
  setSearch: (v: string) => void;
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  handleBulkDelete: () => void;
  onBackToCategories: () => void;
  onAddProductClick: () => void;
  onEditProduct: (item: InventoryItem) => void;
  onDeleteProduct: (id: string) => void;
  onPreviewProduct: (item: InventoryItem) => void;
}

function InventoryCard({
  item,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  userId,
  onPreview
}: {
  item: InventoryItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  userId: string;
  onPreview: () => void;
}) {
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext);
  const currencySymbol = profile?.country ? getCurrencySymbol(profile.country) : "৳";
  const smartLink = `${window.location.origin}/order/${item.id}/${userId}`;

  return (
    <div className={cn(
      "bg-white dark:bg-[#0f131f] border rounded-2xl p-2.5 flex flex-col group relative overflow-hidden transition-all shadow-sm hover:shadow-md",
      isSelected ? "border-[#f43f5e] dark:border-dragon-cyan bg-pink-50/50 dark:bg-dragon-cyan/10 ring-2 ring-pink-300 dark:ring-dragon-cyan/50" : "border-slate-200 dark:border-white/10 hover:border-pink-300 dark:hover:border-dragon-cyan/50"
    )}>
      <button 
        onClick={onToggleSelect}
        className={cn(
          "absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center transition-all z-20 cursor-pointer",
          isSelected ? "bg-[#f43f5e] dark:bg-dragon-cyan border-[#f43f5e] dark:border-dragon-cyan" : "border-slate-300 dark:border-white/20 bg-white/80 dark:bg-black/60 backdrop-blur-sm"
        )}
      >
        {isSelected && <Check size={10} className="text-white dark:text-black" />}
      </button>

      <div 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="aspect-square w-full rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden flex-shrink-0 relative cursor-pointer"
      >
        {item.image ? (
          <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
        ) : (
          <Package className="w-full h-full p-6 text-slate-300 dark:text-gray-600" />
        )}

        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10 p-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="p-1.5 bg-white dark:bg-white/20 text-slate-800 dark:text-white rounded-lg hover:bg-[#f43f5e] dark:hover:bg-dragon-cyan hover:text-white dark:hover:text-black transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title="Edit"
          >
            <Edit size={12} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              navigator.clipboard.writeText(smartLink);
              alert('Smart Order Link Copied!');
            }}
            className="p-1.5 bg-white dark:bg-white/20 text-slate-800 dark:text-white rounded-lg hover:bg-[#f43f5e] dark:hover:bg-dragon-cyan hover:text-white dark:hover:text-black transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title="Copy Smart Link"
          >
            <LinkIcon size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPreview(); }} 
            className="p-1.5 bg-white dark:bg-white/20 text-slate-800 dark:text-white rounded-lg hover:bg-[#f43f5e] dark:hover:bg-dragon-cyan hover:text-white dark:hover:text-black transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title="Preview page"
          >
            <Eye size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="p-1.5 bg-white dark:bg-white/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate uppercase tracking-tight">{item.name}</h4>
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-[#f43f5e] dark:text-dragon-cyan">{currencySymbol}{item.sellPrice}</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-gray-300 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
            Stock: {item.isUnlimitedStock ? "♾️" : item.stock}
          </span>
        </div>
        {item.supplierName && (
          <div className="flex items-center justify-between gap-1 p-1 rounded-lg bg-slate-50 border border-slate-100 mt-1">
            <span className="text-[9px] text-slate-500 truncate font-semibold">
              Supplier: {item.supplierName}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/chat/new_${item.supplierId}`, { state: { otherUser: { uid: item.supplierId, name: item.supplierName } } });
              }}
              className="p-1 text-[#f43f5e] bg-pink-50 hover:bg-[#f43f5e] hover:text-white rounded transition-all flex items-center justify-center cursor-pointer"
              title="Supplier Messenger"
            >
              <Eye size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const ProductTable: React.FC<ProductTableProps> = ({
  activeCategoryFilter,
  selectedCatObj,
  catProducts,
  filteredCatProducts,
  search,
  setSearch,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  handleBulkDelete,
  onBackToCategories,
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onPreviewProduct
}) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBackToCategories}
          className="px-4 py-2.5 bg-pink-50 hover:bg-[#f43f5e] text-[#f43f5e] hover:text-white border border-pink-200 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft size={16} /> Back To All Categories
        </button>

        <button
          onClick={onAddProductClick}
          className="px-4 py-2.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-105 transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Product to {activeCategoryFilter}
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#f43f5e] p-0.5 bg-pink-50 shrink-0 shadow-md flex items-center justify-center">
            {selectedCatObj?.imageUrl ? (
              <img src={selectedCatObj.imageUrl} alt={activeCategoryFilter} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full bg-pink-100 flex items-center justify-center text-[#f43f5e]">
                <Tag size={32} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-extrabold text-lg sm:text-xl text-slate-800 uppercase tracking-wider">{activeCategoryFilter}</h2>
              <span className="text-xs font-bold text-[#f43f5e] bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                {catProducts.length} {catProducts.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Showing products strictly listed inside {activeCategoryFilter} category</p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={`Search in ${activeCategoryFilter}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 outline-none focus:border-[#f43f5e] text-xs font-medium text-slate-800"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSelectAll}
            className="text-[10px] font-black uppercase tracking-wider text-[#f43f5e] flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <div className={cn(
              "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
              selectedIds.length === filteredCatProducts.length && filteredCatProducts.length > 0 ? "bg-[#f43f5e] border-[#f43f5e]" : "border-slate-300"
            )}>
              {selectedIds.length === filteredCatProducts.length && filteredCatProducts.length > 0 && <Check size={8} className="text-white" />}
            </div>
            {selectedIds.length === filteredCatProducts.length && filteredCatProducts.length > 0 ? 'Unselect All' : 'Select All'}
          </button>
          {selectedIds.length > 0 && (
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedIds.length} Selected</span>
          )}
        </div>

        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center gap-1.5 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest cursor-pointer"
          >
            <Trash2 size={14} />
            Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {filteredCatProducts.length === 0 ? (
        <div className="py-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-3 p-8">
          <p className="text-xs text-slate-500 italic">No products added in {activeCategoryFilter} category yet.</p>
          <button
            onClick={onAddProductClick}
            className="px-5 py-2.5 bg-[#f43f5e] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-105 shadow-md shadow-pink-200 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={16} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCatProducts.map(item => (
            <InventoryCard 
              key={item.id} 
              item={item} 
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onEdit={() => onEditProduct(item)}
              onDelete={() => onDeleteProduct(item.id)}
              userId={user?.uid || ''}
              onPreview={() => onPreviewProduct(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductTable;
