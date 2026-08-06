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

  it('rejects a header-only draft: there is no endpoint to add items later, so an item-less receipt could never be confirmed', () => {
    expect(() => parseCreateGoodsReceipt(validHeader)).toThrow(HttpError);
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

  it('normalises receivedAt sent by the date input (T separator, no seconds) into a MySQL DATETIME literal', () => {
    const result = parseCreateGoodsReceipt({
      ...validHeader,
      receivedAt: '2026-08-06T22:01',
      items: [validItem],
    });

    expect(result.receivedAt).toBe('2026-08-06 22:01:00');
  });

  it('rejects a UTC instant for receivedAt: the column has no timezone, so a Z value would shift the document date', () => {
    expect(() =>
      parseCreateGoodsReceipt({
        ...validHeader,
        receivedAt: '2026-08-06T15:01:35.000Z',
        items: [validItem],
      }),
    ).toThrow(HttpError);
  });

  it('leaves receivedAt undefined when omitted so the column stays NULL until the receipt is confirmed', () => {
    const result = parseCreateGoodsReceipt({
      ...validHeader,
      items: [validItem],
    });

    expect(result.receivedAt).toBeUndefined();
  });

  it('rejects missing receiptCode', () => {
    expect(() => parseCreateGoodsReceipt({ items: [validItem] })).toThrow(
      HttpError,
    );
  });
});
