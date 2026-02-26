export enum Language {
  ENGLISH = 'en-ZA',
  ZULU = 'zu-ZA',
  XHOSA = 'xh-ZA',
  AFRIKAANS = 'af-ZA',
  SEPEDI = 'nso-ZA',
  PORTUGUESE = 'pt-PT',
  GREEK = 'el-GR',
  MANDARIN = 'zh-CN'
}

export interface TranscriptionEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  marketingPreference?: 'email' | 'sms' | 'none';
  custom_parameters?: Record<string, any>;
}

export interface Client {
  id: string;
  name: string;
  surname: string;
  area: string;
  phone: string;
  signup_date: string;
  status: 'pending' | 'qualified' | 'failed' | 'signal_sent' | 'LOADED' | 'READY_FOR_EXECUTION';
  language: Language;
  source?: string;
  collected_data: LeadData;
  transcript?: TranscriptionEntry[];
}

export interface LanguagePhrases {
  greeting?: string;
  objection?: string;
  closing?: string;
  signalSwitch?: string;
}

export interface CallConfig {
  companyName: string;
  objectives: string;
  parameters: string[];
  enabledLanguages: Language[];
  defaultLanguage: Language;
  customPhrases?: Record<string, LanguagePhrases>;
}

export interface ExecutiveTask {
  id: string;
  title: string;
  description: string;
  isResolved: boolean;
  timestamp: number;
}
