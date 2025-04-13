const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");

let User; 


const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});


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


function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

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


function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
          return;
        }

        let user = users[0];


        bcrypt.compare(userData.password, user.password)
          .then((result) => {
            if (!result) {
              reject("Incorrect Password for user: " + userData.userName);
              return;
            }

            if (user.loginHistory.length === 8) {
              user.loginHistory.pop();
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent
            });


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


module.exports = {
  initialize,
  registerUser,
  checkUser
};
