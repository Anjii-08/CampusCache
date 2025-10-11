import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import User from "../models/User.js";
import Vote from "../models/Votes.js";

//post question
export const addQuestion = async (req,res)=>{
    const {
        userId,
        title,
        content,
        tags=[],
        isAnonymous=false,
    }=req.body;

    if(!userId||!title||!content){
        return res.status(400).json({
            success:false,
            message:"provide required fields",
        });
    }
    //checking if user exitsts??
    try{
        const userDetails= await User.findById(userId);
        if(!userDetails){
            return res.status(400).json({
                success:false,
                message:"User doesnt exists"
            })
        }
        const newQuestion = new Question({
            title,
            content,
            tags,
            author:userId,
            isAnonymous
        });
    
        const saveQuestion=await newQuestion.save();

        const updatedPoints = await User.findByIdAndUpdate(userId,
            { $inc:{points:5}},
            {new:true}
        );
        
        return res.status(200).json({
            success: true,
            message: "Successfully added new question",
            question: saveQuestion,
            updatedPoints
        });

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }

}

//Search questions
export const searchQuestions = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        // Prepare search terms
        const searchTerms = query.trim().split(/\s+/);
        
        // Create a combined search query

        // Find questions with both text and regex search
        const questions = await Question.find(
                        { $text: { $search: query } },
                        { score: { $meta: "textScore" } }
                        )
                        .populate('author', 'username email points -_id')
                        .select('title content tags updatedAt isAnonymous')
                        .sort({ score: { $meta: "textScore" } })
                        .limit(20);


        return res.status(200).json({
            success: true,
            message: "Search results retrieved successfully",
            count: questions.length,
            questions
        });

    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({
            success: false,
            message: "Error searching questions",
            error: error.message
        });
    }
};

//fetchAllquestions
export const fetchAllQuestions = async(req,res)=>{
    try{
        const allQuestions = await Question.find()
            .populate({
                path: 'author',
                select: 'name email',
                transform: doc => {
                    // If question is anonymous, only return "Anonymous" as name
                    if (doc && doc._doc.isAnonymous) {
                        return { name: 'Anonymous' };
                    }
                    return doc;
                }
            });

        // Transform the response to handle anonymous posts
        const formattedQuestions = allQuestions.map(question => {
            if (question.isAnonymous) {
                // If anonymous, don't expose author details
                return {
                    ...question._doc,
                    author: { name: 'Anonymous' }
                };
            }
            return question;
        });

        return res.status(200).json({
            success: true,
            message: "successfully fetched all questions",
            allQuestions: formattedQuestions
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//fetch user questions
export const fetchUserQuestions=async(req,res)=>{
    const userId=req.body.userId;

    if(!userId){
        return res.status(400).json({
            success:false,
            message:"provide required fields",
        });
    }
    try{
        const userQuestions = await Question.find({author:userId});

        return res.status(200).json({
            success:true,
            message:"Successfully fetched questions",
            userQuestions
        });
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        });
    }


}

//delete question
export const deleteQuestion =async(req,res)=>{
    const { userId,questionId,}=req.body;
    if(!userId||!questionId){
        return res.status(400).json({
            success:false,
            message:"required fields missing"
        });
    }

    try{
        const questionDetails = await Question.findById(questionId);
        console.log(questionDetails.author,userId)
        if(userId!=questionDetails.author){
            return res.status(400).json({
                success:false,
                message:"Only the author can delete the question"
            })
        }

        const allAnswers= await Answer.find({question:questionId});
        const answerIds = allAnswers.map(answer=>answer._id);
        await Vote.deleteMany({
            answerId:{$in:answerIds}
        });
        await Answer.deleteMany({
            _id:{$in:answerIds}
        });
        await Question.findByIdAndDelete(questionId);

         const updatedPoints = await User.findByIdAndUpdate(userId,
            { $inc:{points:-5}},
            {new:true}
        );

        return res.status(200).json({
            success:true,
            message:"Successfully deleted the question",
            questionDetails,
            updatedPoints
        });
        

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

