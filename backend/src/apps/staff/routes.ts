import { Router } from 'express';
import { staffController } from './controller';

export const staffRouter = Router();

// Shifts & Attendance routes
staffRouter.get('/shifts', (req, res, next) => staffController.getShifts(req, res, next));
staffRouter.post('/shifts', (req, res, next) => staffController.createShift(req, res, next));
staffRouter.get('/attendance', (req, res, next) => staffController.getAttendance(req, res, next));
staffRouter.post('/attendance/clock', (req, res, next) => staffController.clockPunch(req, res, next));
staffRouter.get('/payroll-summary', (req, res, next) => staffController.getPayrollSummary(req, res, next));

// Staff directory routes
staffRouter.get('/', (req, res, next) => staffController.getStaff(req, res, next));
staffRouter.post('/', (req, res, next) => staffController.createStaff(req, res, next));
