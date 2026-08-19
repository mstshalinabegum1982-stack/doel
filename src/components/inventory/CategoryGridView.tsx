import React from 'react';
import { Tag, Plus, ArrowRight } from 'lucide-react';
import { InventoryItem } from '../../types';

interface CategoryGridViewProps {
  displayCategories: { id: string; name: string; imageUrl?: string }[];
  items: InventoryItem[];
  customCategories: { id: string; name: string; imageUrl?: string }[];
  search: string;
  loading: boolean;
  categoriesLoading: boolean;
  onSelectCategory: (categoryName: string) => void;
  onCreateCategoryClick: () => void;
}

export const CategoryGridView: React.FC<CategoryGridViewProps> = ({
  displayCategories,
  items,
  customCategories,
  search,
  loading,
  categoriesLoading,
  onSelectCategory,
  onCreateCategoryClick
}) => {
  if ((loading || categoriesLoading) && customCategories.length === 0 && items.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-[#f43f5e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredCategories = displayCategories.filter(
    cat => !search || cat.name.toLowerCase().includes(search.toLowerCase()) || items.some(i => i.category === cat.name && i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const uncategorizedItems = items.filter(i => !i.category || !customCategories.some(c => c.name === i.category));

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Tag size={18} className="text-[#f43f5e]" />
          <span>PRODUCT CATEGORIES ({displayCategories.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
        {displayCategories.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-8 border border-pink-100 text-center space-y-3 my-2">
            <div className="w-16 h-16 rounded-full bg-pink-50 text-[#f43f5e] mx-auto flex items-center justify-center">
              <Tag size={32} />
            </div>
            <h4 className="font-extrabold text-base text-slate-800">No Categories Setup Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please set up your product categories in "Category Setup" or click below to start creating products.
            </p>
            <button
              onClick={onCreateCategoryClick}
              className="px-5 py-2.5 bg-[#f43f5e] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:bg-[#e11d48] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create Category
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const catProducts = items.filter(i => i.category === cat.name);
            const prodCount = catProducts.length;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center gap-3 group relative overflow-hidden"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[#f43f5e] p-0.5 bg-pink-50 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 relative shrink-0">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-pink-100 flex items-center justify-center text-[#f43f5e]">
                      <Tag size={36} />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 w-full">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800 uppercase tracking-tight truncate group-hover:text-[#f43f5e] transition-colors">
                    {cat.name}
                  </h4>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f43f5e] bg-[#fff0f5] border border-pink-200 px-3 py-0.5 rounded-full">
                      {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(cat.name);
                  }}
                  className="w-full py-2.5 bg-white group-hover:bg-[#f43f5e] text-[#f43f5e] group-hover:text-white border border-pink-200 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer mt-1"
                >
                  <span>VIEW PRODUCTS</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })
        )}

        {uncategorizedItems.length > 0 && (
          <div
            onClick={() => onSelectCategory('Uncategorized')}
            className="bg-white rounded-3xl p-5 border border-amber-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center gap-3 group relative overflow-hidden"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-amber-500 bg-amber-50 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0 text-amber-500 font-black text-3xl">
              ?
            </div>
            <div className="space-y-1.5 w-full">
              <h4 className="font-extrabold text-sm sm:text-base text-amber-600 uppercase tracking-tight truncate">
                Uncategorized
              </h4>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full">
                  {uncategorizedItems.length} Products
                </span>
              </div>
            </div>
            <button className="w-full py-2.5 bg-white group-hover:bg-amber-500 text-amber-600 group-hover:text-white border border-amber-200 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer mt-1">
              <span>VIEW PRODUCTS</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGridView;
