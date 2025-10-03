import { addFilter, analytics, appmaker } from '@appmaker-xyz/core';
import { shopifyIdHelper } from '@appmaker-xyz/shopify';
import { Platform } from 'react-native';
import RNInsider from 'react-native-insider';
import RNInsiderIdentifier from 'react-native-insider/src/InsiderIdentifier';

import { InsiderAnalyticsInAppNotificationComponent } from './components';
import {
  mapLineItemToInsiderProduct,
  mapShopifyProductToInsider,
  trackPurchaseWithInsider,
} from './helpers';

const activateEvents = () => {
  appmaker.addFilter(
    'inapp-page-data-response',
    'namespace',
    (data, { pageId }) => {
      switch (pageId) {
        case 'home':
          RNInsider.visitHomePage();
          break;
        case 'categories':
          RNInsider.tagEvent('categories_view')
            .addParameterWithString('src', Platform.OS)
            .build();
          break;
        case 'brands':
          RNInsider.tagEvent('brands_view')
            .addParameterWithString('src', Platform.OS)
            .build();
          break;
      }
      return data;
    },
  );

  /**
   * Send user login event to Insider
   * @param {Record<string, any>} params
   * @param {Record<string, any>} context
   */
  const sendUserLogin = (params, context) => {
    try {
      let identifiers = new RNInsiderIdentifier();

      if (params.email) {
        identifiers.addEmail(params.email);
      }

      if (params.phone) {
        identifiers.addPhoneNumber(params.phone);
      }

      if (params.id) {
        identifiers.addUserID(shopifyIdHelper(params.id, true));
      }

      let currentUser = RNInsider.getCurrentUser();
      currentUser.login(identifiers);

      if (context.customer?.firstName) {
        currentUser.setName(context.customer.firstName);
      }

      if (context.customer?.lastName) {
        currentUser.setSurname(context.customer.lastName);
      }
    } catch (error) {
      console.log('[Insider][sendUserLogin] Error:', error);
    }
  };

  /**
   * Send user logout event to Insider
   */
  const sendUserLogout = () => {
    try {
      RNInsider.getCurrentUser().logout();
    } catch (error) {
      console.log('[Insider][sendUserLogout] Error:', error);
    }
  };

  /**
   * Track event from analytics
   * @param {string} event
   * @param {Record<string, any>} params
   * @param {Record<string, any>} context
   */
  analytics.onTrack((event, params, context) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `
    ================================================================================================================
    EVENT:       ${event}`,
      );
      console.log(
        `- - - - - - - - - - - - - - - - - - - - - - - - - - - -
        PARAMS
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - `,
        `
          ${JSON.stringify(params)}
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - `,
      );
      console.log(
        `- - - - - - - - - - - - - - - - - - - - - - - - - - - -
        CONTEXT
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - `,
        `
          ${JSON.stringify(context)}
    ================================================================================================================`,
      );
    }

    switch (event) {
      case 'appmaker_block_click':
        break;

      case 'product_added_to_cart':
        let productAdded = mapShopifyProductToInsider(context?.product);
        RNInsider.itemAddedToCart(productAdded);
        break;

      case 'product_removed_from_cart':
        let productRemoved = mapShopifyProductToInsider(context?.product);
        RNInsider.itemRemovedFromCart(productRemoved);
        break;

      case 'collection_view':
        let taxanomy = [
          params?.item_list_handle,
          params?.item_list_id,
          params?.item_list_name,
          params?.title,
          params?.collectionId,
        ].filter(Boolean);
        RNInsider.visitListingPage(taxanomy);
        break;

      case 'user_logout':
        sendUserLogout();
        break;

      case 'remove_from_cart':
        RNInsider.itemRemovedFromCart(context?.product?.id ?? 'NA');
        break;

      case 'product_viewed':
        if (!context?.product) break;

        const formattedObject = mapShopifyProductToInsider(context?.product);
        RNInsider.visitProductDetailPage(formattedObject);
        break;

      case 'cart_updated':
        let edges = context?.cart?.lineItems?.edges;
        let noLineItems = !edges || edges?.length === 0;
        if (noLineItems) {
          RNInsider.cartCleared();
        }
        break;

      case 'checkout_started':
        break;

      case 'user_logout':
        break;

      case 'user_register':
        RNInsider.signUpConfirmation();
        break;

      case 'checkout_started':
        break;

      case 'checkout_completed':
        const firstLineItem = context?.cart?.lineItems?.edges?.[0]?.node;

        const checkoutProduct = mapLineItemToInsiderProduct(firstLineItem);

        RNInsider.itemPurchased(
          context?.eventParams?.id ??
            context?.eventParams?.order_number ??
            context?.eventParams?.order_name,
          checkoutProduct,
        );

        trackPurchaseWithInsider(context);
        break;

      case 'view_item_list':
        break;

      case 'view_cart':
        const lineItems = context?.lineItems?.edges;
        const insiderProducts = lineItems?.map((item) => {
          const convertedProduct = mapLineItemToInsiderProduct(item?.node);

          return convertedProduct;
        });

        RNInsider.visitCartPage(insiderProducts);
        break;

      case 'product_search':
        RNInsider.tagEvent('search')
          .addParameterWithString('keyword', params?.query)
          .addParameterWithString('src', Platform.OS)
          .build();
        break;

      case 'product_added_to_wishlist':
        let { product, variant } = context || {};

        RNInsider.tagEvent('wishlist')
          .addParameterWithString(
            'image_url',
            variant?.node?.image?.url ?? 'NA',
          )
          .addParameterWithString('sku_parent', variant?.node?.sku ?? 'NA')
          .addParameterWithString('product_title', product?.title ?? 'NA')
          .addParameterWithString('src', Platform.OS)
          .addParameterWithString('product', product?.id ?? 'NA')
          .build();

        break;

      case 'product_removed_from_wishlist':
        break;

      case 'shareProduct':
        break;

      case 'sortApply':
        break;

      case 'ApplyFilter':
        break;

      case 'drawerCategoryClick':
        break;

      default:
        break;
    }
  }, 'insider-analytics');

  /**
   * Send user identify event
   * @param {Record<string, any>} params
   * @param {Record<string, any>} context
   */
  analytics.onIdentify((_, params, context) => {
    sendUserLogin(params, context);
  });
};

addFilter(
  'app-custom-root-components',
  'insider-analytics-inapp-notification',
  (currentComponents) => {
    currentComponents?.push(InsiderAnalyticsInAppNotificationComponent);
    return currentComponents;
  },
);

export { activateEvents };
