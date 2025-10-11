import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import {getQuestionContent,getAnswerContent} from "../controllers/ContentFetch.js";

const contentFetchRouter = express.Router();    

contentFetchRouter.get("/questions/:contentId",adminAuth,getQuestionContent);
contentFetchRouter.get("/answers/:contentId",adminAuth,getAnswerContent);

export default contentFetchRouter;