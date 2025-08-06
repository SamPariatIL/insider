import { configureAnalytics } from './lib';
import { activateEvents } from './events';
import { appmaker, onEvent } from '@appmaker-xyz/core';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
