import { HttpException, HttpStatus } from '@nestjs/common';
import { getErrorMessage } from './getErrorMessage';

export const getError = (error: unknown) => {
  return new HttpException(
    {
      message: getErrorMessage(error),
    },
    error instanceof Error
      ? HttpStatus.BAD_REQUEST
      : HttpStatus.INTERNAL_SERVER_ERROR,
  );
};
