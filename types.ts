
export enum Language {
  ENGLISH = 'en',
  AFRIKAANS = 'af',
  ZULU = 'zu',
  XHOSA = 'xh',
  SEPEDI = 'nso'
}

export interface LeadData {
  email?: string;
  phone?: string;
  marketingPreference?: 'email' | 'sms' | 'none';
  name?: string;
  surname?: string;
  area?: string;
  custom_parameters?: Record<string, string>;
}

export interface CallConfig {
  companyName: string;
  objectives: string;
  parameters: string[];
  enabledLanguages: Language[];
  defaultLanguage: Language;
}

export interface Client {
  id: string;
  name: string;
  surname?: string;
  area?: string;
  phone: string;
  signup_date: string;
  status: 'pending' | 'qualified' | 'failed';
  language: Language;
  collected_data?: LeadData;
  transcript?: TranscriptionEntry[];
}

export interface TranscriptionEntry {
  text: string;
  role: 'user' | 'model';
  timestamp: number;
  clientId?: string;
}

export interface TaskResult {
  is_task: boolean;
  title: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  estimated_time: number;
  project_tag: string;
  reasoning: string;
}

export interface ExecutiveTask extends TaskResult {
  id: string;
  clientName: string;
  timestamp: number;
  draftAction?: string;
  isResolved?: boolean;
}

export interface LeadData {
  email?: string;
  billAmount?: string;
  notes?: string;
}
