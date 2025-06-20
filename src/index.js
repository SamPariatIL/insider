import { configureAnalytics } from './lib';
import { activateEvents } from './events';
import { appmaker } from '@appmaker-xyz/core';

export function activate({ settings }) {
  configureAnalytics();
  activateEvents(settings);
}

const InsiderAnalytics = {
  id: 'insider-analytics',
  activate,
};

appmaker.registerPlugin(InsiderAnalytics);
export default InsiderAnalytics;