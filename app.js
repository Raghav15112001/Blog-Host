//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const string = require("mongoose/lib/cast/string");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
var title = "";
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));



app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);


const postSchema = new Schema({
    postComp: [{
        image: String,
        title: String,
        content: String,
    }],
    email: String,
    password: String,
    name: String
});

postSchema.plugin(passportLocalMongoose);
postSchema.plugin(findOrCreate);


const Post = mongoose.model("Post", postSchema);


passport.use(Post.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    Post.findById(id, function(err, user) {
        done(err, user);
    });
});



app.get("/", function(req, res) {
    res.render("register");
});

// app.get("/", function(req, res){

//   Post.find({}, function(err, posts){
//     res.render("home", {

//       });
//   });
// });


app.get("/login", function(req, res) {
    res.render("register");
});

app.get("/register", function(req, res) {
    res.render("register");
});


app.get("/home", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("home")
    } else {
        res.redirect("/login")
    }
});


// app.get("/compose", function(req, res){
//   res.render("compose");
// });

// app.post("/compose", function(req, res){
//   const post = new Post({
//     title: req.body.postTitle,
//     image: req.body.postImage,
//     content: req.body.postBody
// res.render("/allpost");
// });


//   post.save(function(err){
//     if (!err){
//         res.redirect("/allpost");
//     }
//   });
// });






app.get("/compose", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("compose")
    } else {
        res.redirect("/login")
    }
});

app.post("/compose", function(req, res) {
    const post = {
        title: req.body.postTitle,
        image: req.body.postImage,
        content: req.body.postBody
    };

    // Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    console.log(req.user);

    Post.findById(req.user.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                // foundUser.title = post.title;
                // foundUser.image = post.image;
                // foundUser.content = post.content;
                foundUser.postComp.push(post);
                foundUser.save(function() {
                    res.redirect("/allpost");
                });
            }
        }
    });
});






app.get("/posts/:postId/:bodyId", function(req, res) {

    const requestedPostId = req.params.postId;
    const requestedBodyId = req.params.bodyId;
    // console.log(requestedBodyId);

    Post.findOne({ _id: requestedPostId }, function(err, post) {
        if (err) {
            console.log(err);
        } else {
            if (post) {
                for (let p of post.postComp) {
                    if (p._id == requestedBodyId) {
                        res.render("post", {
                            image: p.image,
                            title: p.title,
                            content: p.content
                        })
                    }
                }
            }
        }
        // res.render("post", {
        //     image: post.image,
        //     title: post.title,
        //     content: post.content
        // });
    });

});



app.get("/account", function(req, res) {
    if (req.isAuthenticated()) {
        // console.log(req.user.id);
        Post.findById(req.user.id, function(err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    // console.log(foundUser.email);
                    Post.find({}, function(err, posts) {
                        res.render("account", {
                            posts: posts,
                            iD: req.user.id
                        });
                    });
                }
            }
        });
    } else {
        res.redirect("/login")
    }
});




app.get("/about", function(req, res) {
    res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function(req, res) {
    res.render("contact", { contactContent: contactContent });
});

// app.get("/allpost", function(req, res){
//   res.render("allpost")
// });

app.get("/allpost", function(req, res) {

    Post.find({}, function(err, posts) {
        res.render("allpost", {
            posts: posts,
        });
    });
});




app.get("/logout", function(req, res) {
    req.logout();
    res.render("loggedout");
});

app.post("/loggedout", function(req, res) {
    res.redirect("/");
})



app.post("/register", function(req, res) {
    Post.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                Post.findById(req.user.id, function(err, foundUser) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (foundUser) {
                            // console.log(foundUser.email);
                            foundUser.name = req.body.name;
                            foundUser.save();
                            console.log(foundUser)
                                // Post.find({}, function(err, posts) {
                                //     res.render("account", {
                                //         posts: posts,
                                //         iD: req.user.id
                                //     });
                                // });
                        }
                    }
                });
                res.render("home");
            });
        }
    });

});

app.post("/login", function(req, res) {

    const user = new Post({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.render("home");
            });
        }
    });

});












// const userSchema ={
//   email: String,
//   password: String
// };


// const User = new mongoose.model("User",userSchema);





// Level-1, login/signup Page



// app.get("/register", function(req, res){
//   res.render("register");
// });
// app.get("/login", function(req, res){
//   res.render("login");
// });



// app.post("/register",function(req,res){

//   const tempemail = req.body.email;


//   Post.findOne({email: tempemail}, function(err, foundUser){
//     if(err){
//       console.log(err);
//     }
//     else{
//       if(foundUser){
//         // alert("Email is already Register");
//         res.redirect("/login");
//       }
//       else{
//         const newUser = new Post({
//           email: req.body.email,
//           password: req.body.password
//         });

//         newUser.save(function(err){
//           if(err){
//             console.log(err);
//           }
//           else{
//             res.redirect("/");
//           }
//         });
//       }
//     }
//   });


// });

// app.post("/login",function(req,res){
//   const username = req.body.email;
//   const password = req.body.password;

//   Post.findOne({email: username}, function(err, foundUser){
//     if(err){
//       console.log(err);
//     }
//     else{
//       if(foundUser){
//         if(foundUser.password == password){
//           res.redirect("/");
//         }
//       }
//     }
//   });
// });




app.listen(3000, function() {
    console.log("Server started on port 3000");
});