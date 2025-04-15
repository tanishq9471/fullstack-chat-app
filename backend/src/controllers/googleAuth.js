import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { generateToken } from '../lib/utils.js';
import { sendLoginNotification, sendSignupConfirmation } from '../utils/emailService.js';

dotenv.config(); // Load environment variables

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://real-time-chat-gsr4.onrender.com/api/auth/google/callback'
        : 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          // Send login notification if enabled
          if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
            try {
              // We don't have req object here, so we'll use generic info
              const loginInfo = {
                ip: 'OAuth login',
                device: 'Unknown (OAuth)',
                browser: 'Unknown (OAuth)',
                time: new Date().toLocaleString()
              };
              
              // Send login notification asynchronously
              sendLoginNotification(user.email, user.fullName, loginInfo)
                .catch(err => console.error('Failed to send OAuth login email:', err));
              
              console.log(`OAuth login notification email queued for ${user.email}`);
            } catch (emailError) {
              console.error('Error preparing OAuth login notification email:', emailError);
            }
          }
          
          return done(null, user);
        }
        
        // If user doesn't exist, check if email is already registered
        if (profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          user = await User.findOne({ email });
          
          if (user) {
            // Update existing user with Google ID
            user.googleId = profile.id;
            await user.save();
            
            // Send login notification if enabled
            if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true') {
              try {
                // We don't have req object here, so we'll use generic info
                const loginInfo = {
                  ip: 'OAuth login',
                  device: 'Unknown (OAuth)',
                  browser: 'Unknown (OAuth)',
                  time: new Date().toLocaleString()
                };
                
                // Send login notification asynchronously
                sendLoginNotification(user.email, user.fullName, loginInfo)
                  .catch(err => console.error('Failed to send OAuth login email:', err));
                
                console.log(`OAuth login notification email queued for ${user.email}`);
              } catch (emailError) {
                console.error('Error preparing OAuth login notification email:', emailError);
              }
            }
            
            return done(null, user);
          }
        }
        
        // Create new user
        const newUser = new User({
          googleId: profile.id,
          fullName: profile.displayName,
          email: profile.emails?.[0]?.value || '',
          profilePic: profile.photos?.[0]?.value || '',
        });
        
        await newUser.save();
        
        // Send signup confirmation if enabled
        if (process.env.SEND_EMAIL_NOTIFICATIONS === 'true' && newUser.email) {
          try {
            // We don't have req object here, so we'll use generic info
            const signupInfo = {
              ip: 'OAuth signup',
              device: 'Unknown (OAuth)',
              browser: 'Unknown (OAuth)',
              time: new Date().toLocaleString()
            };
            
            // Send signup confirmation asynchronously
            sendSignupConfirmation(newUser.email, newUser.fullName, signupInfo)
              .catch(err => console.error('Failed to send OAuth signup email:', err));
            
            console.log(`OAuth signup confirmation email queued for ${newUser.email}`);
          } catch (emailError) {
            console.error('Error preparing OAuth signup confirmation email:', emailError);
          }
        }
        
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize & Deserialize user (for session support)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
