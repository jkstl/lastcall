
import React from 'react';
import { Store } from '../types';

interface StoreCardProps {
  store: Store;
  isClosed?: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, isClosed }) => {
  const isClosingSoon = store.urgency === 'high' && store.status === 'Open';
  
  return (
    <div className={`
      relative overflow-hidden rounded-3xl transition-all duration-500 flex flex-col h-full
      ${isClosed 
        ? 'bg-white/[0.02] border border-white/5 opacity-40 grayscale' 
        : 'bg-[#121620] border border-white/10 hover:border-indigo-500/40 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)]'
      }
    `}>
      {/* Decorative subtle gradient background */}
      {!isClosed && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      )}

      <div className="p-6 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-bold tracking-tight leading-tight ${isClosed ? 'text-slate-400' : 'text-white'}`}>
              {store.name}
            </h3>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
              {store.address}
            </p>
          </div>
          
          <div className={`
            shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
            ${isClosed 
              ? 'bg-slate-800 text-slate-500 border-slate-700' 
              : isClosingSoon 
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]'
            }
          `}>
            {isClosed ? 'Closed' : isClosingSoon ? 'Closing Soon' : 'Open'}
          </div>
        </div>

        {/* Footer Info Section */}
        <div className="mt-auto pt-6 flex items-end justify-between border-t border-white/5">
          <div className="space-y-0.5">
            <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em]">
              {isClosed ? 'Closed Since' : 'Closing Time'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-mono font-bold tracking-tighter ${isClosed ? 'text-slate-500' : isClosingSoon ? 'text-amber-500' : 'text-white'}`}>
                {store.closingTime}
              </span>
            </div>
          </div>

          <a 
            href={store.mapUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`
              flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
              ${isClosed 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95'
              }
            `}
            title="Open in Maps"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </a>
        </div>
      </div>
      
      {/* High Urgency Banner */}
      {isClosingSoon && !isClosed && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-1.5 px-6 text-center">
          <p className="text-[9px] font-black text-black uppercase tracking-[0.25em]">
            Urgent Call • Move Fast
          </p>
        </div>
      )}
    </div>
  );
};
