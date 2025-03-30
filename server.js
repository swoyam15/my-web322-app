/********************************************************************************
*  WEB322 – Assignment 02
*
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
*
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
*  Name: Shree Krishna Joshi    Student ID: 161354238    Date: Feb 4, 2025
*
********************************************************************************/

require("dotenv").config(); 
const express = require("express");
const app = express();
const path = require("path");
const siteData = require("./modules/data-service");
const HTTP_PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/sites", async (req, res) => {
  try {
    let sites = [];
    if (req.query.region) {
      sites = await siteData.getSitesByRegion(req.query.region);
    } else if (req.query.provinceOrTerritory) {
      sites = await siteData.getSitesByProvinceOrTerritoryName(
        req.query.provinceOrTerritory
      );
    } else {
         sites = await siteData.getAllSites();
    }
    res.render("sites", { sites });
  } catch (err) {
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for",});
  }
});

app.get("/sites/:id", async (req, res) => {
  try {
    let site = await siteData.getSiteById(req.params.id);
    if (site) {
      res.render("site", { site });
    } else {
      res.status(404);
    }
  } catch (err) {
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for",});
  }
});

app.use(express.urlencoded({ extended: true }));

app.get("/addSite", (req, res) => {
  siteData
    .getAllProvincesAndTerritories()
    .then((provinces) => {
      res.render("addSite", { provincesAndTerritories: provinces });
    })
    .catch((err) => {
      res.status(404).render("404", { message: "Unable to find sites." });
      console.log(err);
    });
});

app.post("/addSite", (req, res) => {
  const data = req.body;
  siteData
    .addSite(data)
    .then(() => {
      res.redirect("/sites");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${ err.errors[0].message }`,
      });
      console.log(err);
    });
});

app.get("/editSite/:id", (req, res) => {
  const siteId = req.params.id;
  if (siteData) {
    siteData
      .getSiteById(siteId)
      .then((data) => {
        siteData.getAllProvincesAndTerritories().then((site) => {
          res.render("editSite", { provincesAndTerritories: site, sites: data });
        });
      })
      .catch((err) => {
        res.status(404).render("404", { message: err });
        console.log(err);
      });
  }
});

app.post("/editSite", (req, res) => {
  const siteId = req.body.id;
  const data = req.body;
  if (siteId) {
    siteData
      .editSite(siteId, data)
      .then(() => {
        res.redirect("/sites");
      })
      .catch((err) => {
        res.render("500", {
          message: `I'm sorry, but we have encountered the following error: ${err}`,
        });
      });
  }
});

app.use("/deleteSite/:id", (req, res) => {
  const siteId = req.params.id;
  if (siteId) {
    siteData
      .deleteSite(siteId)
      .then(() => {
        res.redirect("/sites");
      })
      .catch((err) => {
        res.render("500", {
          message: `I'm sorry, but we have encountered the following error: ${err}`,
        });
      });
  }
});


app.use((req, res) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for",});
});

siteData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () =>
      console.log("Express http server listening on: " + HTTP_PORT)
    );
  })
  .catch((err) => {
    console.log("Error: ", err);
  });
