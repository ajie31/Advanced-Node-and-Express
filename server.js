"use strict";
require("dotenv").config();
const session = require("express-session");
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const app = express();

const route = require("./route.js");
const auth = require("./auth.js");

const http = require("http").createServer(app);
const io = require("socket.io")(http);
//!Authentication with Socket.IO
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

let currentUsers = 0;

fccTesting(app); //For FCC testing purposes
app.set("view engine", "pug");
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//!use express session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

//connection to mongo
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  route(app, myDataBase);
  auth(app, myDataBase);

  io.on("connection", (socket) => {
    ++currentUsers;
    io.emit("user", {
      name: socket.request.user.name,
      currentUsers,
      connected: true,
    });
    console.log("user " + socket.request.user.username + " connected");

    socket.on("disconnect", () => {
      --currentUsers;
      io.emit("user count", currentUsers);
      console.log("A user has Disconnected");
    });
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});
const onAuthorizeSuccess = (date, message, error, accept) => {
  console.log("successful connection to socket.io");

  accept(null, true);
};

const onAuthorizeFail = (date, message, error, accept) => {
  if (error) {
    throw new Error(message);
  }
  console.log("failed connect to socket");
  accept(null, false);
};
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
