import Question from '../models/Question.js';
import Answer from '../models/Answer.js';

export const getQuestionContent = async (request, response) => {
    const { contentId } = request.params;
    try {
        const question = await Question.findById(contentId);
        if (!question) {
            return response.status(404).json({ 
                success: false, 
                message: 'Question not found' 
            });
        }
        
        return response.status(200).json({ 
            success: true, 
            content: question.content
        });

    } catch (error) {
        return response.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }   
}

export const getAnswerContent = async (request, response) => {
    const { contentId } = request.params;
    try {
        const answer = await Answer.findById(contentId);
        if (!answer) {
            return response.status(404).json({ 
                success: false, 
                message: 'Answer not found' 
            });
        }
        
        return response.status(200).json({ 
           success: true, 
            content: answer.content
        });
    } catch (error) {
        return response.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }   
}