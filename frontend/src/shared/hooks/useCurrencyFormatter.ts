import { useCallback, useMemo } from 'react';
import { toFiniteNumber } from './useNumberFormatter';
import type { NumberInput } from './useNumberFormatter';

export interface UseCurrencyFormatterOptions {
    locale?: string;
    currency?: string;
    emptyValue?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}

const DEFAULT_LOCALE = 'vi-VN';
const DEFAULT_CURRENCY = 'VND';

export function useCurrencyFormatter(options: UseCurrencyFormatterOptions = {}) {
    const {
        locale = DEFAULT_LOCALE,
        currency = DEFAULT_CURRENCY,
        emptyValue = '-',
        minimumFractionDigits,
        maximumFractionDigits,
    } = options;

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }), [currency, locale, maximumFractionDigits, minimumFractionDigits]);

    const formatCurrency = useCallback((input: NumberInput, overrideOptions?: Intl.NumberFormatOptions) => {
        const value = toFiniteNumber(input);

        if (value === null) {
            return emptyValue;
        }

        if (overrideOptions) {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                ...overrideOptions,
            }).format(value);
        }

        return currencyFormatter.format(value);
    }, [currency, currencyFormatter, emptyValue, locale]);

    return {
        formatCurrency,
    };
}
