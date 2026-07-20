import type { NextFunction, Request, Response } from 'express';
import { HttpError, asyncHandler, errorHandler, notFoundHandler } from './http';

describe('common/http', () => {
  it('wraps async route failures and forwards them to next', async () => {
    const error = new Error('boom');
    const next = jest.fn<void, [unknown]>();
    const handler = asyncHandler(() => Promise.reject(error));

    handler({} as Request, {} as Response, next as NextFunction);
    await new Promise<void>((resolve) => process.nextTick(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });

  it('creates a route not found error with request context', () => {
    const next = jest.fn<void, [unknown]>();

    notFoundHandler(
      { method: 'GET', path: '/missing' } as Request,
      {} as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledWith(expect.any(HttpError));
    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(HttpError);
    const httpError = error as HttpError;
    expect(httpError.statusCode).toBe(404);
    expect(httpError.code).toBe('ROUTE_NOT_FOUND');
  });

  it('serializes HttpError responses consistently', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const response = { status, json } as unknown as Response;

    errorHandler(
      new HttpError(401, 'No token', 'TOKEN_MISSING'),
      { requestId: 'req-1' } as Request,
      response,
      jest.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'TOKEN_MISSING',
        message: 'No token',
        requestId: 'req-1',
      },
    });
  });
});
