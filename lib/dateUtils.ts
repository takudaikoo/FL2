export type DateMode = 'western' | 'japanese';

export const ERAS = [
    { name: '西暦', value: 'western', startYear: 0 }, // startYear 0 for western as placeholder to satisfy type similarity if needed, or handle separately
    { name: '令和', value: 'reiwa', startYear: 2018 },
    { name: '平成', value: 'heisei', startYear: 1988 },
    { name: '昭和', value: 'showa', startYear: 1925 },
    { name: '大正', value: 'taisho', startYear: 1911 },
    { name: '明治', value: 'meiji', startYear: 1867 },
] as const;

export const formatDateWithMode = (dateStr: string, mode: DateMode | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if (!mode || mode === 'western') {
        return `${y}年 ${m}月 ${d}日`;
    }

    // Japanese Mode
    // Find era
    // Note: Array iteration order matters. Reiwa checked first, then Heisei...
    // Optimization: logic from DateInput
    let targetEra = ERAS.find(e => e.value !== 'western' && y > e.startYear);

    // Fallback if before Meiji or logic gap, default to Western or just Meiji?
    // If < 1868, maybe just Western? Or keep Meiji?
    // Let's assume standard modern era scope. 
    if (!targetEra) {
        return `${y}年 ${m}月 ${d}日`;
    }

    const eraYear = y - targetEra.startYear;
    const eraYearStr = eraYear === 1 ? '元' : eraYear.toString();

    return `${targetEra.name} ${eraYearStr}年 ${m}月 ${d}日`;
};
