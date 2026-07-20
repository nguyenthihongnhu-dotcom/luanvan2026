const normalizedText = (value: unknown) => String(value ?? '').trim().toLowerCase();

const categoryLabels: Record<string, string> = {
    'bim ta': 'B\u1ec9m t\u00e3',
    'b\u1ec9m t\u00e3': 'B\u1ec9m t\u00e3',
    'sua cong thuc': 'S\u1eefa c\u00f4ng th\u1ee9c',
    's\u1eefa c\u00f4ng th\u1ee9c': 'S\u1eefa c\u00f4ng th\u1ee9c',
    'do so sinh': '\u0110\u1ed3 s\u01a1 sinh',
    '\u0111\u1ed3 s\u01a1 sinh': '\u0110\u1ed3 s\u01a1 sinh',
    'chua phan loai': 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
    'uncategorized': 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
    'diapers': 'B\u1ec9m t\u00e3',
    'diaper': 'B\u1ec9m t\u00e3',
    'formula': 'S\u1eefa c\u00f4ng th\u1ee9c',
    'milk': 'S\u1eefa c\u00f4ng th\u1ee9c',
    'baby formula': 'S\u1eefa c\u00f4ng th\u1ee9c',
    'newborn supplies': '\u0110\u1ed3 s\u01a1 sinh',
    'baby supplies': '\u0110\u1ed3 s\u01a1 sinh',
    'baby clothes': 'Th\u1eddi trang tr\u1ebb em',
    'toys': '\u0110\u1ed3 ch\u01a1i',
    'ch\u01b0a ph\u00e2n lo\u1ea1i': 'Ch\u01b0a ph\u00e2n lo\u1ea1i',
};

const productNameLabels: Record<string, string> = {
    'ta quan huggies size m': 'T\u00e3 qu\u1ea7n Huggies Size M',
    'sua frisolac gold so 3': 'S\u1eefa Frisolac Gold S\u1ed1 3',
    'ti gia chicco silicone': 'Ti gi\u1ea3 Chicco silicone',
    'san pham': 'S\u1ea3n ph\u1ea9m',
    'product': 'S\u1ea3n ph\u1ea9m',
    'huggies size m pants': 'T\u00e3 qu\u1ea7n Huggies Size M',
    'frisolac gold stage 3': 'S\u1eefa Frisolac Gold S\u1ed1 3',
    'chicco silicone teether': 'Ti gi\u1ea3 Chicco silicone',
};

export const productCategoryOptions = ['B\u1ec9m t\u00e3', 'S\u1eefa c\u00f4ng th\u1ee9c', '\u0110\u1ed3 s\u01a1 sinh'];

export function getProductCategoryLabel(category: unknown): string {
    const key = normalizedText(category);
    return categoryLabels[key] ?? String(category || 'Ch\u01b0a ph\u00e2n lo\u1ea1i');
}

export function getProductNameLabel(name: unknown): string {
    const raw = String(name || 'S\u1ea3n ph\u1ea9m');
    return productNameLabels[normalizedText(raw)] ?? raw;
}

export function getStockStatusLabel(status: unknown): string {
    switch (status) {
        case 'In Stock':
            return 'C\u00f2n h\u00e0ng';
        case 'Low Stock':
            return 'S\u1eafp h\u1ebft h\u00e0ng';
        case 'Out of Stock':
            return 'H\u1ebft h\u00e0ng';
        default:
            return String(status || 'Kh\u00f4ng x\u00e1c \u0111\u1ecbnh');
    }
}
