const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

const express = require("express");
const hbs = require("hbs");
const User = require("./models/user");
const Task = require("./models/task");
const session = require("express-session");
const flash = require('express-flash')
const passport = require("passport");
require("../config/passport");
const { sendWelcomeEmail, sendCancelationEmail } = require("./emails/account");

const app = express();

//Define paths for express config
const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

//Setup handlebars engine and views location
app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);
hbs.registerHelper("ifCond", function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
app.use(express.static(publicDirectoryPath));

//Setup static directory to serve
app.use(express.urlencoded({ extended: false }));
app.use(flash())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const isAuthenticated = (req, res, next) => {
  if (req.user) return next();
  else
    return res.render("unauthenticated", {
      error: "User not authenticated",
      title: "Authentication needed",
      name: "Daniel Cambinda",
      user: req.user,
    });
};

app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    name: "Daniel Cambinda",
    user: req.user,
  });
});

app.get("/signup", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("register", {
    title: "Sign up",
    name: "Daniel Cambinda",
    user: req.user,
  });
});

app.post("/signup", async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    res.render("RegisterDone", {
      title: "Signup completed",
      name: "Daniel Cambinda",
      user: req.user,
      email: user.email,
    });

    //sendWelcomeEmail(user.email,user.name)
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  res.render("login", {
    title: "Login",
    name: "Daniel Cambinda",
    user: req.user
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
    successRedirect: "/tasks",
  }),
  (req, res) => {}
);

// need auth
app.get("/newtask", isAuthenticated, (req, res) => {
  
    res.render("newtask", {
      title: "New task",
      name: "Daniel Cambinda",
      user: req.user,
    });
});
app.post("/newtask", isAuthenticated, async (req, res) => {
  const user = req.user;
  try {
    await user.createTask({
      description: req.body.description,
      date: req.body.datefield,
      completed: req.body.completed,
    });
    res.redirect("/tasks");
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
    });
  }
});

app.get("/tasks", isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { UserId: req.user.id } });
    const tasksCount = await Task.count({ where: { UserId: req.user.id } });

    if(tasksCount ===0){
      return res.render("messagePage", {
        title: "No Tasks Yet",
        name: "Daniel Cambinda",
        user: req.user,
        message: "You have no tasks",
      });
    }

    res.render("tasks", {
      title: "Tasks",
      name: "Daniel Cambinda",
      user: req.user,
      tasks,
    });
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
    });
  }
});

app.get("/edittask", isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { UserId: req.user.id } });
    const tasksCount = await Task.count({ where: { UserId: req.user.id } });

    if(tasksCount === 0){
      return res.render("messagePage", {
        title: "No Tasks Yet",
        name: "Daniel Cambinda",
        user: req.user,
        message: "You have no tasks"
      });
    }
    res.render("edittask", {
      title: "Edit task",
      name: "Daniel Cambinda",
      user: req.user,
      tasks,
    });
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
});

app.post("/edittask", isAuthenticated, async (req, res) => {
  const formId = req.body.id;
  const formDescription = req.body.description;
  const formCompleted = req.body.completed;
  
  try {
    const task = await Task.findOne({ where: { id: formId } });

    if (task.UserId !== req.user.id) {
     return res.render("messagePage", {
        title: "Error",
        name: "Daniel Cambinda",
        user: req.user,
        message: "You don't own this task",
      });
    }

    if(formDescription.length === 0 && formCompleted === String(task.completed)){
      return res.render('messagePage',{
        title:'No changes applied',
        name: 'Daniel Cambinda',
        user:req.user,
        message:'No changes applied.'
      })
    }

    if (formDescription.length === 0 && formCompleted !== String(task.completed)) {
      task.completed = formCompleted;
      await task.save();
      return res.redirect('/tasks')
    }

     task.description = formDescription
     task.completed = formCompleted
     await task.save()

    res.redirect("/tasks");
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
});

app.get('/deletetask', isAuthenticated, async (req,res)=>{
  try {
    const tasks = await Task.findAll({ where: { UserId: req.user.id } });
    const tasksCount = await Task.count({ where: { UserId: req.user.id } });

    if(tasksCount === 0){
      return res.render("messagePage", {
        title: "No Tasks Yet",
        name: "Daniel Cambinda",
        user: req.user,
        message: "You have no tasks"
      });
    }
    res.render("deletetask", {
      title: "Delete task",
      name: "Daniel Cambinda",
      user: req.user,
      tasks,
    });
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
})

app.post('/deletetask', isAuthenticated,async (req,res)=>{
  const formId = req.body.id
  try {
    await Task.destroy({where:{id:formId}})
    res.redirect('/tasks')
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
})

app.get("/profile", isAuthenticated, (req, res) => {
  try {
    res.render("profile", {
      title: "Profile",
      name: "Daniel Cambinda",
      user: req.user,
    });
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
});

app.post('/editprofile', isAuthenticated, async (req,res)=>{
  
  try { 

    const formName = req.body.name;
    const formEmail = req.body.email;
    const formPassword = req.body.password;

    const user = await User.findOne({ where: { email: formEmail } });

    if (formEmail.length === 0 && formName.length === 0 && formPassword.length === 0) {
          return res.render("messagePage", {
            title: "No changes",
            name: "Daniel Cambinda",
            user: req.user,
            message: "No changes applied.",
          });
    }

    if(formEmail === req.user.email){
      return res.render("messagePage", {
        title: "Error",
        name: "Daniel Cambinda",
        user: req.user,
        message: "You are try to change to your own email, try another email."
      });
    }

    if (formEmail.length !== 0 && user) {
      return res.render("messagePage", {
        title: "Email in use",
        name: "Daniel Cambinda",
        user: req.user,
        message: "This email is already in use. Try another email",
      });
    }

    if(formEmail.length === 0 && formPassword.length === 0){ // only change name
      req.user.name = formName
      await req.user.save({fields:['name']})
      return res.redirect('/profile')
    }

    if(formName.length === 0 && formPassword.length === 0){ // only change email
      req.user.email = formEmail;
      await req.user.save({ fields: ["email"] });
      return res.redirect("/profile");
    }

    if(formEmail.length === 0 && formName.length === 0){ //only change password
      req.user.password = formPassword;
      await req.user.save({ fields: ["password"] });
      req.logOut()
      return res.redirect("/login");
    }

    if(formName.length === 0 ){ //change email and password
      req.user.email = formEmail;
      req.user.password = formPassword;
      await req.user.save({ fields: ['email',"password"] });
      req.logOut();
      return res.redirect("/login");
    }

    if(formEmail.length === 0 ){ //change name and password
      req.user.name = formName;
      req.user.password = formPassword;
      await req.user.save({ fields: ["name", "password"] });
      req.logOut()
      return res.redirect('/login')
    }

    if(formPassword.length === 0 ){ //change name and email
      req.user.email = formEmail;
      req.user.name = formName;
      await req.user.save({ fields: ["email", "name"] });
      return res.redirect("/profile");
    }

    req.user.name = formName;
    req.user.password = formPassword;
    req.user.email = formEmail
    await req.user.save({ fields: ["name", "password",'email'] });
    req.logOut();
    res.redirect('/login')
    
  } catch (e) {
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
})

app.post('/deleteprofile', isAuthenticated,async (req,res)=>{
  try {

    let emailToSend=req.user.email
    let nameToSend = req.user.name
    await req.user.destroy()
    req.logOut()
    //sendCancelationEmail(emailToSend,nameToSend)    
    res.redirect('/')

  } catch (error) {
    console.log(error)
    res.render("messagePage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
      message: "Something went wrong. Please try again.",
    });
  }
})

app.get("/logout", isAuthenticated, (req, res) => {
  req.logout();
  return res.redirect("/");
});
//need auth end

// 404 page
app.get("*", (req, res) => {
  return res.render("404", {
    title: "404 Page not found",
    name: "Daniel Cambinda",
    user: req.user,
  });
});

module.exports = app;
