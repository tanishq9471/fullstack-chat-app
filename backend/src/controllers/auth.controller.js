import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { sendLoginNotification, sendSignupConfirmation } from "../utils/emailService.js";
import { getDeviceInfo, getClientIp, getCurrentTime } from "../utils/deviceInfo.js";
import dotenv from "dotenv";

dotenv.config();

export const googleAuth = async (req, res) => {
  try {
    const { email, fullName, profilePic, googleId } = req.body;
    
    if (!email || !fullName || !googleId) {
      return res.status(400).json({ message: "Email, name, and Google ID are required" });
    }

    // Check if user already exists by email or googleId
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    let isNewUser = false;
    
    if (user) {
      // If user exists but doesn't have googleId (registered via email), update the googleId
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      
      // User exists, log them in
      generateToken(user._id, res);
      
      // Send login notification email if enabled
      if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
        try {
          const userAgent = req.headers['user-agent'];
          const { device, browser } = getDeviceInfo(userAgent);
          const ip = getClientIp(req);
          const time = getCurrentTime();

          // Send login notification asynchronously (don't wait for it)
          sendLoginNotification(user.email, user.fullName, {
            ip,
            device,
            browser,
            time
          }).catch(err => console.error('Failed to send Google login email:', err));
          
          console.log(`Google login notification email queued for ${user.email}`);
        } catch (emailError) {
          // Don't fail the login if email sending fails
          console.error('Error preparing Google login notification email:', emailError);
        }
      }
      
      return res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
      });
    }
    
    // Create new user if they don't exist
    const newUser = new User({
      fullName,
      email,
      googleId,
      profilePic: profilePic || "",
      // No password for Google auth users
    });
    
    await newUser.save();
    generateToken(newUser._id, res);
    isNewUser = true;
    
    // Send signup confirmation email if enabled
    if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
      try {
        const userAgent = req.headers['user-agent'];
        const { device, browser } = getDeviceInfo(userAgent);
        const ip = getClientIp(req);
        const time = getCurrentTime();

        // Send signup confirmation asynchronously (don't wait for it)
        sendSignupConfirmation(newUser.email, newUser.fullName, {
          ip,
          device,
          browser,
          time
        }).catch(err => console.error('Failed to send Google signup email:', err));
        
        console.log(`Google signup confirmation email queued for ${newUser.email}`);
      } catch (emailError) {
        // Don't fail the signup if email sending fails
        console.error('Error preparing Google signup confirmation email:', emailError);
      }
    }
    
    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
    
  } catch (error) {
    console.log("Error in googleAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      // Send signup confirmation email if enabled
      if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
        try {
          const userAgent = req.headers['user-agent'];
          const { device, browser } = getDeviceInfo(userAgent);
          const ip = getClientIp(req);
          const time = getCurrentTime();

          // Send signup confirmation asynchronously (don't wait for it)
          sendSignupConfirmation(newUser.email, newUser.fullName, {
            ip,
            device,
            browser,
            time
          }).catch(err => console.error('Failed to send signup email:', err));
          
          console.log(`Signup confirmation email queued for ${newUser.email}`);
        } catch (emailError) {
          // Don't fail the signup if email sending fails
          console.error('Error preparing signup confirmation email:', emailError);
        }
      }

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    // Send login notification email if enabled
    if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
      try {
        const userAgent = req.headers['user-agent'];
        const { device, browser } = getDeviceInfo(userAgent);
        const ip = getClientIp(req);
        const time = getCurrentTime();

        // Send login notification asynchronously (don't wait for it)
        sendLoginNotification(user.email, user.fullName, {
          ip,
          device,
          browser,
          time
        }).catch(err => console.error('Failed to send login email:', err));
        
        console.log(`Login notification email queued for ${user.email}`);
      } catch (emailError) {
        // Don't fail the login if email sending fails
        console.error('Error preparing login notification email:', emailError);
      }
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
