const passport = require("passport");
require("dotenv").config();
const localStrategy = require("passport-local");
GitHubStrategy = require("passport-github").Strategy;
const bcrypt = require("bcrypt");
const ObjectID = require("mongodb").ObjectID;

module.exports = function (app, myDataBase) {
  app.use(passport.initialize());
  app.use(passport.session());
  //! Serialization and deserialization
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
  //!Authentication Strategies
  passport.use(
    new localStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log("user" + username + " attemted to login.");
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );
  //github Authentication
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "localhost:3000/auth/github/callback",
        // "https://boilerplate-advancednode.your-username.repl.co/auth/github/callback",
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        // Database logic here with callback containing our user object
        myDataBase.findOneAndUpdate(
          { id: profile.id },
          {
            $setOnInsert: {
              id: profile.id,
              name: profile.displayName || "John Doe",
              photo: profile.photos[0].value || "",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, doc) => {
            return cb(null, doc.value);
          }
        );
      }
    )
  );
};
