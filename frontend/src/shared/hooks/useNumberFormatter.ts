import { useCallback, useMemo } from 'react';

export type NumberInput = number | string | null | undefined;

export interface UseNumberFormatterOptions {
    locale?: string;
    emptyValue?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}

const DEFAULT_LOCALE = 'vi-VN';

export function toFiniteNumber(input: NumberInput): number | null {
    if (input === null || input === undefined || input === '') {
        return null;
    }

    const value = typeof input === 'number' ? input : Number(input);
    return Number.isFinite(value) ? value : null;
}

export function useNumberFormatter(options: UseNumberFormatterOptions = {}) {
    const {
        locale = DEFAULT_LOCALE,
        emptyValue = '-',
        minimumFractionDigits,
        maximumFractionDigits = 2,
    } = options;

    const decimalFormatter = useMemo(() => new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
    }), [locale, maximumFractionDigits, minimumFractionDigits]);

    const compactFormatter = useMemo(() => new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }), [locale]);

    const percentFormatter = useMemo(() => new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 2,
    }), [locale]);

    const formatWith = useCallback((
        input: NumberInput,
        formatter: Intl.NumberFormat,
        overrideOptions?: Intl.NumberFormatOptions,
    ) => {
        const value = toFiniteNumber(input);

        if (value === null) {
            return emptyValue;
        }

        if (overrideOptions) {
            return new Intl.NumberFormat(locale, overrideOptions).format(value);
        }

        return formatter.format(value);
    }, [emptyValue, locale]);

    const formatNumber = useCallback((input: NumberInput, overrideOptions?: Intl.NumberFormatOptions) => {
        return formatWith(input, decimalFormatter, overrideOptions);
    }, [decimalFormatter, formatWith]);

    const formatCompactNumber = useCallback((input: NumberInput, overrideOptions?: Intl.NumberFormatOptions) => {
        return formatWith(input, compactFormatter, overrideOptions);
    }, [compactFormatter, formatWith]);

    const formatPercent = useCallback((input: NumberInput, overrideOptions?: Intl.NumberFormatOptions) => {
        return formatWith(input, percentFormatter, overrideOptions);
    }, [formatWith, percentFormatter]);

    return {
        formatNumber,
        formatCompactNumber,
        formatPercent,
    };
}
