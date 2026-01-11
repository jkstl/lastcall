
import React, { useState, useEffect, useCallback } from 'react';
import { Store, Location, AppState } from './types';
import { fetchNearbyStores } from './services/geminiService';
import { StoreCard } from './components/StoreCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    stores: [],
    loading: false,
    error: null,
    location: null,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const getGeolocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Geolocation is not supported by your browser." 
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setState(prev => ({ ...prev, location }));
      },
      (error) => {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "Unable to retrieve your location. Please check your permissions." 
        }));
      }
    );
  }, []);

  useEffect(() => {
    getGeolocation();
  }, [getGeolocation, refreshKey]);

  useEffect(() => {
    if (state.location) {
      const loadStores = async () => {
        try {
          const fetchedStores = await fetchNearbyStores(state.location!);
          setState(prev => ({ ...prev, stores: fetchedStores, loading: false }));
        } catch (err: any) {
          setState(prev => ({ ...prev, loading: false, error: err.message }));
        }
      };
      loadStores();
    }
  }, [state.location]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-4 shadow-2xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">LAST CALL</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Liquor Store Tracker</p>
            </div>
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={state.loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-all border border-white/5"
          >
            <svg className={`w-5 h-5 ${state.loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 pb-24">
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{state.error}</p>
          </div>
        )}

        {!state.location && !state.error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <svg className="w-10 h-10 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Getting your location...</h2>
            <p className="text-slate-400">Please allow location access to find stores near you.</p>
          </div>
        )}

        {state.loading && state.location && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
             <h2 className="text-2xl font-bold mb-2">Searching Nearby Stores</h2>
             <p className="text-slate-400">Scanning for the best liquor, wine, and beer shops...</p>
          </div>
        )}

        {!state.loading && state.stores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {!state.loading && state.location && state.stores.length === 0 && !state.error && (
          <div className="text-center py-20">
            <p className="text-slate-400">No stores found nearby. Try broadening your search or checking later.</p>
          </div>
        )}
      </main>

      {/* Footer / Summary Bar */}
      {state.stores.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-indigo-600 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-40">
          <div className="max-w-4xl mx-auto flex justify-between items-center text-white">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏃‍♂️</span>
              <div>
                <p className="text-xs font-bold uppercase opacity-80 leading-none">Quickest Trip</p>
                <p className="font-bold text-sm">Grab it before it's too late!</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-xs opacity-80">Next Closing</span>
               <span className="font-mono font-black text-xl">{state.stores[0].closingTime}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
