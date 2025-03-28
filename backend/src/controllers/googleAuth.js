import passport from 'passport';
import {signup} from './auth.controller.js'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://real-time-chat-gsr4.onrender.com/api/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // Store user details in DB or session
      
      const {email, name, picture} = profile;
      const password = "Sanskar@12";
      const req = {bpdy: {email,name, picture, password}};
      signup(req);
      return done(null, profile);
    }
  )
);

// Serialize & Deserialize user (for session support)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});
