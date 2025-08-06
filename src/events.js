import { analytics, appmaker } from '@appmaker-xyz/core';
import { analyticsSetProfile, recordEvent } from './lib';
import RNInsider from 'react-native-insider';
import RNInsiderIdentifier from 'react-native-insider/src/InsiderIdentifier';
import {
  mapLineItemToInsiderProduct,
  mapShopifyProductToInsider,
  trackPurchaseWithInsider,
} from './helpers';
import { Platform } from 'react-native';

const activateEvents = () => {
  appmaker.addFilter(
    'inapp-page-data-response',
    `namespace`, // namespace
    (data, { pageId }) => {
      // console.log('pageId from [insider]', pageId);

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

  const sendUserLogin = (params) => {
    const currentUser = RNInsider.getCurrentUser();
    const identifiers = new RNInsiderIdentifier();

    if (params?.email) identifiers.addEmail(params.email);
    if (params?.phone) identifiers.addPhoneNumber(params.phone);
    if (params?.id) identifiers.addUserID(params.id);

    currentUser.login(identifiers);
    currentUser?.build?.();
  };

  const sendUserLogout = () => {
    RNInsider.getCurrentUser().logout();
  };

  analytics.onTrack((event, params, context) => {
    //     if (process.env.NODE_ENV === 'development') {
    //       console.log(
    //         `
    // ================================================================================================================
    // event:       ${event}`,
    //       );
    //       console.log(
    //         `- - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //     params
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - `,
    //         `
    //       ${JSON.stringify(params)}
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - `,
    //       );
    //       console.log(
    //         `- - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //     CONTEXT
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - `,
    //         `
    //       ${JSON.stringify(context)}
    // ================================================================================================================`,
    //       );
    //     }

    switch (event) {
      case 'appmaker_block_click':
        break;
      case 'product_added_to_cart':
        let productAdded = mapShopifyProductToInsider(context?.product);
        RNInsider.itemAddedToCart(productAdded);
        break;
      case 'update_cart':
        let productAddedFromCart = mapShopifyProductToInsider(context?.product);
        RNInsider.itemAddedToCart(productAddedFromCart);
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

        RNInsider.tagEvent('pcp_view')
          .addParameterWithString('pcp_title', params?.title ?? 'NA')
          .addParameterWithString('category_id', params?.collectionId ?? 'NA')
          .addParameterWithString('src', context?.pageId?.pageId ?? 'NA')
          .build();

        RNInsider.tagEvent('categories_view')
          .addParameterWithString('src', Platform.OS)
          .build();

        break;

      case 'user_login':
        sendUserLogin(params);
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

        RNInsider.tagEvent('pdp_view')
          .addParameterWithString(
            'category',
            context?.product?.productType ?? 'NA',
          )
          .addParameterWithString('product_title', context?.product?.title)
          .addParameterWithString('pcp_type', context?.product?.productType)
          .addParameterWithString('pcp_title', context?.product?.title)
          .addParameterWithString('product_id', context?.product?.id)
          .addParameterWithDouble(
            'price',
            parseFloat(
              context?.product?.priceRange?.maxVariantPrice?.amount ?? '0',
            ),
          )
          .addParameterWithString('src', context?.pageId?.pageId ?? 'NA')
          .addParameterWithString(
            'sku',
            context?.variant?.sku ??
              context?.product?.variants?.edges?.[0]?.node?.sku ??
              'NA',
          )
          .addParameterWithString('product_id', context?.product?.id)
          .build();

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
