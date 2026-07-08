import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  WebhookReceiveSuccessResponseDto,
  WebhookStatusSuccessResponseDto,
} from '../../common/dto/api-envelope.dto';
import { ApiWebhookErrors } from '../../common/swagger/api-responses';
import { successResponse } from '../../common/dto/api-envelope';
import { TATUM_PAYLOAD_HASH_HEADER } from './tatum-webhook-auth';
import { TatumWebhookService } from './tatum-webhook.service';

@ApiTags('webhooks')
@SkipThrottle()
@Controller('webhooks/tron')
export class TronWebhookController {
  constructor(private readonly tatumWebhook: TatumWebhookService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Webhook service status (is the receiver active + recent deliveries)',
  })
  @ApiOkResponse({ type: WebhookStatusSuccessResponseDto })
  async status() {
    return successResponse(await this.tatumWebhook.getStatus());
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: false, transform: false }))
  @ApiOperation({ summary: 'Receive TRON webhook payloads (provider push)' })
  @ApiHeader({
    name: TATUM_PAYLOAD_HASH_HEADER,
    required: false,
    description:
      'Tatum HMAC SHA-512 signature (base64). Only validated when TATUM_WEBHOOK_HMAC_SECRET is configured; ignored otherwise.',
  })
  @ApiBody({
    description: 'Tatum ADDRESS_EVENT (token_transfer) payload',
    schema: { type: 'object' },
    examples: {
      usdtTransferShasta: {
        summary: 'Sample USDT TRC20 transfer (Shasta)',
        description:
          'Change txId to a unique 64-char hex value to insert a new row; reusing the same txId is safely deduplicated.',
        value: {
          kind: 'token_transfer',
          blockHash:
            '0000000003f58b485a04b80e00ea385d7258accafb62079a00ee17dff8f08656',
          blockNumber: 66423624,
          blockTimestamp: 1783470642000,
          txId: 'f247cdd9f1ad0e383791efb12ee1bcc789da7608ec87c0cbbf7a444f9590856e',
          txTimestamp: 1783470636000,
          from: 'TY7qDg91GYtwFpyieenJb2F8rUvo7VPxbt',
          to: 'TFCJpYH7LzLSXTWFj7syybrMU4cHvuX39k',
          value: '1',
          contractAddress: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
          currency: 'TRON',
          logIndex: 0,
          tokenMetadata: {
            type: 'fungible',
            symbol: 'USDT',
            name: 'TetherToken',
            decimals: 6,
          },
          chain: 'tron-testnet',
        },
      },
    },
  })
  @ApiOkResponse({ type: WebhookReceiveSuccessResponseDto })
  @ApiWebhookErrors()
  async receive(
    @Body() payload: Record<string, unknown>,
    @Headers(TATUM_PAYLOAD_HASH_HEADER) payloadHash?: string,
  ) {
    const result = await this.tatumWebhook.handleIncoming(payload, payloadHash);

    return successResponse({
      received: true,
      txId: result.txId,
      status: result.status,
    });
  }
}
