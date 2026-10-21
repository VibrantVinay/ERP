import { PluggableApp } from '../../core/base-app';
import { reservationRouter } from './routes';
import { reservationService } from './service';

export const reservationsApp: PluggableApp = {
  id: 'reservations',
  name: 'Reservations & Guest Bookings',
  routePrefix: '/reservations',
  router: reservationRouter,
  async init() {
    await reservationService.initDatabaseSchema();
  },
};

