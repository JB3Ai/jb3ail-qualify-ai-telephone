"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientService = void 0;
const types_1 = require("../types");
const STORAGE_KEY = 'jb3_qualify_clients_v2';
const safeStorageGet = (key) => {
    try {
        return localStorage.getItem(key);
    }
    catch (error) {
        console.warn(`Client storage read failed for ${key}:`, error);
        return null;
    }
};
const safeStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, value);
    }
    catch (error) {
        console.warn(`Client storage write failed for ${key}:`, error);
    }
};
const safeParseClients = (raw) => {
    if (!raw)
        return DEFAULT_CLIENTS;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : DEFAULT_CLIENTS;
    }
    catch (error) {
        console.warn('Stored client data was invalid JSON. Resetting to defaults.', error);
        return DEFAULT_CLIENTS;
    }
};
const DEFAULT_CLIENTS = [
    {
        id: "101",
        name: "Thabo",
        surname: "Mbeki",
        area: "Gauteng",
        phone: "+27820000000",
        signup_date: "2023-10-27",
        status: "qualified",
        language: types_1.Language.ZULU,
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
            { role: 'model', text: "Ngiyabonga kakhulu. And can you confirm you are the homeowner in the Gauteng area?", timestamp: 1698400025000 },
            { role: 'user', text: "Yes, I am the homeowner. I signed up last month at the community event.", timestamp: 1698400030000 },
            { role: 'model', text: "Perfect. Now, regarding marketing — would you prefer us to contact you via email, SMS, or would you rather we don't reach out?", timestamp: 1698400035000 },
            { role: 'user', text: "Email is fine. I don't like getting too many SMSes.", timestamp: 1698400040000 },
            { role: 'model', text: "Understood, we'll keep it to email only. One last question — what is your current energy provider, and roughly how much do you spend on electricity per month?", timestamp: 1698400045000 },
            { role: 'user', text: "We're with Eskom. Spending about R2,500 a month, sometimes more in winter.", timestamp: 1698400050000 },
            { role: 'model', text: "Ngiyabonga kakhulu, Thabo. That's all I need. You're now fully verified for the solar initiative. We'll send a confirmation email shortly. Ube nosuku oluhle!", timestamp: 1698400055000 },
            { role: 'user', text: "Ngiyabonga, Zandi. Bye-bye.", timestamp: 1698400060000 }
        ]
    },
    {
        id: "105",
        name: "Pieter",
        surname: "van der Merwe",
        area: "Western Cape",
        phone: "+27821234567",
        signup_date: "2023-11-05",
        status: "qualified",
        language: types_1.Language.AFRIKAANS,
        collected_data: {
            email: "pieter.vdm@example.co.za",
            phone: "+27821234567",
            marketingPreference: "sms"
        },
        transcript: [
            { role: 'model', text: "Goeiedag! Dit is Zandi van Mzansi Solutions. Praat ek met die huiseienaar?", timestamp: 1699100000000 },
            { role: 'user', text: "Ja, dit is Pieter. Waarmee kan ek help?", timestamp: 1699100005000 },
            { role: 'model', text: "Dankie, Pieter. Ek skakel om u inskrywing vir die sonkrag-inisiatief te verifieer. Kan u asseblief u e-posadres bevestig?", timestamp: 1699100010000 },
            { role: 'user', text: "Ja, dis pieter punt v d m by example punt co punt za.", timestamp: 1699100015000 },
            { role: 'model', text: "Baie dankie. En kan u bevestig dat u die eienaar van die eiendom in die Wes-Kaap is?", timestamp: 1699100020000 },
            { role: 'user', text: "Ja, dis reg. Ek bly in Stellenbosch, het die huis al vyf jaar.", timestamp: 1699100025000 },
            { role: 'model', text: "Uitstekend. Nou, oor bemarkingsvoorkeure — wil u hê ons moet u per e-pos, SMS, of glad nie kontak nie?", timestamp: 1699100030000 },
            { role: 'user', text: "SMS is fine vir my. Maar nie te veel nie.", timestamp: 1699100035000 },
            { role: 'model', text: "Natuurlik, ons sal dit beperk. Laaste vraag — wat is u huidige kragvoorsiener en hoeveel spandeer u per maand aan elektrisiteit?", timestamp: 1699100040000 },
            { role: 'user', text: "Ons is by die Stad Kaapstad. Omtrent R1,800 per maand. Maar ek soek lankal na alternatiewe.", timestamp: 1699100045000 },
            { role: 'model', text: "Perfek, Pieter. Alles is geverifieer. Ons sal binnekort 'n bevestiging per SMS stuur. Geniet u dag verder!", timestamp: 1699100050000 },
            { role: 'user', text: "Baie dankie, Zandi. Totsiens!", timestamp: 1699100055000 }
        ]
    },
    {
        id: "106",
        name: "Noluthando",
        surname: "Mthembu",
        area: "Eastern Cape",
        phone: "+27829876543",
        signup_date: "2023-11-10",
        status: "qualified",
        language: types_1.Language.XHOSA,
        collected_data: {
            email: "noluthando.m@example.co.za",
            phone: "+27829876543",
            marketingPreference: "email"
        },
        transcript: [
            { role: 'model', text: "Molo! NdinguZandi waseMzansi Solutions. Ingaba ndithetha nomnikazi wekhaya?", timestamp: 1699800000000 },
            { role: 'user', text: "Ewe, ndinguNoluthando. Kutheni undifowunela?", timestamp: 1699800005000 },
            { role: 'model', text: "Enkosi, Noluthando. Ndifowunela ukuqinisekisa ukubhalisa kwakho kwinkqubo yamandla elanga. Ungaqinisekisa idilesi yakho ye-imeyile?", timestamp: 1699800010000 },
            { role: 'user', text: "Ewe, yi noluthando dot m at example dot co dot za.", timestamp: 1699800015000 },
            { role: 'model', text: "Enkosi kakhulu. Ungaqinisekisa ukuba ungumnikazi wendlu eMpuma Koloni?", timestamp: 1699800020000 },
            { role: 'user', text: "Ewe, ndingumnikazi. Ndihlala eBhisho, ndinekhaya apho.", timestamp: 1699800025000 },
            { role: 'model', text: "Kulungile. Ngokuphathelele neentengiso — ngaba ungathanda ukuba siqhagamshelane nawe nge-imeyile, nge-SMS, okanye ungathandi konke konke?", timestamp: 1699800030000 },
            { role: 'user', text: "Nge-imeyile kulungile. Ndiyayithanda into yokufunda ngexesha lam.", timestamp: 1699800035000 },
            { role: 'model', text: "Siyakuva. Umbuzo wokugqibela — ngubani umniki-mbane wakho okwangoku, yaye uchitha malini ngenyanga?", timestamp: 1699800040000 },
            { role: 'user', text: "Ndisebenzisa uEskom. Malunga neR2,000 ngenyanga, kodwa ngamanye amaxesha iyenyuka xa kubanda.", timestamp: 1699800045000 },
            { role: 'model', text: "Enkosi kakhulu, Noluthando. Yonke into iqinisekisiwe. Sizokuthumelela isiqinisekiso nge-imeyile kungekudala. Ube nosuku oluhle!", timestamp: 1699800050000 },
            { role: 'user', text: "Enkosi, Zandi. Usale kakuhle!", timestamp: 1699800055000 }
        ]
    },
    {
        id: "107",
        name: "Ricardo",
        surname: "Ferreira",
        area: "Johannesburg",
        phone: "+27824445555",
        signup_date: "2023-11-15",
        status: "failed",
        language: types_1.Language.PORTUGUESE,
        collected_data: {
            phone: "+27824445555"
        },
        transcript: [
            { role: 'model', text: "Olá! Aqui é a Zandi da Mzansi Solutions. Estou a falar com o proprietário da casa?", timestamp: 1700100000000 },
            { role: 'user', text: "Sim, sou o Ricardo. De que se trata?", timestamp: 1700100005000 },
            { role: 'model', text: "Obrigada, Ricardo. Estou a ligar para verificar a sua inscrição na iniciativa de energia solar. Pode confirmar o seu endereço de e-mail?", timestamp: 1700100010000 },
            { role: 'user', text: "Olhe, agora não é boa altura. Estou muito ocupado com o trabalho.", timestamp: 1700100015000 },
            { role: 'model', text: "Compreendo que esteja ocupado. Isto levará apenas 60 segundos para verificar os seus dados para a melhor tarifa disponível.", timestamp: 1700100020000 },
            { role: 'user', text: "Não, a sério, não tenho tempo agora. Podem ligar-me noutra altura?", timestamp: 1700100025000 },
            { role: 'model', text: "Claro, sem problema. Qual seria o melhor horário para voltar a ligar? E em que idioma prefere que falemos?", timestamp: 1700100030000 },
            { role: 'user', text: "Talvez amanhã de manhã, por volta das 10. Pode ser em português mesmo.", timestamp: 1700100035000 },
            { role: 'model', text: "Anotado — amanhã às 10h, em português. Obrigada pela sua disponibilidade, Ricardo. Tenha um excelente dia!", timestamp: 1700100040000 },
            { role: 'user', text: "Obrigado, até amanhã.", timestamp: 1700100045000 }
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
        language: types_1.Language.AFRIKAANS,
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
        language: types_1.Language.SEPEDI,
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
        language: types_1.Language.XHOSA,
        collected_data: {}
    }
];
exports.clientService = {
    getClients: () => {
        if (typeof window === 'undefined')
            return DEFAULT_CLIENTS;
        return safeParseClients(safeStorageGet(STORAGE_KEY));
    },
    addClient: (client) => {
        const clients = exports.clientService.getClients();
        const newClient = {
            ...client,
            status: 'pending',
            collected_data: {}
        };
        clients.unshift(newClient);
        if (typeof window !== 'undefined') {
            safeStorageSet(STORAGE_KEY, JSON.stringify(clients));
        }
        return clients;
    },
    importClients: (newLeads) => {
        const currentClients = exports.clientService.getClients();
        const formattedLeads = newLeads.map(lead => ({
            ...lead,
            status: lead.status || 'pending',
            collected_data: lead.collected_data || {}
        }));
        // deduplicate: ignore leads whose phone or id already present
        const existingKeys = new Set(currentClients.map(c => c.phone || c.id));
        const dedupedLeads = formattedLeads.filter(l => {
            const key = l.phone || l.id;
            if (existingKeys.has(key))
                return false;
            existingKeys.add(key);
            return true;
        });
        const updated = [...dedupedLeads, ...currentClients];
        if (typeof window !== 'undefined') {
            safeStorageSet(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
    },
    updateClientStatus: (id, status, data, transcript) => {
        const clients = exports.clientService.getClients();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = {
                ...clients[index],
                status: status,
                collected_data: data ? { ...clients[index].collected_data, ...data } : clients[index].collected_data,
                transcript: transcript || clients[index].transcript
            };
            if (typeof window !== 'undefined') {
                safeStorageSet(STORAGE_KEY, JSON.stringify(clients));
            }
        }
        return clients;
    },
    reset: () => {
        if (typeof window !== 'undefined') {
            safeStorageSet(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS));
        }
        return DEFAULT_CLIENTS;
    }
};
