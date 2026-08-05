import { HttpError } from '../../common/http';
import { parseCreateGoodsIssue } from './goods-issues.validation';

describe('goods-issues.validation parseCreateGoodsIssue', () => {
  const validItem = {
    productVariantId: 10,
    locationId: 5,
    quantity: 3,
  };

  const validHeader = {
    issueCode: 'PX-001',
    warehouseId: 1,
  };

  it('keeps the items array instead of stripping it (regression: items were silently dropped by validation)', () => {
    const result = parseCreateGoodsIssue({
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
    const result = parseCreateGoodsIssue({
      ...validHeader,
      items: [
        {
          productVariantId: '10',
          locationId: '5',
          quantity: '3.5',
        },
      ],
    });

    expect(result.items?.[0]).toMatchObject({
      productVariantId: 10,
      locationId: 5,
      quantity: 3.5,
    });
  });

  it('rejects a header-only draft: there is no endpoint to add items later, so an item-less issue could never be confirmed', () => {
    expect(() => parseCreateGoodsIssue(validHeader)).toThrow(HttpError);
  });

  it('rejects an explicit empty items array', () => {
    expect(() => parseCreateGoodsIssue({ ...validHeader, items: [] })).toThrow(
      HttpError,
    );
  });

  it('rejects an item missing productVariantId', () => {
    expect(() =>
      parseCreateGoodsIssue({
        ...validHeader,
        items: [{ locationId: 5, quantity: 3 }],
      }),
    ).toThrow(HttpError);
  });

  it('rejects an item with a non-positive quantity', () => {
    expect(() =>
      parseCreateGoodsIssue({
        ...validHeader,
        items: [{ ...validItem, quantity: 0 }],
      }),
    ).toThrow(HttpError);
  });

  it('rejects missing issueCode', () => {
    expect(() => parseCreateGoodsIssue({ items: [validItem] })).toThrow(
      HttpError,
    );
  });
});
