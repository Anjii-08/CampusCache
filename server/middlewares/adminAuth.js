/* eslint-disable no-undef */
import userModel from '../models/User.js';
import jwt from 'jsonwebtoken';

const adminAuth = async (request,response,next)=>{
    const {token} = request.cookies;
    if(!token){
        return response.status(401).json({success:false,message:"Not authorized. Login Again"});
    }
    try{ 
        const tokenDecoded =  jwt.verify(token,process.env.JWT_SECRET);
        const user = await userModel.findById(tokenDecoded.id);
        if(!user){
            return response.status(401).json({success:false,message:"User not found. Login Again"});
        }
        if(user.role !== 'Admin'){
            return response.status(403).json({success:false,message:"Forbidden. Admin access required."});
        }
        
        // Initialize request.body if it doesn't exist
        if (!request.body) {
            request.body = {};
        }
        
        // Add user information to request
        request.body.userId = tokenDecoded.id;
        request.user = user; // Add user to request for potential use in controllers
        
        next();
    }catch(error){
        console.error('Admin Auth Error:', error);
        return response.status(401).json({success:false,message:"Authentication error. Please login again."});
    }
}

export default adminAuth;