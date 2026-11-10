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



const creditDefinitions = [
  ['Westbridge Global Holdings', 'Corporate Investment Payment', 'WB-572814'],
  ['Pinnacle Ridge Enterprises', 'Business Development Proceeds', 'PR-639205'],
  ['Summit Energy Group', 'Investment Payment', 'ST-842691'],
  ['Meridian Property Holdings', 'Real Estate Investment', 'MD-317408'],
  ['Northstar Capital Partners', 'Investment Return', 'NC-590273'],
  ['Evergreen Commercial Group', 'Contract Proceeds', 'EG-461825'],
  ['Sterling Infrastructure', 'Project Payment', 'SI-208614'],
  ['Horizon Asset Management', 'Investment Distribution', 'HA-735190'],
  ['Crestview Development', 'Property Proceeds', 'CV-914362'],
  ['Bluehaven Ventures', 'Investment Payment', 'BV-683051'],
] as const;

const creditAmounts = [
  2900000,
  1900000,
  1500000,
  1250000,
  1100000,
  1000000,
  900000,
  850000,
  750000,
  768147,
];

const fixedDates = [
  new Date(2025, 0, 21, 13, 18), // Jan 21, 2025 at 1:18 PM
  new Date(2025, 0, 15, 11, 42), // Jan 15, 2025 at 11:42 AM
  new Date(2024, 7, 19, 14, 7),  // Aug 19, 2024 at 2:07 PM
  new Date(2024, 4, 27, 10, 26), // May 27, 2024 at 10:26 AM
  new Date(2024, 4, 7, 15, 51),  // May 7, 2024 at 3:51 PM
  new Date(2024, 0, 12, 12, 13), // Jan 12, 2024 at 12:13 PM
  new Date(2023, 9, 26, 16, 38), // Oct 26, 2023 at 4:38 PM
  new Date(2023, 7, 14, 13, 4),  // Aug 14, 2023 at 1:04 PM
  new Date(2023, 3, 19, 10, 20), // Apr 19, 2023 at 10:20 AM
  new Date(2022, 11, 23, 14, 35), // Dec 23, 2022 at 2:35 PM
];

export const credits: CreditRecord[] = creditDefinitions.map((definition, index) => ({
  id: `credit-${index + 1}`,
  counterparty: definition[0],
  description: definition[1],
  reference: definition[2],
  date: fixedDates[index],
  amount: creditAmounts[index],
  status: 'Completed' as const,
}));

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatRecordDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
