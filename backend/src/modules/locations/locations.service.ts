import { HttpError } from '../../common/http';
import type {
  CreateLocationInput,
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
} from './location.model';
import {
  countLayerLocationsWithStock,
  countShelfLocationsWithStock,
  findLocations as findLocationsRepository,
  findLocationHistory,
  insertLocation,
  insertShelf,
  insertZone,
  softDeleteLocationByLayer,
  softDeleteLocationsByShelfId,
  reorderShelvesRepository,
} from './locations.repository';

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
  return insertShelf(input);
}
export async function createZone(
  input: CreateZoneInput,
): Promise<CreateZoneResult> {
  return insertZone(input);
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
