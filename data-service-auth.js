const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
let Schema = mongoose.Schema;
let userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});
let User;
module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "mongodb+srv://dbUser:MarcoDillon@senecaweb.2xwrs.mongodb.net/assignment5?retryWrites=true&w=majority",
      { useNewUrlParser: true }
    );
    db.on("error", (err) => {
      reject(err);
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          reject("There was an error encrypting the password");
        } else {
          bcrypt.hash(userData.password, salt, function (err, hash) {
            if (err) {
              reject("There was an error encrypting the password");
            } else {
              userData.password = hash;
              let newUser = new User(userData);
              newUser.save((err) => {
                if (err) {
                  if (err.code == 11000) {
                    reject("User Name already taken");
                  } else {
                    reject("There was an error creating the user: " + err);
                  }
                } else {
                  resolve();
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ userName: userData.userName })
      
      .exec()
      .then((users) => {
        bcrypt.compare(userData.password, users[0].password).then((res) => {
          if (res) {
            users[0].loginHistory.push({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent,
            });
            User.update(
              { userName: users[0].userName },
              {
                $set: {
                  loginHistory: users[0].loginHistory,
                },
              },
              {
                multi: false,
              }
            )
              .exec()
              .then(() => {
                resolve(users[0]);
              })
              .catch((err) => {
                reject("There was an error verifying the user:" + err);
              });
          } else {
            reject("Incorrect Password for user: " + userData.userName);
          }
        });
      })
      .catch((err) => {
        reject("Unable to find user:" + userData.userName);
      });
  });
};