import express from "express";

import userAuth from "../middlewares/userAuth.js";
import {postAnswer,fetchAnswers,fetchUserAnswers,deleteAnswer} from "../controllers/Answer.js";
const answerRouter =express.Router();


answerRouter.post("/add-answer",userAuth,postAnswer);
answerRouter.get("/get-answer",userAuth,fetchAnswers);
answerRouter.get("/user-answer",userAuth,fetchUserAnswers);
answerRouter.delete("/delete-answer",userAuth,deleteAnswer);


export default answerRouter;