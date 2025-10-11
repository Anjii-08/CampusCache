import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import {
    getPendingReports,
    getInProcessReports,
    getResolvedReports,
    claimReport,
    resolveReport
} from '../controllers/adminController.js';

const adminRouter = express.Router(); 

adminRouter.get('/reports/pending', adminAuth, getPendingReports);
adminRouter.get('/reports/in-process', adminAuth, getInProcessReports);
adminRouter.get('/reports/resolved', adminAuth, getResolvedReports);

adminRouter.put('/reports/claim/:contentId', adminAuth, claimReport);
adminRouter.post('/reports/resolve/:contentId', adminAuth, resolveReport);

export default adminRouter;