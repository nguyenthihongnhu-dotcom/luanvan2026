import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'HTTP_ERROR',
  ) {
    super(message);
  }
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(
    new HttpError(
      404,
      `Route ${req.method} ${req.path} not found`,
      'ROUTE_NOT_FOUND',
    ),
  );
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  void _next;

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    },
  });
}
