import { HttpException, HttpStatus } from '@nestjs/common';
import { getErrorMessage } from './getErrorMessage';

export const getError = (error: unknown) => {
  // If it's already an HttpException, return it as is
  if (error instanceof HttpException) {
    return error;
  }

  // For other errors, create a new HttpException
  return new HttpException(
    {
      message: getErrorMessage(error),
    },
    error instanceof Error
      ? HttpStatus.BAD_REQUEST
      : HttpStatus.INTERNAL_SERVER_ERROR,
  );
};
