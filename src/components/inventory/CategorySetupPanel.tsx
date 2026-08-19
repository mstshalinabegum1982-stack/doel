import React, { useRef } from 'react';
import { Layers, Edit, Trash2, X, Save, ArrowRight, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import { InventoryItem } from '../../types';

interface CategorySetupPanelProps {
  customCategories: { id: string; name: string; imageUrl?: string }[];
  items: InventoryItem[];
  editingCatId: string | null;
  newCatName: string;
  setNewCatName: (v: string) => void;
  newCatImage: string;
  setNewCatImage: (v: string) => void;
  presetCategoryImages: { name: string; url: string; icon: string }[];
  handleSaveCategory: () => void;
  handleEditCategory: (cat: { id: string; name: string; imageUrl?: string }) => void;
  handleCancelCatEdit: () => void;
  setCatToDelete: (cat: { id: string; name: string } | null) => void;
  setShowCatDeleteModal: (show: boolean) => void;
  onSelectCategory: (name: string) => void;
  onSwitchToListTab: () => void;
}

export const CategorySetupPanel: React.FC<CategorySetupPanelProps> = ({
  customCategories,
  items,
  editingCatId,
  newCatName,
  setNewCatName,
  newCatImage,
  setNewCatImage,
  presetCategoryImages,
  handleSaveCategory,
  handleEditCategory,
  handleCancelCatEdit,
  setCatToDelete,
  setShowCatDeleteModal,
  onSelectCategory,
  onSwitchToListTab,
}) => {
  const catFileInputRef = useRef<HTMLInputElement>(null);

  const handleCatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCatImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="glass-card p-5 sm:p-6 border-dragon-cyan/20 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-dragon-cyan/10 rounded-xl text-dragon-cyan">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                {editingCatId ? 'Edit Category' : 'Category Setup'}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                Create & manage categories with custom circular photos
              </p>
            </div>
          </div>
          {editingCatId && (
            <button
              onClick={handleCancelCatEdit}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <X size={12} /> Cancel Edit
            </button>
          )}
        </div>

        {/* Category Form */}
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative group cursor-pointer" onClick={() => catFileInputRef.current?.click()}>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-pink-500 dark:border-white/20 category-circle-border bg-white/5 flex items-center justify-center shadow-lg transition-transform hover:scale-105 relative">
                  {newCatImage ? (
                    <img src={newCatImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <ImageIcon size={20} />
                      <span className="text-[7px] uppercase font-bold mt-0.5 text-dragon-cyan">Photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                    Change
                  </div>
                </div>
                {newCatImage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setNewCatImage(''); }}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:scale-110 transition-all shadow-md z-10 cursor-pointer"
                    title="Remove Image"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <span className="text-[8px] font-bold text-pink-500 dark:text-gray-400 uppercase tracking-widest">
                Circle Photo
              </span>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Category Name</label>
                <input
                  type="text"
                  placeholder="Enter category name... (e.g. Cooker, Electronics, Fashion)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-dragon-cyan/50 focus:bg-white/10 transition-all text-xs text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={catFileInputRef}
                  onChange={handleCatImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => catFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload size={12} className="text-dragon-cyan" /> Upload Photo
                </button>

                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={newCatImage.startsWith('data:') ? '' : newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[10px] text-white outline-none focus:border-dragon-cyan"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Quick Select Preset Image:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetCategoryImages.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewCatImage(preset.url);
                    if (!newCatName) setNewCatName(preset.name.split('/')[0].trim());
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-[10px] text-gray-300 font-bold transition-all cursor-pointer"
                >
                  <img src={preset.url} alt={preset.name} className="w-4 h-4 rounded-full object-cover border border-pink-500 dark:border-white/20" />
                  <span>{preset.icon} {preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveCategory}
              className="px-6 py-3 bg-dragon-cyan hover:bg-dragon-cyan/90 text-dragon-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-dragon-cyan/15 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Save size={14} /> {editingCatId ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h4 className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
            <Tag size={12} className="text-dragon-cyan" /> Active Categories
          </h4>
          <span className="text-[9px] font-mono text-dragon-cyan bg-dragon-cyan/10 px-2 py-0.5 rounded border border-dragon-cyan/20">
            Total: {customCategories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {customCategories.length === 0 ? (
            <div className="col-span-full py-12 text-center glass-card border-dashed">
              <Layers size={36} className="mx-auto text-gray-800 mb-3" />
              <p className="text-xs text-gray-500 font-light italic">No categories set up yet.</p>
            </div>
          ) : (
            customCategories.map(cat => {
              const prodCount = items.filter(i => i.category === cat.name).length;
              return (
                <div 
                  key={cat.id} 
                  className="glass-card p-3.5 flex items-center justify-between gap-3 border-white/5 bg-white/[0.02] hover:border-dragon-cyan/30 transition-all group relative overflow-hidden"
                >
                  <div 
                    onClick={() => {
                      onSelectCategory(cat.name);
                      onSwitchToListTab();
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-pink-500 dark:border-white/20 category-circle-border shrink-0 shadow-md relative bg-white/5 cursor-pointer group-hover:scale-105 transition-transform"
                  >
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-dragon-cyan">
                        <Tag size={20} />
                      </div>
                    )}
                  </div>

                  <div 
                    onClick={() => {
                      onSelectCategory(cat.name);
                      onSwitchToListTab();
                    }}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <h5 className="font-sans font-bold text-xs text-white truncate group-hover:text-dragon-cyan transition-colors">
                      {cat.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-dragon-cyan bg-dragon-cyan/10 px-1.5 py-0.5 rounded font-bold">
                        {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-0.5 hover:text-dragon-cyan">
                        View <ArrowRight size={9} />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditCategory(cat)}
                      className="p-1.5 bg-dragon-cyan/10 hover:bg-dragon-cyan text-dragon-cyan hover:text-dragon-black rounded-lg border border-dragon-cyan/20 transition-all cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        setCatToDelete({ id: cat.id, name: cat.name });
                        setShowCatDeleteModal(true);
                      }}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg border border-red-500/10 transition-all cursor-pointer shadow-sm shadow-black"
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySetupPanel;
