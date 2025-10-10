import Report from '../models/Report.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import userModel from '../models/User.js';

// Controller to get all individual pending reports
export const getPendingReports = async (request, response) => {
    try {
        const reports = await Report.find({ status: 'Pending' })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: 1 });
        return response.status(200).json({ success: true, reports });
    } catch (error) {
        return response.status(500).json({ success: false, message: error.message });
    }
};

// Controller to get reports in process by the current admin
export const getInProcessReports = async (request, response) => {
    try {
        const reports = await Report.find({ 
            status: 'In Progress',
            reviewedBy: request.body.userId
        })
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 });
        return response.status(200).json({ success: true, reports });
    } catch (error) {
        return response.status(500).json({ success: false, message: error.message });
    }
};

// Controller to get resolved reports by the current admin
export const getResolvedReports = async (request, response) => {
    try {
        const reports = await Report.find({ 
            status: 'Resolved',
            reviewedBy: request.body.userId
        })
        .populate('reportedBy', 'name email')
        .sort({ resolvedAt: -1 });
        return response.status(200).json({ success: true, reports });
    } catch (error) {
        return response.status(500).json({ success: false, message: error.message });
    }
};

export const claimReport = async (request, response) => {
    const {contentId} = request.params;
    const adminId = request.body.userId;
    try{
        const updateResult = await Report.updateMany(
            {contentId:contentId,status:'Pending'},
            {$set:{status:'In Progress',reviewedBy:adminId}}
        );
        if (updateResult.modifiedCount === 0) {
            return response.status(404).json({ success: false, message: 'No pending reports found for this case.' });
        }
        return response.status(200).json({ success: true, message: `Successfully claimed ${updateResult.nModified} reports.` });
    }catch(error){
        return response.status(500).json({ success: false, message: error.message });
    }
};

// Controller to resolve an individual report
export const resolveReport = async (request, response) => {
    const {contentId} = request.params;
    const {action} = request.body;
    const adminId = request.body.userId;
    try{
        const reportsToResolve = await Report.find({
            contentId:contentId,
            status:'In Progress',
            reviewedBy:adminId
        });
        if (reportsToResolve.length === 0) {
            return response.status(404).json({ success: false, message: 'No reports found for you to resolve for this content.' });
        }
        if(action==='Content Deleted'){
            const contentType = reportsToResolve[0].contentType;
            const model = contentType==='Question' ? Question : Answer;
            if(model===Question){
                const question = await Question.findById(contentId);
                const authorId = question.author;
                await userModel.findByIdAndUpdate(authorId, {$inc: {points: -20}});
                await Answer.deleteMany({question:contentId});
                await Question.findByIdAndDelete(contentId);
            }else if(contentType==='Answer'){
                const answer = await Answer.findById(contentId);
                const authorId = answer.author;
                await userModel.findByIdAndUpdate(authorId, {$inc: {points: -20}});
                await Answer.findByIdAndDelete(contentId);
            }
        }
        await Report.deleteMany({contentId:contentId,status:'In Progress',reviewedBy:adminId});
        return response.status(200).json({ success: true, message: "Report case resolved successfully." });
    }catch(error){
        return response.status(500).json({ success: false, message: error.message });      
    }
};