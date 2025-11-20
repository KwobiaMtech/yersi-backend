# Order Confirmation Frontend Integration

## API Endpoint for Confirmation Screen

### Get Order Confirmation Details
```
GET /orders/:id/confirmation-details
```

**Response:**
```json
{
  "order": {
    "id": "order123",
    "orderNumber": "YRS123456",
    "status": "draft",
    "items": [...],
    "subtotal": 40.00,
    "deliveryFee": 8.00,
    "total": 48.00,
    "estimatedMinTotal": 38.40,
    "estimatedMaxTotal": 57.60
  },
  "vendor": {
    "id": "vendor123",
    "name": "Quick Wash",
    "rating": 4.6,
    "deliveryFee": 8.00,
    "estimatedPickupTime": 30
  },
  "service": {
    "name": "Laundry Service",
    "basePrice": 25.00
  },
  "pricingBreakdown": {
    "vendor": {
      "name": "Quick Wash",
      "deliveryFee": 8.00
    },
    "itemBreakdown": [
      {
        "itemId": "shirt001",
        "name": "Cotton Shirt",
        "basePrice": 25.00,
        "vendorPrice": 20.00,
        "quantity": 2,
        "weight": 0.5,
        "itemTotal": 20.00,
        "savings": 5.00
      }
    ],
    "comparedToBase": 2.00
  },
  "canConfirm": true,
  "confirmationRequired": true,
  "isLocked": false
}
```

## Frontend Implementation Example

### React Component
```jsx
function OrderConfirmationScreen({ orderId }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirmation-details`);
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (customerNotes) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPricing: true,
          customerNotes
        })
      });
      
      const result = await response.json();
      // Show success message and redirect
      alert(result.message);
      navigate('/orders');
    } catch (error) {
      console.error('Failed to confirm order:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!orderDetails) return <div>Order not found</div>;

  const { order, vendor, pricingBreakdown, canConfirm, isLocked } = orderDetails;

  return (
    <div className="order-confirmation">
      <h2>Order Confirmation</h2>
      
      {/* Order Summary */}
      <div className="order-summary">
        <h3>Order #{order.orderNumber}</h3>
        <p>Status: {order.status}</p>
        
        {/* Items */}
        <div className="items">
          <h4>Items</h4>
          {order.items.map(item => (
            <div key={item.itemId} className="item">
              <span>{item.name} x{item.quantity}</span>
              <span>{item.weight}kg</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Details */}
      {vendor && (
        <div className="vendor-details">
          <h4>Selected Vendor</h4>
          <div className="vendor-card">
            <h5>{vendor.name}</h5>
            <p>Rating: {vendor.rating}⭐</p>
            <p>Pickup Time: ~{vendor.estimatedPickupTime} minutes</p>
            <p>Delivery Fee: GH₵{vendor.deliveryFee}</p>
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      {pricingBreakdown && (
        <div className="pricing-breakdown">
          <h4>Pricing Details</h4>
          
          {/* Item-level pricing */}
          {pricingBreakdown.itemBreakdown.map(item => (
            <div key={item.itemId} className="item-pricing">
              <span>{item.name}</span>
              <div className="pricing">
                <span className="base-price">Base: GH₵{item.basePrice}</span>
                <span className="vendor-price">Vendor: GH₵{item.vendorPrice}</span>
                {item.savings > 0 && (
                  <span className="savings">Save GH₵{item.savings}</span>
                )}
              </div>
              <span className="total">GH₵{item.itemTotal}</span>
            </div>
          ))}
          
          {/* Total savings */}
          {pricingBreakdown.comparedToBase > 0 && (
            <div className="total-savings">
              <strong>Total Savings: GH₵{pricingBreakdown.comparedToBase}</strong>
            </div>
          )}
        </div>
      )}

      {/* Order Totals */}
      <div className="order-totals">
        <div className="total-line">
          <span>Subtotal:</span>
          <span>GH₵{order.subtotal}</span>
        </div>
        <div className="total-line">
          <span>Delivery Fee:</span>
          <span>GH₵{order.deliveryFee}</span>
        </div>
        <div className="total-line final-total">
          <span>Total:</span>
          <span>GH₵{order.total}</span>
        </div>
        <div className="estimate-range">
          <small>Estimated range: GH₵{order.estimatedMinTotal} - GH₵{order.estimatedMaxTotal}</small>
        </div>
      </div>

      {/* Confirmation Actions */}
      <div className="confirmation-actions">
        {isLocked ? (
          <div className="locked-message">
            <p>✅ Order confirmed and locked</p>
            <p>Pricing cannot be changed</p>
          </div>
        ) : canConfirm ? (
          <div className="confirm-section">
            <textarea 
              placeholder="Special instructions (optional)"
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
            <button 
              className="confirm-btn"
              onClick={() => confirmOrder(customerNotes)}
            >
              Confirm Order - Pay GH₵{order.total}
            </button>
            <p className="confirmation-note">
              By confirming, you agree to the pricing and vendor selection above.
              This cannot be changed after confirmation.
            </p>
          </div>
        ) : (
          <div className="cannot-confirm">
            <p>⚠️ Please select a vendor before confirming</p>
            <button onClick={() => navigate(`/orders/${orderId}/edit`)}>
              Select Vendor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Key Frontend Features

### 1. **Complete Order Preview**
- Shows all order details with current pricing
- Displays vendor information and ratings
- Item-by-item pricing breakdown

### 2. **Pricing Transparency**
- Base price vs vendor price comparison
- Savings calculation per item
- Total cost breakdown with delivery fees

### 3. **Confirmation Controls**
- Clear call-to-action button
- Customer notes input
- Confirmation requirements validation

### 4. **Status Awareness**
- Shows if order can be confirmed
- Displays locked status for confirmed orders
- Prevents actions on confirmed orders

### 5. **User Guidance**
- Clear messaging about what confirmation means
- Next steps after confirmation
- Error handling for missing requirements

This provides customers with complete transparency before committing to their order!
