import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ApiAuthResponses = () =>
  applyDecorators(
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Unauthorized',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Token is valid but lacks required permissions',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Forbidden resource',
          },
        },
      },
    }),
  );
