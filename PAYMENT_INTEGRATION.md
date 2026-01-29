# Payment Integration Guide

## Overview

The payment system uses a **provider pattern** that allows easy switching between different payment gateways without changing business logic.

## Architecture

```
PaymentProviderFactory (selects provider based on config)
    ↓
IPaymentProvider (interface)
    ↓
├── SeevcashProvider (implemented)
├── PaystackProvider (future)
└── FlutterwaveProvider (future)
```

## Current Provider: SeevCash

### Configuration

Add to `.env`:
```bash
PAYMENT_PROVIDER=seevcash
SEEVCASH_API_KEY=sk_d5225c581c2bead308384965d05fe30f44f30cdaac713322fd9418251b004a04
SEEVCASH_BASE_URL=https://api-dev.seevcash.com/api/v1
```

### API Endpoints

#### 1. Initialize Payment (Deposit)
```bash
POST /api/v1/payments/initialize
Authorization: Bearer <token>

{
  "orderId": "order-123",
  "paymentMethod": "mobile_money",
  "phoneNumber": "+233542853417",
  "accountName": "Patrick Oduro",
  "mobileMoneyProvider": "MTN"
}
```

**Response:**
```json
{
  "paymentId": "65f...",
  "transactionId": "DEP_38e955df-884d-4b24-9aa4-173b84c57c29",
  "status": "PENDING",
  "amount": 100,
  "feeAmount": 0.15,
  "userAmount": 100.15,
  "reference": "YRS_1738148709290_order-123"
}
```

#### 2. Check Payment Status
```bash
GET /api/v1/payments/status/:transactionId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "transactionId": "DEP_38e955df-884d-4b24-9aa4-173b84c57c29",
  "status": "SUCCESS",
  "paymentId": "65f..."
}
```

#### 3. Get Wallet Balance
```bash
GET /api/v1/payments/wallet/balance/GHS
Authorization: Bearer <token>
```

**Response:**
```json
{
  "balance": 153.62,
  "currency": "GHS"
}
```

## Payment Flow

1. **User initiates checkout** → `POST /orders/checkout`
2. **System creates payment** → `POST /payments/initialize`
3. **SeevCash processes** → User receives mobile money prompt
4. **Poll status** → `GET /payments/status/:transactionId`
5. **Update order status** → When payment succeeds

## Switching Payment Providers

### To switch to Paystack:

1. **Implement provider:**
```typescript
// src/modules/payments/providers/paystack.provider.ts
@Injectable()
export class PaystackProvider implements IPaymentProvider {
  async deposit(request: DepositRequest): Promise<DepositResponse> {
    // Paystack implementation
  }
  // ... other methods
}
```

2. **Register in factory:**
```typescript
// src/modules/payments/factories/payment-provider.factory.ts
case PaymentProviderType.PAYSTACK:
  return this.paystackProvider;
```

3. **Update config:**
```bash
PAYMENT_PROVIDER=paystack
PAYSTACK_SECRET_KEY=sk_...
```

4. **No code changes needed** - Factory handles the switch!

## Provider Interface

All providers must implement:
```typescript
interface IPaymentProvider {
  deposit(request: DepositRequest): Promise<DepositResponse>;
  withdraw(request: WithdrawRequest): Promise<WithdrawResponse>;
  getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse>;
  getWalletBalance(currency: string): Promise<WalletBalanceResponse>;
}
```

## Database Schema

```typescript
Payment {
  orderId: ObjectId
  userId: ObjectId
  amount: number
  currency: string
  paymentMethod: 'mobile_money' | 'credit_card' | 'credit_balance'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  transactionId: string
  phone: string
  network: string
  gatewayResponse: object
}
```

## Testing

```bash
# Initialize payment
curl -X POST http://localhost:3000/api/v1/payments/initialize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "paymentMethod": "mobile_money",
    "phoneNumber": "+233542853417",
    "accountName": "Test User",
    "mobileMoneyProvider": "MTN"
  }'

# Check status
curl http://localhost:3000/api/v1/payments/status/DEP_xxx \
  -H "Authorization: Bearer <token>"

# Get balance
curl http://localhost:3000/api/v1/payments/wallet/balance/GHS \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

- [ ] Webhook handlers for payment confirmations
- [ ] Automatic payment status polling
- [ ] Refund support
- [ ] Payment retry mechanism
- [ ] Multiple payment methods per order
- [ ] Partial payments with credits
- [ ] Payment analytics dashboard
