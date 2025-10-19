# Payment Gateway Configuration Update

## ✅ Changes Made

The payment gateway system has been updated to use **admin panel configuration** instead of environment variables.

## 📝 Modified Files

### 1. **Checkout Layout** (`src/app/checkout/layout.jsx`)
- ✅ Fetches Stripe publishable key from `/api/setting?type=payment`
- ✅ Shows loading spinner while fetching settings
- ✅ Shows error message if payment gateway not configured
- ✅ Dynamically loads Stripe with admin-configured key

### 2. **Checkout Order Summary** (`src/app/checkout/components/CheckoutOrderSummary.jsx`)
- ✅ Fetches store settings for currency symbol and code
- ✅ Uses `storeSettings.currencySymbol` instead of `process.env.NEXT_PUBLIC_CURRENCY_SYMBOL`
- ✅ Uses `storeSettings.storeCurrency` instead of `process.env.NEXT_PUBLIC_STORE_CURRENCY`
- ✅ Passes currency symbol to order creation

### 3. **Admin Payment Page** (`src/app/admin/payment/page.jsx`)
- ✅ Fetches store settings for currency display
- ✅ Uses admin-configured currency symbol in payment table

### 4. **Stripe Payment API** (`src/app/api/payment/stripe/route.js`)
- ✅ Fetches payment settings from database
- ✅ Validates that Stripe is enabled and configured
- ✅ Uses `paymentSettings.stripe.secretKey` instead of `process.env.STRIPE_SECRET_KEY`
- ✅ Returns error if payment gateway not configured

## 🎯 How It Works Now

### Admin Configuration (Payment Gateway Page)
1. Admin goes to **Admin Panel → Payment Gateway**
2. Enables Stripe toggle
3. Enters:
   - **Publishable Key** (pk_test_xxx or pk_live_xxx)
   - **Secret Key** (sk_test_xxx or sk_live_xxx)
   - **Webhook Secret** (optional, whsec_xxx)
4. Clicks "Save Changes"
5. Settings saved to MongoDB in `settings` collection with `type: "payment"`

### Customer Checkout Flow
1. Customer goes to checkout page
2. System fetches payment settings from database
3. If Stripe enabled:
   - Loads Stripe.js with admin-configured publishable key
   - Shows card payment form
4. When customer clicks "Pay":
   - Frontend sends payment request to API
   - API fetches payment settings from database
   - API uses admin-configured secret key to create payment intent
   - Payment processed successfully

### Currency Display
- Currency symbol and code now come from **Store Settings** (Admin Panel → Settings → Store)
- No longer depends on environment variables
- Consistent across all pages (checkout, admin payment list, etc.)

## 🗄️ Database Structure

### Payment Settings Document
```json
{
  "_id": "...",
  "type": "payment",
  "stripe": {
    "enabled": true,
    "publishableKey": "pk_test_...",
    "secretKey": "sk_test_...",
    "webhookSecret": "whsec_..."
  },
  "paypal": {
    "enabled": false,
    "clientId": "",
    "clientSecret": "",
    "mode": "sandbox"
  },
  "razorpay": {
    "enabled": false,
    "keyId": "",
    "keySecret": "",
    "webhookSecret": ""
  }
}
```

### Store Settings Document
```json
{
  "_id": "...",
  "type": "store",
  "currencySymbol": "$",
  "storeCurrency": "USD",
  "storeName": "Shop Gold",
  "logoImage": "/logo.png",
  ...
}
```

## ⚠️ Important Notes

### Environment Variables (Optional)
You can now **remove** these from your `.env` file:
```
# No longer needed:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_CURRENCY_SYMBOL
NEXT_PUBLIC_STORE_CURRENCY
```

### Caching
- Payment and store settings are cached for **5 minutes** (300 seconds)
- To update payment gateway, admin must:
  1. Change settings in admin panel
  2. Wait up to 5 minutes for cache to refresh
  3. Or clear browser cache for immediate effect

### Security
- ✅ Secret keys are stored in database (server-side only)
- ✅ Publishable keys are safe to expose to frontend
- ✅ Database connection required for payment processing
- ✅ Validates payment gateway is enabled before processing

### Error Handling
- Shows loading spinner during settings fetch
- Shows "Payment gateway not configured" if admin hasn't set up Stripe
- Returns API error if Stripe settings missing or invalid
- Graceful fallback for missing currency symbols

## 🚀 Benefits

1. **No Environment Variables**: All configuration in admin panel
2. **Dynamic Updates**: Change payment gateway without redeploying
3. **Multi-Gateway Ready**: Easy to add PayPal, Razorpay, etc.
4. **Secure**: Secret keys stored in database, not in code
5. **User-Friendly**: Admin can configure without technical knowledge
6. **Consistent**: Single source of truth for all payment settings

## 📋 Testing Checklist

- [ ] Admin can enable/disable Stripe in payment gateway page
- [ ] Admin can save Stripe keys successfully
- [ ] Checkout page loads Stripe with admin-configured key
- [ ] Currency symbol displays correctly throughout checkout
- [ ] Payment processes successfully with admin-configured keys
- [ ] Admin payment page shows correct currency
- [ ] Error handling works when gateway not configured

## 🔄 Migration Steps (If Needed)

If you have existing environment variables and want to migrate:

1. Go to Admin Panel → Payment Gateway
2. Copy your Stripe keys from `.env` file
3. Paste them in the payment gateway form
4. Enable Stripe toggle
5. Save settings
6. Test a payment to confirm it works
7. Remove old environment variables from `.env`

---

**Last Updated**: October 19, 2025
