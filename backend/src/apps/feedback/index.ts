import { PluggableApp } from '../../core/base-app';
import { feedbackRouter } from './routes';
import { feedbackService } from './service';

export const feedbackApp: PluggableApp = {
  id: 'feedback',
  name: 'Guest Ratings & Feedback Care',
  routePrefix: '/feedback',
  router: feedbackRouter,
  async init() {
    await feedbackService.initDatabaseSchema();
  },
};
