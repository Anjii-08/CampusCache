import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/User.js';
import { generateOTP, storeOTP, verifyOTP, isEmailVerified, clearOTPData } from '../utils/localOTP.js';


export const register = async (request,response)=>{
    const {name,email,password} = request.body;
    if(!name || !email || !password){
        return response.status(400).json({success:false,message:"Missing Details"});
    }
    // email should ends with @student.nitw.ac.in
    if(!email.endsWith('@student.nitw.ac.in')){
        return response.status(400).json({success:false,message:"Use Institute Email only !"});
    }
    // check whether password follows the criteria of at least 8 characters
    if(password.length < 8){
        return response.status(400).json({success:false,message:"Password must be at least 8 characters long."});
    }
    try{
        const existingUser = await userModel.findOne({email});
        if(existingUser && existingUser.isAccountVerified){
            return response.status(400).json({success:false,message:"User already exists"});
        }

        // If user exists but is not verified, delete them to start fresh
        if (existingUser && !existingUser.isAccountVerified) {
            await userModel.findByIdAndDelete(existingUser._id);
        }
        
        const hashedPassword = await bcrypt.hash(password,10);
        
        // Generate and store OTP locally
        const otp = generateOTP();
        storeOTP(email, otp);
        
        const user = new userModel({
            name,
            email,
            password: hashedPassword,
            isAccountVerified: false
        });

        await user.save();
        return response.status(200).json({success:true,message:"Registration successful! Please check your email to verify your account."});

    }catch(error){
        response.status(500).json({success:false,message:error.message});
    }
};

export const verifyRegistration = async (request, response) => {
    const { email, otp } = request.body;
    if (!email || !otp) {
        return response.status(400).json({ success: false, message: "Missing email or OTP" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return response.status(404).json({ success: false, message: "User not found. Please register first." });
        }

        if (user.isAccountVerified) {
            return response.status(400).json({ success: false, message: "Account already verified." });
        }

        const verificationResult = verifyOTP(email, otp);
        if (!verificationResult.valid) {
            return response.status(400).json({ success: false, message: verificationResult.message });
        }

        user.isAccountVerified = true;
        await user.save();
        clearOTPData(email);

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'1d'});

        response.cookie('token',token,{
            httpOnly : true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge : 24*60*60*1000
        });
        
        return response.status(200).json({ success: true, message: "Account verified and logged in successfully!" });

    } catch (error) {
        return response.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (request,response)=>{
    const {email,password} = request.body;
    if(!email || !password){
        return response.status(400).json({success:false,message:"Email and password are required!"});
    }
    try{
        const user = await userModel.findOne({email});
        if(!user){
            return response.status(404).json({success:false,message:"Invalid Email!"});
        }
            
        // if(!email.endsWith('@student.nitw.ac.in') && user.role==='Student'){
        //     return response.status(400).json({success:false,message:"Use Institute Email only !"});
        // }

        if (!user.isAccountVerified) {
            return response.status(403).json({ success: false, message: "Account not verified. Please check your email." });
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return response.status(400).json({success:false,message:"Invalid Credentials!"});
        }

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'1d'});

        response.cookie('token',token,{
            httpOnly : true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge : 24*60*60*1000
        });

        return response.status(200).json({success:true,message:"Logged In"});

    }catch(error){
        return response.status(500).json({success:false,message:error.message});
    }
};

export const logout = async (request,response)=>{
    try{
        response.clearCookie('token',{
            httpOnly : true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });
        return response.status(200).json({success:true,message:"Logged Out !"});
    }catch(error){
        return response.status(500).json({success:false,message:error.message});       
    }
};

export const isAuthenticated = async (request,response)=>{
    try{
        return response.status(200).json({success:true});
    }catch(error){
        return response.status(500).json({success:false,message:error.message});
    }
} 

export const sendResetOtp = async (request,response)=>{
    const {email} = request.body;
    if(!email){
        return response.status(400).json({success:false,message:"Email is required!"});
    }
    try{
        const user = await userModel.findOne({email});
        if(!user){
            return response.status(404).json({success:false,message:"User not found!"});
        }
        
        // Generate and store OTP locally for password reset
        const otp = generateOTP();
        storeOTP(email, otp);
        return response.status(200).json({success:true,message:"Password reset OTP sent successfully"});

    }catch(error){
        return response.status(500).json({success:false,message:error.message});
    }
};

export const resetPassword = async (request,response)=>{
    const {email,otp,newPassword} = request.body;
    if(!email || !otp || !newPassword){
        return response.status(400).json({success:false,message:"Missing required details!"});      
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return response.status(404).json({success:false,message:"User not found"});
        }

        const verificationResult = verifyOTP(email, otp);
        if (!verificationResult.valid) {
            return response.status(400).json({ success: false, message: verificationResult.message });
        }

        const hashedPassword = await bcrypt.hash(newPassword,10);
        user.password = hashedPassword;
        clearOTPData(email);

        await user.save();
        return response.status(200).json({success:true,message:"Password reset Successfull"});

    }catch(error){
        return response.status(500).json({success:false,message:error.message});
    }
}