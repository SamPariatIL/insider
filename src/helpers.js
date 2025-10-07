import { shopifyIdHelper } from '@appmaker-xyz/shopify';
import RNInsider from 'react-native-insider';

/**
 * Map Shopify product to Insider product
 * @param {Record<string, any>} shopifyProduct
 */
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

/**
 * Map Shopify cart line item to Insider product
 * @param {Record<string, any>} lineItem
 */
export function mapLineItemToInsiderProduct(lineItem) {
  if (!lineItem || typeof lineItem !== 'object') return null;

  const product = lineItem.variant?.product ?? {};
  const variant = lineItem.variant ?? {};

  const taxonomy = product.productType ? [product.productType] : [];
  const productID = shopifyIdHelper(product.id, true);
  const name = lineItem.title ?? '';
  const imageURL = product.images?.edges?.[0]?.node?.url ?? '';
  const compareAtPrice = parseFloat(variant.compareAtPrice?.amount) ?? 0;
  const price = parseFloat(variant.price?.amount) ?? 0;
  const discount = parseFloat(
    lineItem.discountAllocations?.[0]?.allocatedAmount?.amount ?? '0',
  );
  const currency = variant.price?.currencyCode ?? 'IDR';
  const discountAmount = compareAtPrice - price - discount;

  const insiderProduct = RNInsider.createNewProduct(
    productID,
    name,
    taxonomy,
    imageURL,
    price,
    currency,
  );

  insiderProduct.setQuantity(lineItem?.quantity);
  insiderProduct.setPromotionDiscount(discountAmount);
  insiderProduct.setSalePrice(price);

  return insiderProduct;
}

/**
 * Track purchase with Insider
 * @param {Record<string, any>} context
 * @returns {void}
 */
export function trackPurchaseWithInsider(context) {
  const { cart, eventParams } = context;

  if (!cart || !eventParams) return;

  const orderId = eventParams?.order_name ?? '';
  const cartItems = cart?.lineItems?.edges?.map((edge) => edge?.node) ?? [];

  try {
    cartItems.forEach((item) => {
      const newProduct = mapLineItemToInsiderProduct(item);

      console.log(
        '[Insider] item purchased event firing',
        JSON.stringify(newProduct),
      );

      RNInsider.itemPurchased(orderId, newProduct);

      console.log('[Insider] item purchased event fired');
    });
  } catch (error) {
    console.log('[Insider] trackPurchaseWithInsider error', error);
  }
}
