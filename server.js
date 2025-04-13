/********************************************************************************
*  WEB322 – Assignment 06
*
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
*
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html

Vercel Link: https://my-web322-app.vercel.app/
*
*  Name: Shree Krishna Joshi    Student ID: 161354238    Date: April 12, 2025
*
********************************************************************************/
require("dotenv").config(); 
const express = require("express");
const app = express();
const path = require("path");

const siteData = require("./modules/data-service");
const authData = require("./modules/auth-service"); 

const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

const clientSessions = require("client-sessions");


app.use(clientSessions({
  cookieName: "session",
  secret: "yourSecretKey",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));


app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}



app.get("/", (req, res) => res.render("home"));

app.get("/about", (req, res) => res.render("about"));

app.get("/sites", async (req, res) => {
  try {
    let sites = [];
    if (req.query.region) {
      sites = await siteData.getSitesByRegion(req.query.region);
    } else if (req.query.provinceOrTerritory) {
      sites = await siteData.getSitesByProvinceOrTerritoryName(req.query.provinceOrTerritory);
    } else {
      sites = await siteData.getAllSites();
    }
    res.render("sites", { sites });
  } catch (err) {
    res.status(404).render("404", { message: "Unable to find what you're looking for." });
  }
});

app.get("/sites/:id", async (req, res) => {
  try {
    let site = await siteData.getSiteById(req.params.id);
    if (site) {
      res.render("site", { site });
    } else {
      res.status(404).render("404", { message: "Site not found." });
    }
  } catch (err) {
    res.status(404).render("404", { message: "Error loading site." });
  }
});

app.get("/addSite", ensureLogin, (req, res) => {
  siteData.getAllProvincesAndTerritories()
    .then((provinces) => res.render("addSite", { provincesAndTerritories: provinces }))
    .catch((err) => {
      res.status(404).render("404", { message: "Unable to find provinces." });
    });
});

app.post("/addSite", ensureLogin, (req, res) => {
  siteData.addSite(req.body)
    .then(() => res.redirect("/sites"))
    .catch((err) => {
      res.render("500", {
        message: `We encountered an error: ${err.errors[0].message}`,
      });
    });
});

app.get("/editSite/:id", ensureLogin, (req, res) => {
  const siteId = req.params.id;
  siteData.getSiteById(siteId)
    .then((data) => {
      siteData.getAllProvincesAndTerritories()
        .then((provinces) => {
          res.render("editSite", { provincesAndTerritories: provinces, sites: data });
        });
    })
    .catch((err) => {
      res.status(404).render("404", { message: err });
    });
});

app.post("/editSite", ensureLogin, (req, res) => {
  siteData.editSite(req.body.id, req.body)
    .then(() => res.redirect("/sites"))
    .catch((err) => {
      res.render("500", {
        message: `Error: ${err}`,
      });
    });
});

app.use("/deleteSite/:id", ensureLogin, (req, res) => {
  siteData.deleteSite(req.params.id)
    .then(() => res.redirect("/sites"))
    .catch((err) => {
      res.render("500", {
        message: `Error: ${err}`,
      });
    });
});



app.get("/login", (req, res) => {
  res.render("login", {
    userName: "", 
    errorMessage: null
  });
});


app.get("/register", (req, res) => {
  res.render("register", {
    successMessage: null,
    errorMessage: null,
    userName: "",
    email: ""
  });
});

app.post("/register", async (req, res) => {
  const { userName, password, password2, email } = req.body;

  if (password !== password2) {
    return res.render("register", {
      userName,
      email,
      errorMessage: "Passwords do not match.",
      successMessage: null
    });
  }

  try {
    await authData.registerUser(req.body);
    res.render("register", {
      userName: "",
      email: "",
      errorMessage: null,
      successMessage: "User created"
    });
  } catch (err) {
    res.render("register", {
      userName,
      email,
      errorMessage: err,
      successMessage: null
    });
  }
});


app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body).then((user) => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect("/sites");
  }).catch((err) => {
    res.render("login", { errorMessage: err, userName: req.body.userName });
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});


app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found." });
});


siteData.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("App listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("Error starting server: ", err);
  });