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

const creditDefinitions = [
  ['Summit Energy Group', 'Investment Payment', 'ST-842691'],
  ['Meridian Property Holdings', 'Real Estate Investment', 'MD-317408'],
  ['Northstar Capital Partners', 'Investment Return', 'NC-590273'],
  ['Evergreen Commercial Group', 'Contract Proceeds', 'EG-461825'],
  ['Sterling Infrastructure', 'Project Payment', 'SI-208614'],
  ['Horizon Asset Management', 'Investment Distribution', 'HA-735190'],
  ['Crestview Development', 'Property Proceeds', 'CV-914362'],
  ['Bluehaven Ventures', 'Investment Payment', 'BV-683051'],
] as const;

const creditAmounts = [1500000, 1250000, 1100000, 1000000, 900000, 850000, 750000, 768147];
const ageInDays = [3, 11, 22, 34, 46, 59, 74, 88];

export const credits: CreditRecord[] = creditDefinitions.map((definition, index) => {
  const date = new Date();
  date.setDate(date.getDate() - ageInDays[index]);
  date.setHours([9, 11, 14, 10, 15, 12, 16, 13][index], [18, 42, 7, 26, 51, 13, 38, 4][index], 0, 0);
  return {
    id: `credit-${index + 1}`,
    counterparty: definition[0],
    description: definition[1],
    reference: definition[2],
    date,
    amount: creditAmounts[index],
    status: 'Completed',
  };
});

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatRecordDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
