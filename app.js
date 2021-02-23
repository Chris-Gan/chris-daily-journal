//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
require("dotenv").config()

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(session({
  secret:process.env.SECRET,
  saveUninitialized:false,
  resave:false
}));

app.use(passport.initialize());
app.use(passport.session());

// Mongoose
mongoose.connect(process.env.ATLAS,{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const contentSchema = new mongoose.Schema({
  postTitle:{
    type:String,
    required: [true, "Please enter a title"]
  },
  postBody:{
    type: String,
    required: [true, "Please enter your content"]
  },
  postDate:{
    type: Date,
    default:Date.now,
    get: value => value.toDateString()
  }
});
const userSchema = new mongoose.Schema({
  username:String,
  password:String,
  journal:[contentSchema]
});

userSchema.plugin(passportLocalMongoose);

const ContentModel = mongoose.model("Post",contentSchema);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.post("/compose",function(req,res){
  if(req.isAuthenticated()){
    const id = req.user._id;
    User.findById(id,function(err,results){
      const post = new ContentModel({
        postTitle: req.body.title,
        postBody: req.body.post, 
        // postDate: Currentdate
      });
      results.journal.push(post);
      results.save(function(err){
        if(!err){
          res.redirect("/home");
        }else{
          console.log(err);
        }
      });
    })
  }
});

app.post("/delete",function(req,res){
  if(req.isAuthenticated()){
    const articleID = req.body.id;
    const id = req.user._id;
    User.findOneAndUpdate({_id:id},{$pull:{journal:{_id:articleID}}}, function(err,results){
      if(!err){
        console.log("item with ID " + articleID + " is deleted from the database!");
      }
    });
    res.redirect("/home");
  }
});

app.post("/update",function(req,res){
  if(req.isAuthenticated()){
    const id = req.user._id;
    const articleID= req.body.id;
    
    User.findById(id,function(err,result){
      if(!err){
        if(result){
          console.log(result.journal);
          const journalList = result.journal; 
          journalList.forEach(function(journal){
            if (journal._id == articleID){
              const title = journal.postTitle;
              const content = journal.postBody;
              // console.log(journal);
              // console.log(title);
              res.render("update",{title:title,content:content});
            }else{
              console.log("article with ID " + articleID + " is not found!!");
            }
          });            
            User.findOneAndUpdate({_id:id},{$pull:{journal:{_id:articleID}}}, function(deleteErr,deleteResults){
              if(!deleteErr){
                console.log("Article with ID: "+articleID + " is deleted upon update")
              }
          });
          }
      }
    });
  }
}); 
app.post("/register",function(req,res){
  const username = req.body.username;
  const password = req.body.password;
  User.register({username:username}, password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res, function(){
        res.render("registerSuccessful")
      })
    }
  })
});

app.post("/",function(req,res,next){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/home");
      })
    }
  })
})

app.get("/home", function(req,res){
  if(req.isAuthenticated()){
    const id = req.user._id;
    console.log(id);
    User.findById(id,function(err,results){
      if(!err){
        res.render("home",{posts:results.journal})
      }
    })
  }  
});


app.get("/compose", function(req,res){
  res.render("compose");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/", function(req,res){
  res.render("login");
});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})

app.get("/posts/:title", function(req,res){
  if(req.isAuthenticated()){
  const routeTitle = req.params.title;
  const lowerRouteTitle = _.lowerCase(req.params.title); 
  const id = req.user._id;
  User.findById(id,function(err,results){
    const posts = results.journal;
    posts.forEach(function(post){
      const postTitleCompared = _.lowerCase(post.postTitle);
      const postID = post._id;
      const date = post.postDate;

      if ((lowerRouteTitle === postTitleCompared)||(routeTitle == postID)){
        res.render("post",{postTitle:post.postTitle, postContent:post.postBody,postID:postID,date:date});
      }else{
        console.log("match not found");
      }
    });
  });
  }

});



app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
