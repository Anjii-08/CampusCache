// routes/reportRoutes.js
import express from 'express';
import userAuth from '../middlewares/userAuth.js';
import { createReport } from '../controllers/reportController.js';

const reportRouter = express.Router();

reportRouter.post('/', userAuth, createReport);

export default reportRouter;