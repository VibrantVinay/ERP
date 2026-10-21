import { Router } from 'express';
import { loyaltyController } from './controller';

export const loyaltyRouter = Router();

// Coupons & Campaigns
loyaltyRouter.get('/campaigns', (req, res, next) => loyaltyController.getCampaigns(req, res, next));
loyaltyRouter.post('/campaigns', (req, res, next) => loyaltyController.createCampaign(req, res, next));
loyaltyRouter.post('/validate-coupon', (req, res, next) => loyaltyController.validateCoupon(req, res, next));

// Members & Points
loyaltyRouter.get('/members', (req, res, next) => loyaltyController.getMembers(req, res, next));
loyaltyRouter.get('/members/:id', (req, res, next) => loyaltyController.getMemberById(req, res, next));
loyaltyRouter.post('/members/:id/adjust-points', (req, res, next) => loyaltyController.adjustPoints(req, res, next));
