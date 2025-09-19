import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import RNInsider from 'react-native-insider';

export const InsiderAnalyticsInAppNotificationComponent = () => {
  useEffect(() => {
    console.log(
      'Inside Insider Analytics: InAppNotificationComponent mounted ==>',
    );

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log(
        'Inside Insider Analytics: Message handled in the foreground ==>' +
          JSON.stringify(remoteMessage),
      );

      if ((remoteMessage.data || {}).source === 'Insider') {
        RNInsider.handleNotification(remoteMessage.data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
};
