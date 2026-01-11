
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Store, Location, AppState } from './types';
import { fetchNearbyStores } from './services/geminiService';
import { StoreCard } from './components/StoreCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    stores: [],
    loading: false,
    error: null,
    location: null,
    notificationsEnabled: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const notifiedStoresRef = useRef<Set<string>>(new Set());

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
          error: "Permission denied. We need location to find nearby stores." 
        }));
      },
      { enableHighAccuracy: true }
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
  }, [state.location, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const parseTime = (timeStr: string): Date | null => {
    try {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      
      let [_, hours, minutes, period] = match;
      let h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      
      if (period.toUpperCase() === 'PM' && h < 12) h += 12;
      if (period.toUpperCase() === 'AM' && h === 12) h = 0;
      
      const date = new Date();
      date.setHours(h, m, 0, 0);
      return date;
    } catch (e) {
      return null;
    }
  };

  const checkClosingSoon = useCallback(() => {
    if (!state.notificationsEnabled || state.stores.length === 0) return;

    const now = new Date();
    state.stores.forEach(store => {
      if (store.status !== 'Open' || notifiedStoresRef.current.has(store.id)) return;

      const closingDate = parseTime(store.closingTime);
      if (!closingDate) return;

      const diffMs = closingDate.getTime() - now.getTime();
      const diffMins = diffMs / (1000 * 60);

      // Notify if closing within 30 mins and not already closed
      if (diffMins > 0 && diffMins <= 30) {
        if (Notification.permission === 'granted') {
          new Notification('Last Call Alert!', {
            body: `${store.name} is closing at ${store.closingTime}. Better hurry!`,
            icon: 'https://cdn-icons-png.flaticon.com/512/924/924514.png'
          });
          notifiedStoresRef.current.add(store.id);
        }
      }
    });
  }, [state.stores, state.notificationsEnabled]);

  useEffect(() => {
    const interval = setInterval(checkClosingSoon, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkClosingSoon]);

  const toggleNotifications = async () => {
    if (!state.notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setState(prev => ({ ...prev, notificationsEnabled: true }));
      } else {
        alert("Please enable notification permissions in your browser settings to use this feature.");
      }
    } else {
      setState(prev => ({ ...prev, notificationsEnabled: false }));
      notifiedStoresRef.current.clear();
    }
  };

  const { openStores, closedStores } = useMemo(() => {
    const open = state.stores.filter(s => s.status === 'Open').sort((a, b) => {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (b.urgency === 'high' && a.urgency !== 'high') return 1;
      return 0;
    });
    const closed = state.stores.filter(s => s.status === 'Closed');
    return { openStores: open, closedStores: closed };
  }, [state.stores]);

  const allClosed = openStores.length === 0 && state.stores.length > 0;

  return (
    <div className="min-h-screen bg-[#080A0F] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#080A0F]/60 backdrop-blur-2xl px-6 py-6 border-b border-white/[0.03]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">Last Call</h1>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Real-time spirits</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleNotifications}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${
                state.notificationsEnabled 
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' 
                : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-slate-300'
              }`}
              title={state.notificationsEnabled ? "Disable closing alerts" : "Enable closing alerts (30m limit)"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button 
              onClick={handleRefresh}
              disabled={state.loading}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all disabled:opacity-30"
            >
              <svg className={`w-5 h-5 text-slate-400 ${state.loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12">
        {state.error && (
          <div className="mb-10 p-6 bg-rose-500/5 border border-rose-500/20 rounded-3xl text-rose-400 text-sm font-medium flex items-center">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center mr-4 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {state.error}
          </div>
        )}

        {state.loading && state.location && (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="relative w-16 h-16 mb-8">
               <div className="absolute inset-0 border-[3px] border-indigo-500/10 rounded-full"></div>
               <div className="absolute inset-0 border-[3px] border-t-indigo-500 rounded-full animate-spin"></div>
             </div>
             <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Scanning Terrain...</p>
          </div>
        )}

        {!state.location && !state.error && !state.loading && (
          <div className="flex flex-col items-center justify-center py-40 text-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-[40px] flex items-center justify-center mb-8 rotate-12">
              <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">Access Required</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-10">We need your current location to find the nearest open stores. Tap below to begin.</p>
            <button 
              onClick={getGeolocation} 
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-600/30"
            >
              Enable Location
            </button>
          </div>
        )}

        {!state.loading && state.stores.length > 0 && (
          <div className="space-y-16">
            {openStores.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">Available Now</h2>
                    <h3 className="text-2xl font-black tracking-tight">Nearest Open Shops</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5">
                    {openStores.length} Options
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {openStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              </section>
            )}

            {closedStores.length > 0 && (
              <section className={openStores.length > 0 ? 'pt-16 border-t border-white/[0.03]' : ''}>
                <div className="flex flex-col mb-10">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
                    {allClosed ? 'Operational Status: Dark' : 'Too Late'}
                  </h2>
                  <h3 className="text-2xl font-black tracking-tight text-slate-400">
                    {allClosed ? 'Everything is Closed' : 'Recently Shutdown'}
                  </h3>
                </div>
                
                {allClosed && (
                  <div className="mb-12 p-10 bg-indigo-500/[0.02] border border-white/[0.03] rounded-[40px] text-center max-w-lg mx-auto">
                    <span className="text-4xl mb-6 block">🌙</span>
                    <h3 className="text-xl font-bold text-white mb-2">The Night has Ended.</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">It looks like the local shops are all closed for the night. Check back in the morning or try a different area.</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {closedStores.map((store) => (
                    <StoreCard key={store.id} store={store} isClosed={true} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Persistent Quick Action */}
      {openStores.length > 0 && (
        <div className="fixed bottom-10 left-0 right-0 px-6 z-50 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <div className="bg-[#1A1F2B] p-2 pr-4 rounded-[28px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-2xl shadow-inner">
                  🥃
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Top Recommendation</p>
                  <p className="text-white font-black text-sm tracking-tight truncate max-w-[150px]">{openStores[0].name}</p>
                  <p className="text-[10px] text-slate-500 font-bold leading-none mt-1">Closes {openStores[0].closingTime}</p>
                </div>
              </div>
              <a 
                href={openStores[0].mapUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center shadow-lg shadow-indigo-600/20"
              >
                Directions
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
