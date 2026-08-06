import { HttpError } from '../../common/http';
import { parseCreateStockAdjustment } from './stock-adjustments.validation';

describe('stock-adjustments.validation parseCreateStockAdjustment', () => {
  const validItem = {
    productVariantId: 10,
    locationId: 5,
    adjustmentDirection: 'IN' as const,
    quantity: 3,
  };

  const validHeader = {
    adjustmentCode: 'DC-001',
    warehouseId: 1,
    reasonCode: 'DAMAGED',
  };

  it('keeps the items array instead of stripping it (regression: items were silently dropped by validation)', () => {
    const result = parseCreateStockAdjustment({
      ...validHeader,
      items: [validItem],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items?.[0]).toMatchObject({
      productVariantId: 10,
      locationId: 5,
      adjustmentDirection: 'IN',
      quantity: 3,
    });
  });

  it('coerces numeric item fields sent as strings (as they arrive from HTTP query/body)', () => {
    const result = parseCreateStockAdjustment({
      ...validHeader,
      items: [
        {
          productVariantId: '10',
          locationId: '5',
          adjustmentDirection: 'OUT',
          quantity: '3.5',
        },
      ],
    });

    expect(result.items?.[0]).toMatchObject({
      productVariantId: 10,
      locationId: 5,
      adjustmentDirection: 'OUT',
      quantity: 3.5,
    });
  });

  it('rejects a header-only draft: there is no endpoint to add items later, so an item-less adjustment could never be approved', () => {
    expect(() => parseCreateStockAdjustment(validHeader)).toThrow(HttpError);
  });

  it('rejects an explicit empty items array', () => {
    expect(() =>
      parseCreateStockAdjustment({ ...validHeader, items: [] }),
    ).toThrow(HttpError);
  });

  it('rejects an item missing locationId (required, same as goods-receipts)', () => {
    expect(() =>
      parseCreateStockAdjustment({
        ...validHeader,
        items: [
          { productVariantId: 10, adjustmentDirection: 'IN', quantity: 3 },
        ],
      }),
    ).toThrow(HttpError);
  });

  it('rejects an item with an invalid adjustmentDirection', () => {
    expect(() =>
      parseCreateStockAdjustment({
        ...validHeader,
        items: [{ ...validItem, adjustmentDirection: 'SIDEWAYS' }],
      }),
    ).toThrow(HttpError);
  });

  it('rejects an item with a non-positive quantity', () => {
    expect(() =>
      parseCreateStockAdjustment({
        ...validHeader,
        items: [{ ...validItem, quantity: 0 }],
      }),
    ).toThrow(HttpError);
  });

  it('accepts missing adjustmentCode so the code can be generated later', () => {
    const parsed = parseCreateStockAdjustment({ items: [validItem] });

    expect(parsed.adjustmentCode).toBeUndefined();
  });

  it('rejects blank adjustmentCode', () => {
    expect(() =>
      parseCreateStockAdjustment({ adjustmentCode: '   ', items: [validItem] }),
    ).toThrow(HttpError);
  });
});
