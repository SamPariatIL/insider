import { shopifyIdHelper } from '@appmaker-xyz/shopify';
import { analytics } from '@appmaker-xyz/core';
import { analyticsSetProfile, recordEvent } from './lib';
import RNInsider from 'react-native-insider';
import RNInsiderIdentifier from 'react-native-insider/src/InsiderIdentifier';

const activateEvents = () => {
  const sendAddToCart = (params, context) => {
    recordEvent('add_to_cart', {
      Currency: params.currency,
      'Product URL': context.product?.onlineStoreUrl,
      'Product ID': shopifyIdHelper(params.item_id, true),
      'Product Price': parseInt(params.price, 10),
      'Variation ID': shopifyIdHelper(params.variant_id, true),
      'Product Title': params.item_name,
    }, context);
  };

  const sendUserLogin = (params) => {
    const currentUser = RNInsider.getCurrentUser();
    const identifiers = new RNInsiderIdentifier();

    if (params?.email) identifiers.addEmail(params.email);
    if (params?.phone) identifiers.addPhoneNumber(params.phone);
    if (params?.id) identifiers.addUserID(params.id);

    currentUser.login(identifiers);
    currentUser.build();
  };

  const sendUserLogout = () => {
    RNInsider.getCurrentUser().logout();
  };

  analytics.onTrack((event, params, context) => {
    switch (event) {
      case 'product_added_to_cart':
        sendAddToCart(params, context);
        break;
      case 'collection_view':
        RNInsider.visitListingPage([
          params?.item_list_handle,
          params?.item_list_id,
          params?.item_list_name,
        ]);
        break;
      case 'user_login':
        sendUserLogin(params);
        break;
      case 'user_logout':
        sendUserLogout();
        break;
      default:
        break;
    }
  }, 'insider-analytics');

  analytics.onIdentify((userId, params) => {
    analyticsSetProfile(params);
  });
};

export { activateEvents };