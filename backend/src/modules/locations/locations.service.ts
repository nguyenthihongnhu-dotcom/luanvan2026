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
  findLocations as findLocationsRepository,
  findLocationHistory,
  insertLocation,
  insertShelf,
  insertZone,
  softDeleteLocationByLayer,
  softDeleteLocationsByShelfId,
  reorderShelvesRepository,
} from './locations.repository';

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
  return softDeleteLocationsByShelfId(shelfId);
}

export async function removeLocationLayer(
  shelfId: number,
  layerNo: number,
): Promise<MutationResult> {
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
