import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    }, 
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["Student", "Admin"],
        default: "Student"
    },
    points: {
        type: Number,
        default: 0
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    reputation: {
        score: {
            type: Number,
            default: 10 // Base reputation for new users
        },
        questionCount: {
            type: Number,
            default: 0
        },
        answerCount: {
            type: Number,
            default: 0
        },
        validReportCount: {
            type: Number,
            default: 0
        },
        voteWeight: {
            type: Number,
            default: 1,
            min: 1,
            max: 5 // Maximum vote weight multiplier
        }
    }
}, {
    timestamps: true
});


const userModel = mongoose.models.user || mongoose.model('User',userSchema);

export default userModel; 