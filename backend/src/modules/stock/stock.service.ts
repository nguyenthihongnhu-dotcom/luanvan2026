import { HttpError } from '../../common/http';
import type {
  CurrentStockRow,
  NearExpiryStockRow,
  StockAllocationInput,
  StockAllocationItem,
  StockAllocationResult,
  StockFilters,
} from './stock.model';
import {
  findCurrentStock as findCurrentStockRepository,
  findNearExpiryStock as findNearExpiryStockRepository,
  findStockAllocationCandidates,
} from './stock.repository';

export async function listCurrentStock(
  filters: StockFilters,
): Promise<CurrentStockRow[]> {
  return findCurrentStockRepository(filters);
}

export async function listNearExpiryStock(
  filters: Pick<StockFilters, 'warehouseId'>,
): Promise<NearExpiryStockRow[]> {
  return findNearExpiryStockRepository(filters);
}

export async function previewStockAllocation(
  input: StockAllocationInput,
): Promise<StockAllocationResult> {
  const candidates = await findStockAllocationCandidates(input);
  const items: StockAllocationItem[] = [];
  let remainingQuantity = input.quantity;

  for (const candidate of candidates) {
    if (remainingQuantity <= 0) {
      break;
    }

    if (candidate.requires_lot_tracking === 1 && !candidate.batch_id) {
      throw new HttpError(
        422,
        'Lot-tracked products require batch_id before allocation',
        'BATCH_REQUIRED',
      );
    }

    if (
      input.strategy === 'FEFO' &&
      candidate.requires_expiry_tracking === 1 &&
      !candidate.expiry_date
    ) {
      throw new HttpError(
        422,
        'FEFO requires expiry_date for expiry-tracked products',
        'EXPIRY_DATE_REQUIRED',
      );
    }

    const allocatedQuantity = Math.min(
      Number(candidate.available_quantity),
      remainingQuantity,
    );

    if (allocatedQuantity <= 0) {
      continue;
    }

    items.push({
      stockLocationId: candidate.stock_location_id,
      productVariantId: candidate.product_variant_id,
      locationId: candidate.location_id,
      locationCode: candidate.location_code,
      batchId: candidate.batch_id,
      lotNumber: candidate.lot_number,
      expiryDate: candidate.expiry_date,
      receivedDate: candidate.received_date,
      quantity: allocatedQuantity,
    });

    remainingQuantity -= allocatedQuantity;
  }

  const allocatedQuantity = input.quantity - remainingQuantity;

  if (remainingQuantity > 0) {
    throw new HttpError(
      409,
      `Insufficient stock. Requested ${input.quantity}, available ${allocatedQuantity}`,
      'INSUFFICIENT_STOCK',
    );
  }

  return {
    strategy: input.strategy,
    requestedQuantity: input.quantity,
    allocatedQuantity,
    items,
  };
}
