import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    contentType: {
        type: String,
        required: true,
        enum: ["Question", "Answer"]
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    reasons: [{
        type: [String],
        required: true,
        enum: ['Spam', 'Hate Speech', 'Explicit Content', 'Misinformation', 'Harassment']
    }],
    status: {
        type: String,
        enum: ["Pending", "In Progress"],
        default: "Pending"
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
});

export default mongoose.model("Report", reportSchema);