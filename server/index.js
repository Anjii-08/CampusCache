/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";

import authRouter from './routes/authRoutes.js';
import leaderboardRouter from "./routes/leaderboardRoutes.js";
import voteRouter from "./routes/voteRoutes.js";
import adminRouter from './routes/adminRoutes.js';
import questionRouter from "./routes/questionRoutes.js";
import reportRouter from './routes/reportRoutes.js';
import userRouter from './routes/userRoutes.js';
import answerRouter from "./routes/answerRoutes.js";
import contentFetchRouter from "./routes/contentFetchRoutes.js";


const app = express();
const port = process.env.PORT || 4000;
connectDB(); 

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: "http://localhost:5173",credentials:true,}));

//API endpoints
app.get('/',(request,response)=>{response.send("API WORKING")});

app.use('/api/auth', authRouter);
app.use('/api/points', leaderboardRouter);
app.use('/api/vote', voteRouter);
app.use('/api/admin', adminRouter);
app.use('/api/question', questionRouter);
app.use('/api/report', reportRouter);
app.use('/api/user', userRouter);
app.use('/api/answer', answerRouter);
app.use('/api/fetch', contentFetchRouter);

app.listen(port,()=>console.log(`Server running on PORT : ${port}`));
