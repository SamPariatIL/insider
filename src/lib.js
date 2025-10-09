import { appmaker } from '@appmaker-xyz/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import RNInsider from 'react-native-insider';
import InsiderCallbackType from 'react-native-insider/src/InsiderCallbackType';
import RNInsiderIdentifier from 'react-native-insider/src/InsiderIdentifier';

// -----------------------------
// 🛠 iOS Crash Patch (Skip SESSION_STARTED on iOS)
try {
  const NotificationHandler = NativeModules.RNNotificationHandler;
  const eventHandler = new NativeEventEmitter(NotificationHandler);

  const originalAddListener = eventHandler.addListener;

  eventHandler.addListener = function (eventType, listener) {
    const unsupportedOnIOS = ['SESSION_STARTED'];

    if (Platform.OS === 'ios' && unsupportedOnIOS.includes(eventType)) {
      console.warn(
        `[Insider Patch] Skipping unsupported iOS event: ${eventType}`,
      );
      return { remove: () => {} }; // noop
    }

    return originalAddListener.call(this, eventType, listener);
  };

  console.log(
    '[Insider Patch] EventEmitter patched to avoid SESSION_STARTED on iOS',
  );
} catch (err) {
  console.warn('[Insider Patch] Failed to patch event emitter:', err);
}
// -----------------------------

const recordEvent = async (eventName, params, eventObject) => {
  try {
    const insiderEventData = await appmaker.applyFilters('insiderEventData', {
      eventName,
      params,
      eventObject,
    });

    const insiderEvent = RNInsider.tagEvent(insiderEventData?.eventName);

    Object.entries(insiderEventData?.params || {}).forEach(([key, value]) => {
      if (typeof value === 'string')
        insiderEvent.addParameterWithString(key, value);
      else if (typeof value === 'boolean')
        insiderEvent.addParameterWithBoolean(key, value);
      else if (typeof value === 'number')
        insiderEvent.addParameterWithDouble(key, value);
      else if (value instanceof Date)
        insiderEvent.addParameterWithDate(key, value);
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
        message:
          'This app needs notification permission to receive alerts and updates.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('[Insider] Notification permission granted');
    } else {
      console.log('[Insider] Notification permission denied');
    }
  }
};

const configureAnalytics = async () => {
  await requestNotificationPermission();
  await messaging().registerDeviceForRemoteMessages();

  const supportedCallbacks = [
    InsiderCallbackType.NOTIFICATION_OPEN,
    InsiderCallbackType.INAPP_BUTTON_CLICK,
    InsiderCallbackType.TEMP_STORE_PURCHASE,
    InsiderCallbackType.TEMP_STORE_ADDED_TO_CART,
    InsiderCallbackType.TEMP_STORE_CUSTOM_ACTION,
    InsiderCallbackType.INAPP_SEEN,
    InsiderCallbackType.FOREGROUND_PUSH,
    InsiderCallbackType.INSIDER_ID_LISTENER,
  ];

  // Only use supported callbacks on iOS
  const filteredCallbacks =
    Platform.OS === 'ios'
      ? supportedCallbacks.filter(
          (type) => type !== InsiderCallbackType.SESSION_STARTED,
        )
      : supportedCallbacks;

  RNInsider.init(
    'mataharistore',
    'group.com.useinsider.InsiderDemo',
    (type, data) => {
      if (!filteredCallbacks.includes(type)) {
        console.warn(`[Insider] Skipped unsupported callback type: ${type}`);
        return;
      }

      console.log(`[INSIDER CALLBACK][${type}]`, data);
    },
  );

  // Handle foreground push
  if (RNInsider.setForegroundPushCallback) {
    RNInsider.setForegroundPushCallback((userInfo) => {
      console.log('[Insider] Foreground push received:', userInfo);
      RNInsider.handleNotification(userInfo);
    });
  }

  try {
    const fcmToken = await AsyncStorage.getItem('fcm_token');

    if (Platform.OS === 'android') {
      RNInsider.setHybridPushToken(fcmToken);
      console.log('[Insider] setHybridPushToken used.');
    } else {
      console.warn('[Insider] iOS push token setup skipped');
    }

    await messaging().subscribeToTopic('general');
    console.log('[Insider] Subscribed to general topic');
  } catch (error) {
    console.error('[Insider] Failed to get/register FCM token:', error);
  }
};

export { configureAnalytics, recordEvent };
