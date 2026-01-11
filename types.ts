
export interface Store {
  id: string;
  name: string;
  address: string;
  status: 'Open' | 'Closed' | 'Closing Soon';
  closingTime: string;
  distance?: string;
  mapUrl: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface AppState {
  stores: Store[];
  loading: boolean;
  error: string | null;
  location: Location | null;
}
