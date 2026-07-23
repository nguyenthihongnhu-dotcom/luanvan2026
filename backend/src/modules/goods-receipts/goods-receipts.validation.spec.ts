import { HttpError } from '../../common/http';
import { parseCreateGoodsReceipt } from './goods-receipts.validation';

describe('goods-receipts.validation parseCreateGoodsReceipt', () => {
  const validItem = {
    productVariantId: 10,
    locationId: 5,
    quantity: 3,
  };

  const validHeader = {
    receiptCode: 'PN-001',
    warehouseId: 1,
    supplierId: 2,
  };

  it('keeps the items array instead of stripping it (regression: items were silently dropped by validation)', () => {
    const result = parseCreateGoodsReceipt({
      ...validHeader,
      items: [validItem],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items?.[0]).toMatchObject({
      productVariantId: 10,
      locationId: 5,
      quantity: 3,
    });
  });

  it('coerces numeric item fields sent as strings (as they arrive from HTTP query/body)', () => {
    const result = parseCreateGoodsReceipt({
      ...validHeader,
      items: [
        {
          productVariantId: '10',
          locationId: '5',
          quantity: '3.5',
          unitCost: '12000',
        },
      ],
    });

    expect(result.items?.[0]).toMatchObject({
      productVariantId: 10,
      locationId: 5,
      quantity: 3.5,
      unitCost: 12000,
    });
  });

  it('allows omitting items entirely (header-only draft), matching CreateGoodsReceiptInput.items being optional', () => {
    const result = parseCreateGoodsReceipt(validHeader);

    expect(result.items).toBeUndefined();
  });

  it('rejects an explicit empty items array', () => {
    expect(() =>
      parseCreateGoodsReceipt({ ...validHeader, items: [] }),
    ).toThrow(HttpError);
  });

  it('rejects an item missing locationId (required for receipts, unlike goods-issues)', () => {
    expect(() =>
      parseCreateGoodsReceipt({
        ...validHeader,
        items: [{ productVariantId: 10, quantity: 3 }],
      }),
    ).toThrow(HttpError);
  });

  it('rejects an item with a non-positive quantity', () => {
    expect(() =>
      parseCreateGoodsReceipt({
        ...validHeader,
        items: [{ ...validItem, quantity: 0 }],
      }),
    ).toThrow(HttpError);
  });

  it('rejects missing receiptCode', () => {
    expect(() => parseCreateGoodsReceipt({ items: [validItem] })).toThrow(
      HttpError,
    );
  });
});
