import { HttpError } from '../../common/http';
import type {
  CreateLocationInput,
  CreateLayerInput,
  CreateLayerResult,
  CreateShelfInput,
  CreateZoneInput,
  CreateZoneResult,
  CreateShelfResult,
  CreateLocationResult,
  LocationFilters,
  LocationRow,
  LocationHistoryRow,
  MutationResult,
  ReorderShelvesInput,
  SyncLocationMatrixInput,
  SyncLocationMatrixResult,
  UpdateZoneLayoutInput,
  ZoneFilters,
  ZoneRow,
} from './location.model';
import {
  countLayerLocationsWithStock,
  countShelfLocationsWithStock,
  findLocations as findLocationsRepository,
  findLocationHistory,
  findZonesByWarehouse,
  insertLocation,
  insertLayer,
  insertShelf,
  insertZone,
  softDeleteLocationByLayer,
  softDeleteLocationsByShelfId,
  reorderShelvesRepository,
  syncLocationMatrixRepository,
  updateZoneLayoutRepository,
} from './locations.repository';

const ZONE_ERRORS: Record<string, HttpError> = {
  ZONE_NOT_FOUND: new HttpError(
    404,
    'Không tìm thấy khu vực trong kho đang chọn',
    'ZONE_NOT_FOUND',
  ),
  ZONE_AMBIGUOUS: new HttpError(
    400,
    'Mã khu vực tồn tại ở nhiều kho, cần gửi kèm warehouseId',
    'ZONE_AMBIGUOUS',
  ),
  ZONE_CODE_EXISTS: new HttpError(
    409,
    'Mã khu vực đã tồn tại trong kho này',
    'ZONE_CODE_EXISTS',
  ),
  WAREHOUSE_NOT_FOUND: new HttpError(
    404,
    'Không tìm thấy kho',
    'WAREHOUSE_NOT_FOUND',
  ),
};

function toZoneHttpError(error: unknown): unknown {
  if (error instanceof Error && ZONE_ERRORS[error.message]) {
    return ZONE_ERRORS[error.message];
  }

  return error;
}

function throwLocationHasStock(scope: 'shelf' | 'layer', total: number): never {
  throw new HttpError(
    409,
    scope === 'shelf'
      ? `Cannot delete shelf because ${total} location(s) still contain stock`
      : `Cannot delete layer because ${total} location(s) still contain stock`,
    'LOCATION_HAS_STOCK',
  );
}

export async function listLocations(
  filters: LocationFilters,
): Promise<LocationRow[]> {
  return findLocationsRepository(filters);
}

export async function createLocation(
  input: CreateLocationInput,
): Promise<CreateLocationResult> {
  return insertLocation(input);
}

export async function removeShelfLocations(
  shelfId: number,
): Promise<MutationResult> {
  const stockLocationCount = await countShelfLocationsWithStock(shelfId);
  if (stockLocationCount > 0) {
    throwLocationHasStock('shelf', stockLocationCount);
  }

  return softDeleteLocationsByShelfId(shelfId);
}

export async function removeLocationLayer(
  shelfId: number,
  layerNo: number,
): Promise<MutationResult> {
  const stockLocationCount = await countLayerLocationsWithStock(
    shelfId,
    layerNo,
  );
  if (stockLocationCount > 0) {
    throwLocationHasStock('layer', stockLocationCount);
  }

  return softDeleteLocationByLayer(shelfId, layerNo);
}

export async function createShelf(
  input: CreateShelfInput,
): Promise<CreateShelfResult> {
  try {
    return await insertShelf(input);
  } catch (error) {
    throw toZoneHttpError(error);
  }
}

export async function createLayer(
  input: CreateLayerInput,
): Promise<CreateLayerResult> {
  try {
    return await insertLayer(input);
  } catch (error) {
    throw toZoneHttpError(error);
  }
}

export async function syncLocationMatrix(
  input: SyncLocationMatrixInput,
): Promise<SyncLocationMatrixResult> {
  try {
    return await syncLocationMatrixRepository(input);
  } catch (error) {
    throw toZoneHttpError(error);
  }
}

export async function createZone(
  input: CreateZoneInput,
): Promise<CreateZoneResult> {
  try {
    return await insertZone(input);
  } catch (error) {
    throw toZoneHttpError(error);
  }
}

export async function listZones(filters: ZoneFilters): Promise<ZoneRow[]> {
  return findZonesByWarehouse(filters.warehouseId);
}

export async function updateZoneLayout(
  input: UpdateZoneLayoutInput,
): Promise<MutationResult> {
  try {
    return await updateZoneLayoutRepository(input);
  } catch (error) {
    throw toZoneHttpError(error);
  }
}

export async function reorderShelves(
  input: ReorderShelvesInput,
): Promise<MutationResult> {
  return reorderShelvesRepository(input.shelfIds);
}
export async function listLocationHistory(
  locationId: number,
): Promise<LocationHistoryRow[]> {
  return findLocationHistory(locationId);
}
