import { Platform, PermissionsAndroid } from 'react-native';
import RNInsider from 'react-native-insider';
import InsiderCallbackType from 'react-native-insider/src/InsiderCallbackType';
import RNInsiderIdentifier from 'react-native-insider/src/InsiderIdentifier';
import messaging from '@react-native-firebase/messaging';
import { appmaker } from '@appmaker-xyz/core';

const analyticsSetProfile = (params) => {
  let currentUser = RNInsider.getCurrentUser();
  let identifiers = new RNInsiderIdentifier();

  if (params?.email) identifiers.addEmail(params.email);
  if (params?.phone) identifiers.addPhoneNumber(params.phone);
  if (params?.id) identifiers.addUserID(params.id);

  currentUser.login(identifiers);
  currentUser.build();
};

const recordEvent = async (eventName, params, eventObject) => {
  try {
    const insiderEventData = await appmaker.applyFilters('insiderEventData', {
      eventName,
      params,
      eventObject,
    });

    const insiderEvent = RNInsider.tagEvent(insiderEventData?.eventName);

    Object.entries(insiderEventData?.params || {}).forEach(([key, value]) => {
      if (typeof value === 'string') insiderEvent.addParameterWithString(key, value);
      else if (typeof value === 'boolean') insiderEvent.addParameterWithBoolean(key, value);
      else if (typeof value === 'number') insiderEvent.addParameterWithDouble(key, value);
      else if (value instanceof Date) insiderEvent.addParameterWithDate(key, value);
    });

    insiderEvent.build();
  } catch (error) {
    console.log('[Insider][recordEvent] Error:', error);
  }
};

const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message: 'This app needs notification permission to receive alerts and updates.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('[Insider] Notification permission granted');
    } else {
      console.log('[Insider] Notification permission denied');
    }
  }
};

const registerInsiderFCMToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('[Insider] FCM Token:', fcmToken);
      RNInsider.registerFCMToken(fcmToken);
    } else {
      console.warn('[Insider] FCM token not available');
    }
  } catch (error) {
    console.error('[Insider] Failed to get FCM token', error);
  }
};

const configureAnalytics = async () => {
  await requestNotificationPermission();

  RNInsider.init('mataharitest', 'group.com.useinsider.InsiderDemo', (type, data) => {
    switch (type) {
      case InsiderCallbackType.NOTIFICATION_OPEN:
      case InsiderCallbackType.INAPP_BUTTON_CLICK:
      case InsiderCallbackType.TEMP_STORE_PURCHASE:
      case InsiderCallbackType.TEMP_STORE_ADDED_TO_CART:
      case InsiderCallbackType.TEMP_STORE_CUSTOM_ACTION:
        console.log(`[INSIDER CALLBACK][${type}]`, data);
        break;
    }
  });

  // After init, register the FCM token
  await registerInsiderFCMToken();
};

export { analyticsSetProfile, configureAnalytics, recordEvent };
