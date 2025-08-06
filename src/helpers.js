import RNInsider from 'react-native-insider';
import { shopifyIdHelper } from '@appmaker-xyz/shopify';

export function mapShopifyProductToInsider(shopifyProduct) {
  if (!shopifyProduct || typeof shopifyProduct !== 'object') return null;

  const id = shopifyIdHelper(shopifyProduct.id, true);
  const name = shopifyProduct.title || '';
  const taxonomy = shopifyProduct.productType
    ? [shopifyProduct.productType]
    : [];
  const imageURL = shopifyProduct.images?.edges?.[0]?.node?.url || '';

  const variant = shopifyProduct.variants?.edges?.[0]?.node || {};
  const price = parseFloat(variant.price?.amount) || 0;
  const currency = variant.price?.currencyCode || 'IDR';

  return RNInsider.createNewProduct(
    id,
    name,
    taxonomy,
    imageURL,
    price,
    currency,
  );
}

export function mapLineItemToInsiderProduct(lineItem) {
  if (!lineItem || typeof lineItem !== 'object') return null;

  const product = lineItem.variant?.product || {};
  const variant = lineItem.variant || {};

  const productID = shopifyIdHelper(product.id, true);
  const name = lineItem.title || '';
  const taxonomy = product.productType ? [product.productType] : [];
  const imageURL = product.images?.edges?.[0]?.node?.url || '';
  const price = parseFloat(variant.price?.amount) || 0;
  const currency = variant.price?.currencyCode || 'IDR';

  return RNInsider.createNewProduct(
    productID,
    name,
    taxonomy,
    imageURL,
    price,
    currency,
  );
}

export function trackPurchaseWithInsider(context) {
  const { cart, eventParams } = context;

  if (!cart || !eventParams) return;

  const lineItems = cart?.lineItems?.edges?.map((edge) => edge?.node) || [];

  const prices = lineItems.map((item) => item?.variant?.price?.amount || '0');
  const pricesString = prices.join(',');

  const subtotal = parseFloat(cart?.subtotalPrice?.amount || '0');
  const total = parseFloat(cart?.totalPrice?.amount || '0');
  const totalDiscount = String(subtotal - total);

  const productIds = lineItems
    ?.map((item) => item?.variant?.product?.id)
    ?.filter(Boolean)
    ?.map((id) => shopifyIdHelper(id, true));

  const productIdsString = productIds.join(',');

  const productNames = lineItems?.map(
    (item) => item?.variant?.product?.title || '',
  );

  const productNamesString = productNames.join(',');

  const quantity = lineItems.reduce(
    (total, item) => total + (item?.quantity || 0),
    0,
  );
  const quantityString = String(quantity);

  const currency = eventParams?.currency || 'IDR';
  const orderId = eventParams?.order_id || '';
  const totalAmountString = String(eventParams?.total_amount || '0');
  const purchaseDate = new Date().toISOString();

  const deliverySubdistrict = cart?.shippingAddress?.subdistrict || 'NA';
  const deliveryPostalCode = cart?.shippingAddress?.postalCode || 'NA';
  const deliveryProvince = cart?.shippingAddress?.province || 'NA';
  const deliveryCity = cart?.shippingAddress?.city || 'NA';

  console.log('[Insider] purchase event fired');

  RNInsider.tagEvent('purchase')
    .addParameterWithString('prices', pricesString)
    .addParameterWithString('payment_method', 'NA')
    .addParameterWithString('order_id', orderId)
    .addParameterWithString('quantity', quantityString)
    .addParameterWithString('src', 'appmaker')
    .addParameterWithString('total_payment', totalAmountString)
    .addParameterWithString('product_ids', productIdsString)
    .addParameterWithString('currency', currency)
    .addParameterWithString('total_amount', totalAmountString)
    .addParameterWithString('campaign_source', '')
    .addParameterWithString('delivery_subdistrict', deliverySubdistrict)
    .addParameterWithString('campaign_name', 'NA')
    .addParameterWithString('voucher_used', 'NA')
    .addParameterWithString('purchase_date', purchaseDate)
    .addParameterWithString('product_names', productNamesString)
    .addParameterWithString('delivery_postalcode', deliveryPostalCode)
    .addParameterWithString('total_shipping', 'NA')
    .addParameterWithString('total_quantity', quantityString)
    .addParameterWithString('total_discount', totalDiscount)
    .addParameterWithString('delivery_province', deliveryProvince)
    .addParameterWithString('delivery_city', deliveryCity)
    .build();
}
