export type CreditRecord = {
  id: string;
  counterparty: string;
  description: string;
  reference: string;
  date: Date;
  amount: number;
  status: 'Completed';
};

export const account = {
  ownerName: 'Robert Grey',
  accountType: 'Checking Account',
  accountNumberEnding: '91180',
  availableBalance: 30618147,
  ledgerBalance: 30618147,
  status: 'Secure',
};

export const openingBalance = 22500000;
export const illustrativeCreditTotal = 8118147;
export const illustrativeClosingBalance = 30618147;

export const credits: CreditRecord[] = [
  {
    id: 'credit-1',
    counterparty: 'Summit Energy Group',
    description: 'Investment Payment',
    reference: 'ST-842691',
    date: new Date('2026-02-05T00:00:00'),
    amount: 1500000,
    status: 'Completed',
  },
  {
    id: 'credit-2',
    counterparty: 'Meridian Property Holdings',
    description: 'Real Estate Investment',
    reference: 'MD-317408',
    date: new Date('2025-04-26T00:00:00'),
    amount: 1250000,
    status: 'Completed',
  },
  {
    id: 'credit-3',
    counterparty: 'Northstar Capital Partners',
    description: 'Investment Return',
    reference: 'NC-590273',
    date: new Date('2025-04-23T00:00:00'),
    amount: 1100000,
    status: 'Completed',
  },
  {
    id: 'credit-4',
    counterparty: 'Evergreen Commercial Group',
    description: 'Contract Proceeds',
    reference: 'EG-461825',
    date: new Date('2024-06-20T00:00:00'),
    amount: 1000000,
    status: 'Completed',
  },
  {
    id: 'credit-5',
    counterparty: 'Sterling Infrastructure',
    description: 'Project Payment',
    reference: 'SI-208614',
    date: new Date('2024-01-04T00:00:00'),
    amount: 900000,
    status: 'Completed',
  },
  {
    id: 'credit-6',
    counterparty: 'Horizon Asset Management',
    description: 'Investment Distribution',
    reference: 'HA-735190',
    date: new Date('2023-05-12T00:00:00'),
    amount: 850000,
    status: 'Completed',
  },
  {
    id: 'credit-7',
    counterparty: 'Crestview Development',
    description: 'Property Proceeds',
    reference: 'CV-914362',
    date: new Date('2023-03-22T00:00:00'),
    amount: 750000,
    status: 'Completed',
  },
  {
    id: 'credit-8',
    counterparty: 'Bluehaven Ventures',
    description: 'Investment Payment',
    reference: 'BV-683051',
    date: new Date('2021-05-10T00:00:00'),
    amount: 768147,
    status: 'Completed',
  },
];

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatRecordDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
