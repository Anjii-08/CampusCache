import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    voter: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    answerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"Answer"
    },
    usefulnessScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        validate: {
            validator: function(v) {
                return v >= 0 && v <= 1;
            },
            message: 'Usefulness score must be between 0 and 1'
        }
    }
}, {
    timestamps: true // Add timestamps to track voting history
});

export default mongoose.model("Vote", voteSchema);