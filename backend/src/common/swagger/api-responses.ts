import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../dto/api-envelope.dto';

export function ApiCommonErrors(): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse({
      type: ApiErrorResponseDto,
      description: 'Validation failed or malformed request',
    }),
    ApiTooManyRequestsResponse({
      type: ApiErrorResponseDto,
      description: 'Rate limit exceeded (global throttler)',
    }),
    ApiInternalServerErrorResponse({
      type: ApiErrorResponseDto,
      description: 'Unexpected server error',
    }),
  );
}

export function ApiWalletScopedReadErrors(): MethodDecorator {
  return applyDecorators(
    ApiCommonErrors(),
    ApiNotFoundResponse({
      type: ApiErrorResponseDto,
      description:
        'No monitored wallet configured (connect TronLink or set MONITORED_WALLET_ADDRESS)',
    }),
  );
}

export function ApiResourceReadErrors(): MethodDecorator {
  return applyDecorators(
    ApiCommonErrors(),
    ApiNotFoundResponse({
      type: ApiErrorResponseDto,
      description:
        'No monitored wallet configured, or resource not found for the active wallet',
    }),
  );
}

export function ApiWebhookErrors(): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse({
      type: ApiErrorResponseDto,
      description: 'Malformed or invalid webhook payload',
    }),
    ApiUnauthorizedResponse({
      type: ApiErrorResponseDto,
      description:
        'Invalid or missing x-payload-hash when TATUM_WEBHOOK_HMAC_SECRET is configured',
    }),
    ApiInternalServerErrorResponse({
      type: ApiErrorResponseDto,
      description: 'Unexpected server error',
    }),
  );
}
