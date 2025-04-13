const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");

let User; // Will be set when DB connects

// Define what a user looks like (schema)
const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

// 1️⃣ Connects to MongoDB and sets up the User model
function initialize() {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB);

    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
}

// 2️⃣ Registers a new user (with password hashing)
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    // Hash the password before saving
    bcrypt.hash(userData.password, 10)
      .then((hash) => {
        userData.password = hash;

        let newUser = new User({
          userName: userData.userName,
          password: userData.password,
          email: userData.email,
          loginHistory: []
        });

        newUser.save()
          .then(() => resolve())
          .catch(err => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject("There was an error creating the user: " + err);
            }
          });
      })
      .catch(() => {
        reject("There was an error encrypting the password");
      });
  });
}

// 3️⃣ Logs in user (checks password + saves login history)
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
          return;
        }

        let user = users[0];

        // Compare entered password with the hashed one
        bcrypt.compare(userData.password, user.password)
          .then((result) => {
            if (!result) {
              reject("Incorrect Password for user: " + userData.userName);
              return;
            }

            // Keep only latest 8 logins
            if (user.loginHistory.length === 8) {
              user.loginHistory.pop();
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent
            });

            // Save updated login history
            User.updateOne(
              { userName: user.userName },
              { $set: { loginHistory: user.loginHistory } }
            ).then(() => {
              resolve(user);
            }).catch((err) => {
              reject("There was an error verifying the user: " + err);
            });
          });
      })
      .catch(() => {
        reject("Unable to find user: " + userData.userName);
      });
  });
}

// ✨ Export the functions so they can be used in server.js
module.exports = {
  initialize,
  registerUser,
  checkUser
};
