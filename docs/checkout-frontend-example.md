# Checkout Flow Frontend Implementation

## API Endpoints

### Get Checkout Details
```
GET /orders/:id/checkout
```

### Process Checkout
```
POST /orders/checkout
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';

function CheckoutScreen({ orderId, onBack, onSuccess }) {
  const [checkoutData, setCheckoutData] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState('delivery_service');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCheckoutDetails();
  }, [orderId]);

  const fetchCheckoutDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/checkout`);
      const data = await response.json();
      setCheckoutData(data);
      
      // Set default payment method
      const defaultPayment = data.paymentMethods.find(pm => pm.isDefault);
      if (defaultPayment) {
        setSelectedPayment(defaultPayment.id);
      }
    } catch (error) {
      console.error('Failed to fetch checkout details:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCheckout = async () => {
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      const paymentMethod = checkoutData.paymentMethods.find(pm => pm.id === selectedPayment);
      
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          checkoutOptions: {
            deliveryType: selectedDelivery,
            paymentMethod: paymentMethod.type,
            paymentDetails: paymentMethod.details,
          },
          customerNotes,
        }),
      });

      const result = await response.json();
      
      if (result.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = result.paymentUrl;
      } else {
        // Success - show confirmation
        onSuccess(result);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotal = () => {
    if (!checkoutData) return 0;
    
    const deliveryOption = checkoutData.deliveryOptions.find(
      opt => opt.type === selectedDelivery
    );
    
    return checkoutData.order.subtotal + (deliveryOption?.fee || 0);
  };

  if (loading) return <div className="loading">Loading checkout...</div>;
  if (!checkoutData) return <div className="error">Failed to load checkout details</div>;

  return (
    <div className="checkout-screen">
      {/* Header */}
      <div className="checkout-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={24} />
        </button>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-content">
        {/* Delivery Options */}
        <div className="delivery-section">
          <h3>Delivery Options</h3>
          
          {checkoutData.deliveryOptions.map((option) => (
            <div key={option.type} className="delivery-option">
              <label className="radio-option">
                <input
                  type="radio"
                  name="delivery"
                  value={option.type}
                  checked={selectedDelivery === option.type}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-title">{option.name}</div>
                  <div className="option-description">{option.description}</div>
                  {option.fee > 0 && (
                    <div className="option-fee">+GH₵{option.fee}</div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="payment-section">
          <h3>Payment Method</h3>
          
          {checkoutData.paymentMethods.map((method) => (
            <div key={method.id} className="payment-option">
              <label className="radio-option">
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={selectedPayment === method.id}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                />
                <div className="payment-content">
                  <div className="payment-icon">
                    {method.type === 'mtn_mobile_money' && (
                      <img src="/mtn-logo.png" alt="MTN" className="provider-logo" />
                    )}
                    {method.type === 'visa_card' && (
                      <img src="/visa-logo.png" alt="Visa" className="provider-logo" />
                    )}
                  </div>
                  <div className="payment-details">
                    <div className="payment-name">{method.displayName}</div>
                    <div className="payment-number">{method.details}</div>
                  </div>
                  {method.isDefault && (
                    <div className="default-badge">Default</div>
                  )}
                </div>
              </label>
            </div>
          ))}
          
          {checkoutData.canAddPaymentMethod && (
            <button className="add-payment-button">
              <Plus size={20} />
              Add Method
            </button>
          )}
        </div>

        {/* Customer Notes */}
        <div className="notes-section">
          <h3>Special Instructions (Optional)</h3>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Any special instructions for the vendor..."
            className="notes-input"
            rows={3}
          />
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-row">
            <span>Total Order</span>
            <span>Cost</span>
          </div>
          <div className="summary-row main">
            <span>{checkoutData.order.totalItems} Items</span>
            <span>GH₵{calculateTotal()}</span>
          </div>
          
          {/* Breakdown */}
          <div className="breakdown">
            <div className="breakdown-row">
              <span>Subtotal:</span>
              <span>GH₵{checkoutData.order.subtotal}</span>
            </div>
            {selectedDelivery === 'delivery_service' && (
              <div className="breakdown-row">
                <span>Delivery Fee:</span>
                <span>GH₵{checkoutData.order.deliveryFee}</span>
              </div>
            )}
            {selectedDelivery === 'self_service' && (
              <div className="breakdown-row savings">
                <span>Self Service Discount:</span>
                <span>-GH₵{checkoutData.order.deliveryFee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pay Button */}
        <button
          className="pay-button"
          onClick={processCheckout}
          disabled={processing || !selectedPayment}
        >
          {processing ? 'Processing...' : `Pay GH₵${calculateTotal()}`}
        </button>
      </div>
    </div>
  );
}

export default CheckoutScreen;
```

## CSS Styles

```css
.checkout-screen {
  max-width: 400px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
}

.checkout-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.back-button {
  background: none;
  border: none;
  padding: 8px;
  margin-right: 16px;
  cursor: pointer;
}

.checkout-content {
  padding: 20px;
}

.delivery-section, .payment-section, .notes-section {
  margin-bottom: 32px;
}

.delivery-section h3, .payment-section h3, .notes-section h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.radio-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #3b82f6;
}

.radio-option input[type="radio"] {
  margin-right: 12px;
}

.option-content, .payment-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-description {
  color: #666;
  font-size: 14px;
}

.option-fee {
  color: #3b82f6;
  font-weight: 600;
}

.payment-content {
  align-items: center;
}

.provider-logo {
  width: 32px;
  height: 20px;
  margin-right: 12px;
}

.payment-details {
  flex: 1;
}

.payment-name {
  font-weight: 600;
}

.payment-number {
  color: #666;
  font-size: 14px;
}

.default-badge {
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.add-payment-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  border: 2px dashed #3b82f6;
  background: none;
  color: #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.notes-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.order-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-row.main {
  font-size: 18px;
  font-weight: 600;
  padding-top: 8px;
  border-top: 1px solid #e5e5e5;
}

.breakdown {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e5e5;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.breakdown-row.savings {
  color: #10b981;
}

.pay-button {
  width: 100%;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pay-button:hover:not(:disabled) {
  background: #2563eb;
}

.pay-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
```

## Key Features Implemented

### 1. **Delivery Options**
- Self Service (no delivery fee)
- Delivery Service (with address and fee)
- Dynamic total calculation

### 2. **Payment Methods**
- Saved payment methods with defaults
- MTN Mobile Money, Visa Card support
- Add new payment method option

### 3. **Order Summary**
- Item count and total cost
- Breakdown showing subtotal, delivery fee
- Self-service discount display

### 4. **User Experience**
- Clean, mobile-first design
- Real-time total updates
- Loading and processing states
- Form validation

This matches the checkout template design while providing full functionality for the laundry service! 🎉
