
import React from 'react';
import { Store } from '../types';

interface StoreCardProps {
  store: Store;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const urgencyColors = {
    low: 'bg-green-500/10 border-green-500/50 text-green-400',
    medium: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
    high: 'bg-red-500/10 border-red-500/50 text-red-400'
  };

  const statusColors = {
    'Open': 'text-green-400',
    'Closed': 'text-gray-500',
    'Closing Soon': 'text-orange-400'
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${urgencyColors[store.urgency]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold truncate pr-4">{store.name}</h3>
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-black/30 border border-white/10 ${statusColors[store.status === 'Open' ? (store.urgency === 'high' ? 'Closing Soon' : 'Open') : 'Closed']}`}>
          {store.status === 'Open' && store.urgency === 'high' ? 'Closing Soon' : store.status}
        </span>
      </div>
      
      <p className="text-sm opacity-80 mb-4 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {store.address}
      </p>

      <div className="flex justify-between items-center mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase opacity-60 font-bold tracking-widest">Closing Time</span>
          <span className="text-lg font-mono font-bold">{store.closingTime}</span>
        </div>
        
        <a 
          href={store.mapUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </a>
      </div>
      
      {store.urgency === 'high' && (
        <div className="mt-4 pt-3 border-t border-red-500/20">
          <div className="flex items-center text-red-400 text-sm font-bold animate-pulse">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Hurry! This location is closing very soon.
          </div>
        </div>
      )}
    </div>
  );
};
