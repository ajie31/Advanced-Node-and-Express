"use strict";
require("dotenv").config();
const session = require("express-session");
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const app = express();

const route = require("./route.js");
const auth = require("./auth.js");

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
myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  route(app, myDataBase);
  auth(app, myDataBase);
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
