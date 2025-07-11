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
  const currency = variant.price?.currencyCode || 'USD';

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
  const currency = variant.price?.currencyCode || 'USD';

  return RNInsider.createNewProduct(
    productID,
    name,
    taxonomy,
    imageURL,
    price,
    currency,
  );
}
