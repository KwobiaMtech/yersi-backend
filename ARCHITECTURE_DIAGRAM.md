# Payment System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORDERS MODULE                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  OrdersController                                         │  │
│  │  - POST /orders/checkout                                  │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  OrdersService                                            │  │
│  │  - processCheckout()                                      │  │
│  │  - processPayment() [delegates to PaymentsService]       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENTS MODULE                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PaymentsController                                       │  │
│  │  - POST /payments/initialize                              │  │
│  │  - GET  /payments/status/:id                              │  │
│  │  - GET  /payments/wallet/balance/:currency                │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  PaymentsService                                          │  │
│  │  - initializePayment()                                    │  │
│  │  - checkPaymentStatus()                                   │  │
│  │  - getWalletBalance()                                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  PaymentProviderFactory                                   │  │
│  │  - getProvider() → Returns active provider                │  │
│  │  - Reads PAYMENT_PROVIDER from config                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐         │
│  │  SeevCash   │   │  Paystack   │   │ Flutterwave │         │
│  │  Provider   │   │  Provider   │   │  Provider   │         │
│  │  ✅ Active  │   │  🚧 Future  │   │  🚧 Future  │         │
│  └──────┬──────┘   └─────────────┘   └─────────────┘         │
│         │                                                      │
│         │ implements IPaymentProvider                          │
│         │ - deposit()                                          │
│         │ - withdraw()                                         │
│         │ - getTransactionStatus()                             │
│         │ - getWalletBalance()                                 │
│         │                                                      │
└─────────┼──────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEEVCASH API (External)                       │
│  - POST /third-party/deposit                                     │
│  - POST /third-party/withdraw                                    │
│  - GET  /third-party/status/:id                                  │
│  - GET  /third-party/wallet/balance/:currency                    │
└─────────────────────────────────────────────────────────────────┘
```

## Payment Flow Sequence

```
User                 Frontend              Backend              SeevCash API
 │                      │                      │                      │
 │  1. Checkout         │                      │                      │
 ├─────────────────────>│                      │                      │
 │                      │  2. POST /payments/  │                      │
 │                      │     initialize       │                      │
 │                      ├─────────────────────>│                      │
 │                      │                      │  3. POST /deposit    │
 │                      │                      ├─────────────────────>│
 │                      │                      │  4. transactionId    │
 │                      │                      │     status: PENDING  │
 │                      │                      │<─────────────────────┤
 │                      │  5. Payment details  │                      │
 │                      │     transactionId    │                      │
 │                      │<─────────────────────┤                      │
 │  6. Payment prompt   │                      │                      │
 │<─────────────────────┤                      │                      │
 │                      │                      │                      │
 │  7. Enter PIN        │                      │                      │
 │  on phone            │                      │                      │
 │                      │                      │                      │
 │                      │  8. Poll status      │                      │
 │                      ├─────────────────────>│                      │
 │                      │                      │  9. GET /status/:id  │
 │                      │                      ├─────────────────────>│
 │                      │                      │  10. status: SUCCESS │
 │                      │                      │<─────────────────────┤
 │                      │  11. Payment success │                      │
 │                      │<─────────────────────┤                      │
 │  12. Order confirmed │                      │                      │
 │<─────────────────────┤                      │                      │
```

## Provider Pattern Benefits

```
┌──────────────────────────────────────────────────────────────┐
│  Configuration Change Only (No Code Changes)                  │
└──────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  SeevCash    │     │  Paystack    │     │ Flutterwave  │
│              │     │              │     │              │
│ PAYMENT_     │     │ PAYMENT_     │     │ PAYMENT_     │
│ PROVIDER=    │     │ PROVIDER=    │     │ PROVIDER=    │
│ seevcash     │     │ paystack     │     │ flutterwave  │
│              │     │              │     │              │
│ ✅ Ghana     │     │ ✅ Cards     │     │ ✅ Multi-    │
│    Mobile    │     │ ✅ Mobile    │     │    currency  │
│    Money     │     │    Money     │     │ ✅ Global    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Data Flow

```
┌─────────────┐
│   Order     │
│  Created    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  Payment    │─────>│   Payment    │
│ Initialize  │      │   Record     │
└──────┬──────┘      │  (MongoDB)   │
       │             └──────────────┘
       ▼
┌─────────────┐
│  Provider   │
│   Factory   │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  SeevCash   │─────>│  SeevCash    │
│  Provider   │      │     API      │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│   Update    │
│   Payment   │
│   Status    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Update    │
│    Order    │
│   Status    │
└─────────────┘
```

## File Structure

```
src/modules/payments/
│
├── interfaces/
│   └── payment-provider.interface.ts
│       ├── IPaymentProvider (interface)
│       ├── PaymentProviderType (enum)
│       ├── TransactionStatus (enum)
│       └── Request/Response types
│
├── providers/
│   ├── seevcash.provider.ts ✅
│   ├── paystack.provider.ts 🚧
│   └── flutterwave.provider.ts 🚧
│
├── factories/
│   └── payment-provider.factory.ts
│       └── getProvider() → IPaymentProvider
│
├── services/
│   └── payments.service.ts
│       ├── initializePayment()
│       ├── checkPaymentStatus()
│       └── getWalletBalance()
│
├── controllers/
│   └── payments.controller.ts
│       ├── POST /initialize
│       ├── GET /status/:id
│       └── GET /wallet/balance/:currency
│
├── dto/
│   └── payment.dto.ts
│
├── schemas/
│   └── payment.schema.ts
│
└── tests/
    └── payment-provider.spec.ts
```

## Configuration Flow

```
.env file
   │
   ├─> PAYMENT_PROVIDER=seevcash
   ├─> SEEVCASH_API_KEY=sk_...
   └─> SEEVCASH_BASE_URL=https://...
         │
         ▼
   ConfigService
         │
         ▼
   PaymentProviderFactory
         │
         ├─> if (seevcash) → SeevcashProvider
         ├─> if (paystack) → PaystackProvider
         └─> if (flutterwave) → FlutterwaveProvider
```

## Error Handling Flow

```
Client Request
     │
     ▼
PaymentsService
     │
     ├─> try {
     │     Provider.deposit()
     │   }
     │
     ├─> catch (error) {
     │     Logger.error()
     │     throw BadRequestException
     │   }
     │
     ▼
Error Response to Client
```
