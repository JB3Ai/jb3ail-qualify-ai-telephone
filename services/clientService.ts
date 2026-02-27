import { Client, Language, LeadData, TranscriptionEntry } from '../types';

const STORAGE_KEY = 'jb3_qualify_clients_v2';

const DEFAULT_CLIENTS: Client[] = [
  { 
    id: "101", 
    name: "Thabo", 
    surname: "Mbeki",
    area: "Gauteng",
    phone: "+27820000000", 
    signup_date: "2023-10-27", 
    status: "qualified", 
    language: Language.ZULU,
    collected_data: {
      email: "thabo.m@example.co.za",
      phone: "+27820000000",
      marketingPreference: "email"
    },
    transcript: [
      { role: 'model', text: "Sawubona! This is Zandi from Mzansi Solutions. Am I speaking with Thabo?", timestamp: 1698400000000 },
      { role: 'user', text: "Yebo, ninjani? Yes, this is Thabo speaking.", timestamp: 1698400005000 },
      { role: 'model', text: "Sikhona, ngiyabonga. I'm calling to verify your signup for the solar initiative. Can you confirm your email address?", timestamp: 1698400010000 },
      { role: 'user', text: "Yes, it is thabo dot m at example dot co dot za.", timestamp: 1698400020000 },
      { role: 'model', text: "Ngiyabonga. And are you the homeowner in the Gauteng area?", timestamp: 1698400025000 },
      { role: 'user', text: "Yes, I am.", timestamp: 1698400030000 }
    ]
  },
  { 
    id: "102", 
    name: "Johan", 
    surname: "Botha",
    area: "Western Cape",
    phone: "+27820000001", 
    signup_date: "2023-10-28", 
    status: "pending", 
    language: Language.AFRIKAANS,
    collected_data: {} 
  },
  { 
    id: "103", 
    name: "Lindiwe", 
    surname: "Sisulu",
    area: "Limpopo",
    phone: "+27820000005", 
    signup_date: "2023-11-01", 
    status: "pending", 
    language: Language.SEPEDI,
    collected_data: {} 
  },
  { 
    id: "104", 
    name: "Nomvula", 
    surname: "Mokonyane",
    area: "Eastern Cape",
    phone: "+27820000002", 
    signup_date: "2023-10-29", 
    status: "pending", 
    language: Language.XHOSA,
    collected_data: {} 
  }
];

export const clientService = {
  getClients: (): Client[] => {
    if (typeof window === 'undefined') return DEFAULT_CLIENTS;
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_CLIENTS;
  },

  addClient: (client: Omit<Client, 'status' | 'collected_data'>) => {
    const clients = clientService.getClients();
    const newClient: Client = {
      ...client,
      status: 'pending',
      collected_data: {}
    };
    clients.unshift(newClient);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    }
    return clients;
  },

  importClients: (newLeads: Client[]) => {
    const currentClients = clientService.getClients();
    const formattedLeads: Client[] = newLeads.map(lead => ({
      ...lead,
      status: lead.status || 'pending',
      collected_data: lead.collected_data || {}
    }));
    // deduplicate: ignore leads whose phone or id already present
    const existingKeys = new Set(currentClients.map(c => c.phone || c.id));
    const dedupedLeads = formattedLeads.filter(l => {
      const key = l.phone || l.id;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    const updated = [...dedupedLeads, ...currentClients];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  },

  updateClientStatus: (id: string, status: 'qualified' | 'failed' | 'signal_sent', data?: LeadData, transcript?: TranscriptionEntry[]) => {
    const clients = clientService.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = {
        ...clients[index],
        status: status,
        collected_data: data ? { ...clients[index].collected_data, ...data } : clients[index].collected_data,
        transcript: transcript || clients[index].transcript
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      }
    }
    return clients;
  },

  reset: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
    }
    return DEFAULT_CLIENTS;
  }
};