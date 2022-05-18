const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

const express = require("express");
const hbs = require("hbs");
const User = require("./models/user");
const Task = require("./models/task");
const session = require("express-session");
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
app.use(express.static(publicDirectoryPath));

//Setup static directory to serve
app.use(express.urlencoded({ extended: false }));
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
      logged: false,
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
    user: req.user
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
      user:req.user,
      email: user.email
    });

    //sendWelcomeEmail(user.email,user.name)
  } catch (e) {
    res.render("ErrorPage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user
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
    failureMessage: false,
  }),
  (req, res) => {
    if (req.isAuthenticated) {
      return res.redirect("/");
    }
  }
);

// need auth
app.get("/newtask", isAuthenticated, (req, res) => {
  if (req.isAuthenticated) {
    res.render("newtask", {
      title: "New task",
      name: "Daniel Cambinda",
      user: req.user
    });
  }
});
app.post("/newtask", isAuthenticated,async (req, res) => {
    const user = req.user
    try {
        await user.createTask({
                description: req.body.description,
                completed: req.body.completed
        })
        res.redirect('/tasks')
    } catch (e) {
      res.render("ErrorPage", {
        title: "Error",
        name: "Daniel Cambinda",
        user: req.user
      });
    }
});

app.get("/tasks", isAuthenticated,async (req, res) => {

  try {
    const tasks = await Task.findAll({ where: { UserId: req.user.id } });
    res.render("tasks", {
      title: "Tasks",
      name: "Daniel Cambinda",
      user:req.user,
      tasks
    });
  } catch (e) {
    res.render("ErrorPage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
    });
  }
  
});

app.get('/edittask',isAuthenticated, async (req,res)=>{

  try {

    const tasks = await Task.findAll({ where: { UserId: req.user.id } })
    res.render("edittask", {
      title: "Edit task",
      name: "Daniel Cambinda",
      user: req.user,
      tasks
    });

  } catch (e) {
    res.render("ErrorPage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
    });
  }
})

app.patch("/edittask", isAuthenticated, async (req, res) => {
  
  try {


  } catch (e) {

    res.render("ErrorPage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
    })

  }
});

app.get("/profile", isAuthenticated, (req, res) => {

  try {
    res.render("profile", {
      title: "Profile",
      name: "Daniel Cambinda",
      user: req.user,
  });
  } catch (e) {
    res.render("ErrorPage", {
      title: "Error",
      name: "Daniel Cambinda",
      user: req.user,
    });
  }
  
});

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
    user: req.user
  });
});

module.exports = app;
