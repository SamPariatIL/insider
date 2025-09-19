import { appmaker, onEvent } from '@appmaker-xyz/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import RNInsider from 'react-native-insider';

import { activateEvents } from './events';
import { configureAnalytics } from './lib';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log(
    'Inside Insider Analytics: Message handled in the background ==>' +
      JSON.stringify(remoteMessage),
  );

  if ((remoteMessage.data || {}).source === 'Insider') {
    RNInsider.handleNotification(remoteMessage.data);
  }
});

export function activate({ settings }) {
  onEvent('on_fcm_token', async (fcmToken) => {
    console.log('fcmToken onEvent:', fcmToken);
    AsyncStorage.setItem('fcm_token', fcmToken);
  });

  onEvent('on_fcm_token_change', async (fcmToken) => {
    console.log('on_fcm_token_change event:', fcmToken);
    AsyncStorage.setItem('fcm_token', fcmToken);
  });

  configureAnalytics();
  activateEvents(settings);
}

const InsiderAnalytics = {
  id: 'insider-analytics',
  activate,
};

appmaker.registerPlugin(InsiderAnalytics);
export default InsiderAnalytics;
