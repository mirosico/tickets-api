import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input or request parameters',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Invalid input parameters',
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error - Something went wrong on the server',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Internal server error',
          },
        },
      },
    }),
  );
}
