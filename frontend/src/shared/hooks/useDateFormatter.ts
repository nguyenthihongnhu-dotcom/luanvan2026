import { useCallback, useMemo } from 'react';

export type DateInput = Date | string | number | null | undefined;

export interface UseDateFormatterOptions {
    locale?: string;
    timeZone?: string;
    emptyValue?: string;
}

const DEFAULT_LOCALE = 'vi-VN';
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDate(input: DateInput): Date | null {
    if (input === null || input === undefined || input === '') {
        return null;
    }

    if (input instanceof Date) {
        return Number.isNaN(input.getTime()) ? null : input;
    }

    if (typeof input === 'string') {
        const dateOnlyMatch = input.match(DATE_ONLY_PATTERN);

        if (dateOnlyMatch) {
            const [, year, month, day] = dateOnlyMatch;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
    }

    const parsedDate = new Date(input);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function useDateFormatter(options: UseDateFormatterOptions = {}) {
    const { locale = DEFAULT_LOCALE, timeZone, emptyValue = '-' } = options;

    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeZone,
    }), [locale, timeZone]);

    const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
    }), [locale, timeZone]);

    const timeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
        timeStyle: 'short',
        timeZone,
    }), [locale, timeZone]);

    const formatWith = useCallback((
        input: DateInput,
        formatter: Intl.DateTimeFormat,
        overrideOptions?: Intl.DateTimeFormatOptions,
    ) => {
        const date = toDate(input);

        if (!date) {
            return emptyValue;
        }

        if (overrideOptions) {
            return new Intl.DateTimeFormat(locale, { ...overrideOptions, timeZone }).format(date);
        }

        return formatter.format(date);
    }, [emptyValue, locale, timeZone]);

    const formatDate = useCallback((input: DateInput, overrideOptions?: Intl.DateTimeFormatOptions) => {
        return formatWith(input, dateFormatter, overrideOptions);
    }, [dateFormatter, formatWith]);

    const formatDateTime = useCallback((input: DateInput, overrideOptions?: Intl.DateTimeFormatOptions) => {
        return formatWith(input, dateTimeFormatter, overrideOptions);
    }, [dateTimeFormatter, formatWith]);

    const formatTime = useCallback((input: DateInput, overrideOptions?: Intl.DateTimeFormatOptions) => {
        return formatWith(input, timeFormatter, overrideOptions);
    }, [formatWith, timeFormatter]);

    const formatInputDate = useCallback((input: DateInput) => {
        const date = toDate(input);

        if (!date) {
            return '';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }, []);

    return {
        formatDate,
        formatDateTime,
        formatTime,
        formatInputDate,
    };
}
