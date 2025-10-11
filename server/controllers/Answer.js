import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import User from "../models/User.js";
import Vote from "../models/Votes.js";


//post answer
export const postAnswer = async(req,res)=>{
    const {
        userId,
        content,
        questionId,
        isAnonymous=false,
    }=req.body;

    if(!userId||!content||!questionId){
        return res.status(400).json({
            success:false,
            message:"provide requried fields"
        })
    }

    try{
        const questionDetails = await Question.findById(questionId);
        if(!questionDetails){
            return res.status(400).json({
                success:false,
                message:"Question doesn't exists"
            })
        }

        const newAnswer = new Answer({
            content,
            question:questionId,
            author:userId,
            isAnonymous
        })

        newAnswer.save();
        const updatedUserPoints = await User.findByIdAndUpdate(userId,
            {$inc:{points:5}},
            {new:true}
        );
        return res.status(200).json({
            success:true,
            message:"Successfully added new answer",
            newAnswer,
            questionDetails,
            updatedUserPoints
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//fetch answers
export const fetchAnswers = async(req,res)=>{
    const {questionId} =req.body;
    if(!questionId){
         return res.status(400).json({
            success:false,
            message:"provide requried fields"
        })
    }

    try{
        const allAnswers = await Answer.find({question:questionId}).sort({score: -1});
        return res.status(200).json({
            success:true,
            message:"Successfully fetched all answers",
            allAnswers
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//fetch user answers
export const fetchUserAnswers = async (req,res)=>{
    const {userId}=req.body;

    if(!userId){
         return res.status(400).json({
            success:false,
            message:"provide requried fields"
        })
    }

    try{
        const allAnswers = await Answer.find({author:userId}).sort({score:-1});
        return res.status(200).json({
            success:true,
            message:"Successfully fetched user answers",
            allAnswers
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//delete question
export const deleteAnswer =async (req,res)=>{
    const {userId,answerId}=req.body;
    if(!userId||!answerId){
        return res.status(400).json({
            success:false,
            message:"provide requried fields"
        })
    }

    try{
        const answerDetails = await Answer.findById(answerId);
        if(answerDetails.author!=userId){
            return res.status(400).json({
                success:false,
                message:"only the author can delete the answer"
             })
        }

        await Vote.deleteMany({answerId});
        await Answer.findByIdAndDelete(answerId);

        const updatedUserPoints = await User.findByIdAndUpdate(userId,
            {$inc:{points:-5}},
            {new:true}
        );
        
        return res.status(200).json({
            success:true,
            message:"Successfully fetched user answers",
            answerDetails,
            updatedUserPoints
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

