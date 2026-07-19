import { useCurrencyFormatter } from './useCurrencyFormatter';
import type { UseCurrencyFormatterOptions } from './useCurrencyFormatter';
import { useDateFormatter } from './useDateFormatter';
import type { UseDateFormatterOptions } from './useDateFormatter';
import { useNumberFormatter } from './useNumberFormatter';
import type { UseNumberFormatterOptions } from './useNumberFormatter';

interface UseFormattersOptions {
    date?: UseDateFormatterOptions;
    number?: UseNumberFormatterOptions;
    currency?: UseCurrencyFormatterOptions;
}

export function useFormatters(options: UseFormattersOptions = {}) {
    const date = useDateFormatter(options.date);
    const number = useNumberFormatter(options.number);
    const currency = useCurrencyFormatter(options.currency);

    return {
        ...date,
        ...number,
        ...currency,
    };
}
