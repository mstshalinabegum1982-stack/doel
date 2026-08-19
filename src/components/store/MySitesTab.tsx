import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { LandingPageData, ProWebsiteData } from './types';
import { MySiteBanner } from './MySiteBanner';
import { LandingPageCard } from './LandingPageCard';
import { ProWebsiteCard } from './ProWebsiteCard';

interface MySitesTabProps {
  loading: boolean;
  landingPages: LandingPageData[];
  proWebsites: ProWebsiteData[];
  filterType: 'all' | 'landing' | 'pro';
  setFilterType: (filter: 'all' | 'landing' | 'pro') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredLandingPages: LandingPageData[];
  filteredProWebsites: ProWebsiteData[];
  currentOrigin: string;
  copiedId: string | null;
  handleCopyLink: (url: string, id: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  handleDeleteItem: (collectionName: 'landing-pages' | 'pro_websites', id: string) => void;
  navigate: (path: string) => void;
  expandedReviewsSiteId: string | null;
  setExpandedReviewsSiteId: (id: string | null | ((prev: string | null) => string | null)) => void;
  onOpenBotActivationModal: (website: ProWebsiteData) => void;
  onOpenProductSelector: (website: ProWebsiteData) => void;
}

export const MySitesTab: React.FC<MySitesTabProps> = ({
  loading,
  landingPages,
  proWebsites,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  filteredLandingPages,
  filteredProWebsites,
  currentOrigin,
  copiedId,
  handleCopyLink,
  deleteConfirmId,
  setDeleteConfirmId,
  handleDeleteItem,
  navigate,
  expandedReviewsSiteId,
  setExpandedReviewsSiteId,
  onOpenBotActivationModal,
  onOpenProductSelector
}) => {
  const totalSitesCount = landingPages.length + proWebsites.length;

  return (
    <>
      {/* Dynamic Greeting & Stats Summary Card */}
      <MySiteBanner 
        landingPagesCount={landingPages.length} 
        proWebsitesCount={proWebsites.length}
        totalSitesCount={totalSitesCount}
        filterType={filterType}
        setFilterType={setFilterType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Loading Indicator */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold tracking-widest uppercase">Loading Sites...</p>
        </div>
      ) : (
        <>
          {/* Landing Pages Section inside My Site */}
          {(filterType === 'all' || filterType === 'landing') && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-pink-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-pink-600 dark:text-white">
                  My Landing Pages ({filteredLandingPages.length})
                </h2>
              </div>
              
              {filteredLandingPages.length === 0 ? (
                <div className="p-10 rounded-3xl bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 text-center shadow-sm">
                  <p className="text-xs text-pink-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-4">No Landing Pages Found</p>
                  {filterType === 'landing' && (
                    <button 
                      type="button"
                      onClick={() => navigate('/landing-pages')}
                      className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-pink-500/20"
                    >
                      Create New Landing Page
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredLandingPages.map((page, idx) => (
                    <LandingPageCard
                      key={`showcase-page-${page.id}-${idx}`}
                      page={page}
                      index={idx}
                      currentOrigin={currentOrigin}
                      copiedId={copiedId}
                      deleteConfirmId={deleteConfirmId}
                      onCopyLink={handleCopyLink}
                      onDeleteConfirm={(id) => setDeleteConfirmId(id)}
                      onDeleteItem={(col, id) => handleDeleteItem(col, id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pro Websites Section inside My Site */}
          {(filterType === 'all' || filterType === 'pro') && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-pink-600 rounded-full" />
                <h2 className="text-lg font-black tracking-tight text-pink-600 dark:text-white">
                  My Pro Websites ({filteredProWebsites.length})
                </h2>
              </div>

              {filteredProWebsites.length === 0 ? (
                <div className="p-10 rounded-3xl bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 text-center shadow-sm">
                  <p className="text-xs text-pink-600 dark:text-gray-400 font-bold uppercase tracking-wider mb-4">No Pro Websites Found</p>
                  {filterType === 'pro' && (
                    <button 
                      type="button"
                      onClick={() => navigate('/pro-website-settings/new')}
                      className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-pink-500/20"
                    >
                      Create New Pro Website
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredProWebsites.map((website, idx) => (
                    <ProWebsiteCard
                      key={`showcase-website-${website.id}-${idx}`}
                      website={website}
                      index={idx}
                      currentOrigin={currentOrigin}
                      copiedId={copiedId}
                      deleteConfirmId={deleteConfirmId}
                      expandedReviewsSiteId={expandedReviewsSiteId}
                      onCopyLink={handleCopyLink}
                      onDeleteConfirm={(id) => setDeleteConfirmId(id)}
                      onDeleteItem={(col, id) => handleDeleteItem(col, id)}
                      onToggleReviews={(id) => setExpandedReviewsSiteId(prev => prev === id ? null : id)}
                      onOpenProductModal={() => onOpenProductSelector(website)}
                      onOpenBotActivationModal={() => onOpenBotActivationModal(website)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};
