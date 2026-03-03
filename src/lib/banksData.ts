export type FinancialInstitution = {
    id: string;
    name: string;
    defaultCode: string;
    color: string;
    logoPath: string;
    type: 'BANK' | 'WALLET' | 'CUSTOM';
};

export const banksData: FinancialInstitution[] = [
    { id: 'NBE', name: 'البنك الأهلي المصري', defaultCode: 'NBE', color: '#006B3F', logoPath: '/logos/nbe.png', type: 'BANK' },
    { id: 'BANQUE_MISR', name: 'بنك مصر', defaultCode: 'BM', color: '#87142A', logoPath: '/logos/banque_misr.png', type: 'BANK' },
    { id: 'CIB', name: 'CIB - البنك التجاري الدولي', defaultCode: 'CIB', color: '#0055A5', logoPath: '/logos/cib.png', type: 'BANK' },
    { id: 'QNB', name: 'QNB الأهلي', defaultCode: 'QNB', color: '#4E2452', logoPath: '/logos/qnb.png', type: 'BANK' },
    { id: 'ALEX_BANK', name: 'بنك الإسكندرية', defaultCode: 'ALEX_BANK', color: '#001D4A', logoPath: '/logos/alex_bank.png', type: 'BANK' },
    { id: 'BANQUE_DU_CAIRE', name: 'بنك القاهرة', defaultCode: 'BDC', color: '#F8A123', logoPath: '/logos/bdc.png', type: 'BANK' },
    { id: 'VODAFONE_CASH', name: 'فودافون كاش', defaultCode: 'VODA_CASH', color: '#E60000', logoPath: '/logos/vodafone_cash.png', type: 'WALLET' },
    { id: 'ORANGE_CASH', name: 'أورانج كاش', defaultCode: 'ORANGE_CASH', color: '#FF7900', logoPath: '/logos/orange_cash.png', type: 'WALLET' },
    { id: 'ETISALAT_CASH', name: 'اتصالات كاش', defaultCode: 'ETISALAT_CASH', color: '#74A710', logoPath: '/logos/etisalat_cash.png', type: 'WALLET' },
    { id: 'INSTAPAY', name: 'إنستاباي InstaPay', defaultCode: 'INSTAPAY', color: '#571D82', logoPath: '/logos/instapay.png', type: 'WALLET' },
    { id: 'CUSTOM', name: 'خزينة نقدية مخصصة', defaultCode: 'CUSTOM_SAFE', color: '#26c6da', logoPath: '', type: 'CUSTOM' }
];
