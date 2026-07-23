import type { Request, Response } from 'express';
import {
  createLocation,
  createShelf,
  createZone,
  listLocations,
  listLocationHistory,
  removeLocationLayer,
  removeShelfLocations,
  reorderShelves,
} from './locations.service';
import {
  parseCreateLocation,
  parseCreateShelf,
  parseCreateZone,
  parseLayerDeleteQuery,
  parseLocationFilters,
  parseShelfId,
  parseReorderShelves,
} from './locations.validation';

export async function listLocationsController(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseLocationFilters(req.query);

  res.json({ data: await listLocations(filters) });
}

export async function addLocationController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateLocation(req.body);
  const result = await createLocation(input);

  res.status(201).json({ data: result });
}

export async function removeShelfLocationsController(
  req: Request,
  res: Response,
): Promise<void> {
  const shelfId = parseShelfId(req.params.shelfId);

  res.json({ data: await removeShelfLocations(shelfId) });
}

export async function removeLocationLayerController(
  req: Request,
  res: Response,
): Promise<void> {
  const { shelfId, layerNo } = parseLayerDeleteQuery(req.query);

  res.json({ data: await removeLocationLayer(shelfId, layerNo) });
}

export async function addShelfController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateShelf(req.body);
  const result = await createShelf(input);

  res.status(201).json({ data: result });
}
export async function addZoneController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateZone(req.body);
  const result = await createZone(input);

  res.status(201).json({ data: result });
}

export async function reorderShelvesController(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseReorderShelves(req.body);

  res.json({ data: await reorderShelves(input) });
}
export async function listLocationHistoryController(
  req: Request,
  res: Response,
): Promise<void> {
  const locationId = parseShelfId(req.params.id);

  res.json({ data: await listLocationHistory(locationId) });
}
