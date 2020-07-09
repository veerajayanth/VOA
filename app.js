require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/testDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set("useCreateIndex", true);

const postSchema = new mongoose.Schema(
  {
    post: String
  });

const Post = new mongoose.model("Post", postSchema);
const item1 = new Post (
  {
    post:"Welcome to todo list"
  });

const item2 = new Post (
  {
    post:"Click + to add a todo list"
  });

const item3 = new Post (
    {
      post:"==>click here to delete"
    });

const defaultItems = [item1,item2,item3];


const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  posts:[postSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



///////////////////////RENDERS THE HOMEPAGE////////////////////////////////////

app.get("/",function (req,res) {
  res.render("home");
});

/////////////////////RENDERS THE CONTENTPAGE AFTER THE LOGIN///////////////////

app.route("/content")
.get(function (req,res) {
  if (req.isAuthenticated()){
    Post.find({},function (err,foundItems) {
      if(foundItems.length === 0){
        Post.insertMany(defaultItems,function (err)
        {
            if(err){
              console.log(err);
            }
            else {
              console.log("Success");
              console.log("o");
              res.render("content",{username: req.user.username,postss:req.user.posts,newPostitems:foundItems});
            }
        });
    }
      else{
        console.log("else");
        //console.log(post);
        res.render("content",{username: req.user.username,newPostitems:foundItems});

      }
    });

  } else {
    res.redirect("/login");
  }
})
.post(function (req,resp) {
  console.log(req);

  const uu = {
    _id: mongoose.Types.ObjectId(),
    post:req.body.postit
  };
  const defaultItems = [uu];
//if not works use find one and update fnc
  User.findOne({username:req.user.username},function(err,found) {
    if(!err){
      console.log("inside not error");
      console.log(found);
      found.posts.push(uu);
      found.save(err,function (req,res) {
        if(!err){
          //res.render("content",{username: req.user.username,newPostitems:foundItems});
          //Post.post.push(uu);
          //Post.save();
          Post.insertMany(defaultItems,function (err){
            if(!err){
              resp.redirect("/content");

            }
          });
        }

      });
    }
    else{
      console.log(err);
    }
  })

});

///////////////////LOGS OUT THE USER WHEN THE LOGOUT BUTTON IS PRESSED//////////

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

////////////////////////////////ROUTERS OF THE REGISTER PAGE////////////////////

app.route("/register")
.get(function (req,res) {
  res.render("register");
})
.post(function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/content");
      });
    }
  });

});

///////////////////////////ROUTERS OF THE LOGIN PAGE////////////////////////////
app.route("/login")
.get(function (req,res) {
  res.render("login");
})
.post(function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        Post.find({},function (err,foundItems) {
          if(foundItems.length === 0){
            Post.insertMany(defaultItems,function (err)
            {
                if(err){
                  console.log("in inser many login");
                  console.log(err);
                }
                else {
                  console.log("Success");
                  console.log("o");
                  res.render("content",{username: req.user.username,postss:req.user.posts,newPostitems:foundItems});
                }
            });

          }
          else{
            console.log("else");
            res.render("content",{username: req.user.username,newPostitems:foundItems});

          }
        });
        //res.render("content",{username: req.user.username,newPostitems:foundItems});

      //  res.render("content",{username: req.user.username,eachpost:req.user.posts});
      });
    }
  });

});











////////////////////////////LISTENING PORT//////////////////////////////
app.listen(3000,function (req,res) {
  console.log("Running...");
});
