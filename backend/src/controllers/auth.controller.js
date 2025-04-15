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
      console.log('Checking if email notifications are enabled for Google login:', process.env.SEND_EMAIL_NOTIFICATIONS);
      if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
        try {
          console.log('Preparing Google login notification email data');
          const userAgent = req.headers['user-agent'] || 'Unknown User Agent';
          console.log('User Agent:', userAgent);
          
          const { device, browser } = getDeviceInfo(userAgent);
          console.log('Device Info:', { device, browser });
          
          const ip = getClientIp(req);
          console.log('IP Address:', ip);
          
          const time = getCurrentTime();
          console.log('Google Login Time:', time);

          // Send login notification asynchronously (don't wait for it)
          console.log(`Attempting to send Google login notification email to ${user.email}`);
          sendLoginNotification(user.email, user.fullName, {
            ip,
            device,
            browser,
            time
          }).then(success => {
            if (success) {
              console.log(`Google login notification email sent successfully to ${user.email}`);
            } else {
              console.log(`Failed to send Google login notification email to ${user.email}`);
            }
          }).catch(err => console.error('Failed to send Google login email:', err));
          
          console.log(`Google login notification email queued for ${user.email}`);
        } catch (emailError) {
          // Don't fail the login if email sending fails
          console.error('Error preparing Google login notification email:', emailError);
          console.error('Error details:', emailError.message);
        }
      } else {
        console.log('Email notifications are disabled. No Google login email sent.');
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
    console.log('Checking if email notifications are enabled for Google signup:', process.env.SEND_EMAIL_NOTIFICATIONS);
    if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
      try {
        console.log('Preparing Google signup confirmation email data');
        const userAgent = req.headers['user-agent'] || 'Unknown User Agent';
        console.log('User Agent:', userAgent);
        
        const { device, browser } = getDeviceInfo(userAgent);
        console.log('Device Info:', { device, browser });
        
        const ip = getClientIp(req);
        console.log('IP Address:', ip);
        
        const time = getCurrentTime();
        console.log('Google Signup Time:', time);

        // Send signup confirmation asynchronously (don't wait for it)
        console.log(`Attempting to send Google signup confirmation email to ${newUser.email}`);
        sendSignupConfirmation(newUser.email, newUser.fullName, {
          ip,
          device,
          browser,
          time
        }).then(success => {
          if (success) {
            console.log(`Google signup confirmation email sent successfully to ${newUser.email}`);
          } else {
            console.log(`Failed to send Google signup confirmation email to ${newUser.email}`);
          }
        }).catch(err => console.error('Failed to send Google signup email:', err));
        
        console.log(`Google signup confirmation email queued for ${newUser.email}`);
      } catch (emailError) {
        // Don't fail the signup if email sending fails
        console.error('Error preparing Google signup confirmation email:', emailError);
        console.error('Error details:', emailError.message);
      }
    } else {
      console.log('Email notifications are disabled. No Google signup email sent.');
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
      console.log('Checking if email notifications are enabled for signup:', process.env.SEND_EMAIL_NOTIFICATIONS);
      if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
        try {
          console.log('Preparing signup confirmation email data');
          const userAgent = req.headers['user-agent'] || 'Unknown User Agent';
          console.log('User Agent:', userAgent);
          
          const { device, browser } = getDeviceInfo(userAgent);
          console.log('Device Info:', { device, browser });
          
          const ip = getClientIp(req);
          console.log('IP Address:', ip);
          
          const time = getCurrentTime();
          console.log('Signup Time:', time);

          // Send signup confirmation asynchronously (don't wait for it)
          console.log(`Attempting to send signup confirmation email to ${newUser.email}`);
          sendSignupConfirmation(newUser.email, newUser.fullName, {
            ip,
            device,
            browser,
            time
          }).then(success => {
            if (success) {
              console.log(`Signup confirmation email sent successfully to ${newUser.email}`);
            } else {
              console.log(`Failed to send signup confirmation email to ${newUser.email}`);
            }
          }).catch(err => console.error('Failed to send signup email:', err));
          
          console.log(`Signup confirmation email queued for ${newUser.email}`);
        } catch (emailError) {
          // Don't fail the signup if email sending fails
          console.error('Error preparing signup confirmation email:', emailError);
          console.error('Error details:', emailError.message);
        }
      } else {
        console.log('Email notifications are disabled. No signup email sent.');
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
    console.log('Checking if email notifications are enabled:', process.env.SEND_EMAIL_NOTIFICATIONS);
    if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
      try {
        console.log('Preparing login notification email data');
        const userAgent = req.headers['user-agent'] || 'Unknown User Agent';
        console.log('User Agent:', userAgent);
        
        const { device, browser } = getDeviceInfo(userAgent);
        console.log('Device Info:', { device, browser });
        
        const ip = getClientIp(req);
        console.log('IP Address:', ip);
        
        const time = getCurrentTime();
        console.log('Login Time:', time);

        // Send login notification asynchronously (don't wait for it)
        console.log(`Attempting to send login notification email to ${user.email}`);
        sendLoginNotification(user.email, user.fullName, {
          ip,
          device,
          browser,
          time
        }).then(success => {
          if (success) {
            console.log(`Login notification email sent successfully to ${user.email}`);
          } else {
            console.log(`Failed to send login notification email to ${user.email}`);
          }
        }).catch(err => console.error('Failed to send login email:', err));
        
        console.log(`Login notification email queued for ${user.email}`);
      } catch (emailError) {
        // Don't fail the login if email sending fails
        console.error('Error preparing login notification email:', emailError);
        console.error('Error details:', emailError.message);
      }
    } else {
      console.log('Email notifications are disabled. No login email sent.');
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
