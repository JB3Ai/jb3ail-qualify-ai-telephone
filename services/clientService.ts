import { Client, Language } from '../types';

// Simple temporary storage for the Robot (Backend)
let serverMemoryClients: Client[] = [
  {
    id: '1',
    name: 'Test Subject',
    phone: '+27719691848', // Update this to your real number for testing
    status: 'pending',
    signup_date: new Date().toISOString(),
    language: Language.ENGLISH,
    collected_data: {
      email: 'test@mzansi.ai'
    }
  }
];

export const clientService = {
  // GET ALL CLIENTS
  getClients: (): Client[] => {
    // 1. If running in Browser -> Use LocalStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mzansi_clients');
      return stored ? JSON.parse(stored) : [];
    }
    // 2. If running in Robot (Server) -> Use Server Memory
    return serverMemoryClients;
  },

  // ADD NEW CLIENT
  addClient: (client: Client): void => {
    if (typeof window !== 'undefined') {
      // Browser: Save to LocalStorage
      const clients = clientService.getClients();
      clients.push(client);
      localStorage.setItem('mzansi_clients', JSON.stringify(clients));
    } else {
      // Server: Save to Memory
      serverMemoryClients.push(client);
    }
  },

  // UPDATE CLIENT
  updateClient: (updatedClient: Client): void => {
    if (typeof window !== 'undefined') {
      const clients = clientService.getClients().map(c =>
        c.id === updatedClient.id ? updatedClient : c
      );
      localStorage.setItem('mzansi_clients', JSON.stringify(clients));
    } else {
      serverMemoryClients = serverMemoryClients.map(c =>
        c.id === updatedClient.id ? updatedClient : c
      );
    }
  },

  // DELETE CLIENT
  deleteClient: (id: string): void => {
    if (typeof window !== 'undefined') {
      const clients = clientService.getClients().filter(c => c.id !== id);
      localStorage.setItem('mzansi_clients', JSON.stringify(clients));
    } else {
      serverMemoryClients = serverMemoryClients.filter(c => c.id !== id);
    }
  },

  // CLEAR ALL CLIENTS (For Testing)
  clearClients: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mzansi_clients');
    } else {
      serverMemoryClients = [];
    }
  }
};