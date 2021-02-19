//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/bloggerDB",{useNewUrlParser: true, useUnifiedTopology: true});
const contentSchema = new mongoose.Schema({
  postTitle:{
    type:String,
    required: [true, "Please enter a title"]
  },
  postBody:{
    type: String,
    required: [true, "Please enter your content"]
  }
});

const ContentModel = mongoose.model("Post",contentSchema);
const aboutContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.post("/compose",function(req,res){
  const post = new ContentModel({
    postTitle: req.body.title,
    postBody: req.body.post
  });
  post.save(function(err){
    if(!err){
      res.redirect("/");
    }else{
      console.log("Error occurs!")
    }
  });
});

app.post("/delete",function(req,res){
  const articleID = req.body.id;
  ContentModel.deleteOne({_id:articleID},function(err,result){
    if(!err){
      console.log("item with ID " + articleID + " is deleted from the database!")
    }
  });
  res.redirect("/");
});

app.post("/update",function(req,res){
  const articleID= req.body.id;
  ContentModel.findOne({_id:articleID},function(err,result){
    if(!err){
      if(result){
        const title = result.postTitle;
        const content = result.postBody;
        res.render("update",{
          title:title,
          content:content
        });
        ContentModel.deleteOne({_id:articleID},function(error,results){
          if(!error){
            console.log("Article with ID " + articleID+ " is deleted upon upon");
          }
        })
      }
    }
  })
})

app.get("/", function(req,res){
 ContentModel.find(function(err,posts){
    if(!err){
      console.log("All documents returned");
      res.render("home",{posts:posts});
    }
  });

  
})

app.get("/about",function(req,res){
  res.render("about",{aboutMarkerContent: aboutContent});
})

app.get("/compose", function(req,res){
  res.render("compose");
})

app.get("/posts/:title", function(req,res){
  const routeTitle = req.params.title;
  const lowerRouteTitle = _.lowerCase(req.params.title); 
  ContentModel.find(function(err,posts){
    posts.forEach(function(post){
      const postTitleCompared = _.lowerCase(post.postTitle);
      const postID = post._id;

      if ((lowerRouteTitle === postTitleCompared)||(routeTitle == postID)){
        res.render("post",{postTitle:post.postTitle, postContent:post.postBody,postID:postID});
      }else{
        console.log("match not found");
      }
    })
  });

})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
