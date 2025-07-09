import { shopifyIdHelper } from '@appmaker-xyz/shopify';
import { analytics } from '@appmaker-xyz/core';
import { analyticsSetProfile, recordEvent } from './lib';
import RNInsider from 'react-native-insider';
import RNInsiderIdentifier from 'react-native-insider/src/InsiderIdentifier';
import {
  mapLineItemToInsiderProduct,
  mapShopifyProductToInsider,
} from './helpers';

const activateEvents = () => {
  appmaker.addFilter(
    'inapp-page-data-response',
    `namespace`, // namespace
    (data, { pageId }) => {
      console.log('pageId from [insider]', pageId);
      console.log('data:', JSON.stringify(data));

      switch (pageId) {
        case 'home':
          RNInsider.visitHomePage();
          break;

        case 'productList':
          const details = Object.values(params);
          RNInsider.visitListingPage(details);
          break;
      }
      return data;
    },
  );

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
    console.log(
      `
================================================================================================================
EVENT:       ${event}`,
    );
    console.log(
      `- - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    eventParams  
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

    switch (event) {
      case 'product_added_to_cart':
        let productAdded = mapShopifyProductToInsider(context?.product);
        RNInsider.itemAddedToCart(productAdded);
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

      case 'user_login':
        sendUserLogin(params);
        break;

      case 'user_logout':
        sendUserLogout();
        break;

      case 'remove_from_cart':
        let removedProduct = mapShopifyProductToInsider(context?.product);
        RNInsider.itemAddedToCart(removedProduct);
        break;

      case 'product_viewed':
        const formattedObject = mapShopifyProductToInsider(context?.product);
        console.log('productDetail finalData:', formattedObject);

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

      case 'user_login':
        console.log('user_login');
        break;

      case 'user_logout':
        console.log('user_logout');
        break;

      case 'user_register':
        RNInsider.signUpConfirmation();
        break;

      case 'checkout_started':
        console.log('checkout_started');
        break;

      case 'checkout_completed':
        console.log('checkout_completed');
        break;

      case 'view_item_list':
        console.log('view_item_list');
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
        console.log('product_search');
        break;

      case 'product_added_to_wishlist':
        let productAddedToWishlist = mapShopifyProductToInsider(
          context?.product,
        );

        console.log('product_added_to_wishlist');
        break;

      case 'product_removed_from_wishlist':
        console.log('product_removed_from_wishlist');
        break;

      case 'shareProduct':
        console.log('shareProduct');
        break;

      case 'sortApply':
        console.log('sortApply');
        break;

      case 'ApplyFilter':
        console.log('ApplyFilter');
        break;

      case 'drawerCategoryClick':
        console.log('drawerCategoryClick');
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
