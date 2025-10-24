import Vote from "../models/Votes.js";
import Answer from "../models/Answer.js";
import User from "../models/User.js";

// Helper function to calculate reputation changes
const calculateReputationChange = (action, value = 1) => {
    const changes = {
        'question_post': 5,
        'answer_post': 10,
        'answer_vote_received': value * 2,
        'valid_report': -5
    };
    return changes[action] || 0;
};

// Helper function to update user reputation
const updateUserReputation = async (userId, action, value = 1) => {
    const change = calculateReputationChange(action, value);
    
    const user = await User.findById(userId);
    if (!user) return null;

    // Update reputation score
    user.reputation.score += change;

    // Update activity counts
    switch(action) {
        case 'question_post':
            user.reputation.questionCount += 1;
            break;
        case 'answer_post':
            user.reputation.answerCount += 1;
            break;
        case 'valid_report':
            user.reputation.validReportCount += 1;
            break;
    }

    // Calculate vote weight based on reputation and activity
    const activityScore = (user.reputation.questionCount * 0.3) + 
                         (user.reputation.answerCount * 0.5) - 
                         (user.reputation.validReportCount * 1.0);
    
    user.reputation.voteWeight = Math.min(
        Math.max(
            1, // Minimum weight
            1 + (user.reputation.score / 100) + (activityScore / 50)
        ),
        5 // Maximum weight
    );

    await user.save();
    return user;
};

//add new vote
export const addVote = async (req,res)=>{
    const { userId, answerId, usefulnessScore } = req.body;

    if (!userId || !answerId || typeof usefulnessScore !== 'number' || usefulnessScore < 0 || usefulnessScore > 1) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields. Usefulness score must be between 0 and 1"
        });
    }

    try {
        // Get voter's reputation weight
        const voter = await User.findById(userId);
        if (!voter) {
            return res.status(404).json({
                success: false,
                message: "Voter not found"
            });
        }

        const voteWeight = voter.reputation.voteWeight;
        const weightedScore = usefulnessScore * voteWeight;

        // Check for existing vote
        const existingVote = await Vote.findOne({ voter: userId, answerId });
        
        if (existingVote) {
            // Calculate score difference
            const oldWeightedScore = existingVote.usefulnessScore * voteWeight;
            const scoreDifference = weightedScore - oldWeightedScore;

            // Update vote
            existingVote.usefulnessScore = usefulnessScore;
            await existingVote.save();

            // Update answer score
            const updatedAnswer = await Answer.findByIdAndUpdate(
                answerId,
                { $inc: { score: scoreDifference } },
                { new: true }
            ).populate('author');

            // Update answer author's reputation
            if (updatedAnswer && updatedAnswer.author) {
                await updateUserReputation(
                    updatedAnswer.author._id,
                    'answer_vote_received',
                    scoreDifference
                );
            }

            return res.status(200).json({
                success: true,
                message: "Vote updated successfully",
                answer: updatedAnswer,
                voteWeight
            });
        }

        // Create new vote
        const newVote = new Vote({
            voter: userId,
            answerId,
            usefulnessScore
        });

        await newVote.save();

        // Update answer score
        const updatedAnswer = await Answer.findByIdAndUpdate(
            answerId,
            { $inc: { score: weightedScore } },
            { new: true }
        ).populate('author');

        return res.status(200).json({
            success: true,
            message: "Vote added successfully",
            answer: updatedAnswer,
            voteStatus: voteType
        });
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//remove vote
export const removeVote= async (req,res)=>{

    const userId=req.body.userId

    const {answerId}=req.body

    if(!answerId||!userId){
        return res.status(406).json({
            success:false,
            message:"not provided required fields"
        })
    }
    try{
        const userVote= await Vote.find({voter:userId,answerId})
        
        if(userVote){
           const deletedVote = await Vote.findOneAndDelete({voter:userId,answerId});

           const updatedAnswerVoteCount=await Answer.findByIdAndUpdate(answerId,
               {$inc:{score:-1}},
               {new:true}
            );

            return res.status(200).json({
                success:true,
                message:"vote deleted",
                deletedVote,
                updatedAnswerVoteCount
            })
        }

        return res.status(402).json({
            success:false,
            message:"Vote doesnt exist to delete"
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

//update vote
export const updateVote =async (req,res)=>{

    const userId=req.body.userId;

    const {answerId,voteDirection}=req.body;

    if(!answerId||!userId||!voteDirection){
        return res.status(406).json({
            success:false,
            message:"not provided required fields"
        })
    }
    try{
        const userVote= await Vote.find({voter:userId,answerId})
        
        if(userVote){
            if(voteDirection===userVote.voteType){
                return res.status(400).json({
                    success:false,
                    message:"vote cannot be updated,vote is already in the given direcion",
                })
            }else{
                const updateVote=await Vote.findOneAndUpdate({voter:userId,answerId},
                    {$set:{voteType:voteDirection}},
                    {new:true})

                const updatedAnswerVoteCount=await Answer.findByIdAndUpdate(answerId,
                    {$inc:{score:2*voteDirection}},
                    {new:true}
                )
                
                return res.status(200).json({
                    success:true,
                    message:"Vote modified",
                    updateVote,
                    updatedAnswerVoteCount
                })
            }
            
        }
        return res.status(400).json({
            success:true,
            message:"vote doesnt exist to update"
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}