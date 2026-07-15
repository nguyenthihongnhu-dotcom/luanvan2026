import type { Request, Response } from 'express';
import {
  createLocation,
  listLocations,
  removeLocationLayer,
  removeShelfLocations,
} from './locations.service';
import {
  parseCreateLocation,
  parseLayerDeleteQuery,
  parseLocationFilters,
  parseShelfId,
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
