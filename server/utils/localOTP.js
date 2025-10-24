// Local OTP storage and management
const otpStorage = new Map();

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = (email, otp) => {
    otpStorage.set(email, {
        otp,
        createdAt: Date.now(),
        verified: false
    });
    
    // Log the OTP in development (simulating email)
    console.log(`
    ===============================
    Email: ${email}
    OTP: ${otp}
    ===============================
    `);
    
    // Delete OTP after 10 minutes
    setTimeout(() => {
        if (otpStorage.has(email) && !otpStorage.get(email).verified) {
            otpStorage.delete(email);
        }
    }, 600000);
};

export const verifyOTP = (email, otp) => {
    const otpData = otpStorage.get(email);
    
    if (!otpData) {
        return { valid: false, message: "OTP expired or not found" };
    }
    
    if (otpData.otp !== otp) {
        return { valid: false, message: "Invalid OTP" };
    }
    
    if (Date.now() - otpData.createdAt > 600000) {
        otpStorage.delete(email);
        return { valid: false, message: "OTP expired" };
    }
    
    otpData.verified = true;
    otpStorage.set(email, otpData);
    
    return { valid: true, message: "OTP verified successfully" };
};

export const isEmailVerified = (email) => {
    const otpData = otpStorage.get(email);
    return otpData && otpData.verified;
};

export const clearOTPData = (email) => {
    otpStorage.delete(email);
};