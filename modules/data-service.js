require("dotenv").config();
require("pg");
const Sequelize = require("sequelize");



// set up sequelize to point to our postgres database
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'npg_nxqeA5X0lgKm', {
  host: 'ep-restless-frog-a5w6vt1v-pooler.us-east-2.aws.neon.tech',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.log('Unable to connect to the database:', err);
  });


// Define a "ProvinceOrTerritory" model
const ProvinceOrTerritory = sequelize.define(
  "ProvinceOrTerritory",
  {
    code: {
      type: Sequelize.STRING,
      primaryKey: true, // use "id" as a primary key
    },
    name: Sequelize.STRING,
    type: Sequelize.STRING,
    region: Sequelize.STRING,
    capital: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// Define a "Site" model
const Site = sequelize.define(
  "Site",
  {
    siteId: {
      type: Sequelize.STRING,
      primaryKey: true, // use "id" as a primary key
    },
    site: Sequelize.STRING,
    description: Sequelize.TEXT,
    date: Sequelize.INTEGER,
    dateType: Sequelize.STRING,
    image: Sequelize.STRING,
    location: Sequelize.STRING,
    latitude: Sequelize.FLOAT,
    longitude: Sequelize.FLOAT,
    designated: Sequelize.INTEGER,
    provinceOrTerritoryCode: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);
//define association
Site.belongsTo(ProvinceOrTerritory, { foreignKey: "provinceOrTerritoryCode" });

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve("Connection to Database Successful");
      })
      .catch((err) => {
        reject("Unable to connect to the database:", err);
      });
  });
}

function getAllSites() {
  return new Promise((resolve, reject) => {
    Site.findAll({ include: [ProvinceOrTerritory] })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("Could not query all sites: ");
      });
  });
}

function getSiteById(id) {
  return new Promise((resolve, reject) => {
    Site.findAll({
      include: [ProvinceOrTerritory],
      where: { siteId: id }, // Fixed where clause
    })
      .then((data) => {
        resolve(data[0]); //resolve with first element of returned arr
      })
      .catch((err) => {
        reject(`Unable to find requested site`);
      });
  });
}

function getSitesByProvinceOrTerritoryName(name) {
  return new Promise((resolve, reject) => {
    Site.findAll({
      include: [ProvinceOrTerritory],
      where: {
        "$ProvinceOrTerritory.name$": {
          [Sequelize.Op.iLike]: `%${name}%`,
        },
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject('Unable to find requested sites');
      });
  });
}

function getSitesByRegion(region) {
  return new Promise((resolve, reject) => {
    Site.findAll({include: [ProvinceOrTerritory], where: {
        '$ProvinceOrTerritory.region$': region
        },
    })
    .then((data) =>{
        resolve(data);
    })
    .catch((err)=>{
        reject('Unable to find requested sites');
    });
  });
}

//Function that adds a  Projects to the table
function addSite(siteData) {
  return new Promise((resolve, reject) => {
    Site.create({
        siteId: siteData.siteId,
        site: siteData.site,
        description: siteData.description,
        date: siteData.date,
        dateType: siteData.dateType,
        image: siteData.image,
        location: siteData.location,
        latitude: siteData.latitude,
        longitude: siteData.longitude,
        designated: siteData.designated,
        provinceOrTerritoryCode: siteData.provinceOrTerritoryCode,
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

//Function that returns All provinces and territories inside the table
function getAllProvincesAndTerritories() {
  return new Promise((resolve, reject) => {
    ProvinceOrTerritory.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        reject("Could not query all Provinces and Territories: ", err);
      });
  });
}

function editSite(id, siteData){
  return new Promise((resolve, reject) => {
    Site.update(
      {
        siteId: siteData.siteId,
        site: siteData.site,
        description: siteData.description,
        date: siteData.date,
        dateType: siteData.dateType,
        image: siteData.image,
        location: siteData.location,
        latitude: siteData.latitude,
        longitude: siteData.longitude,
        designated: siteData.designated,
        provinceOrTerritoryCode: siteData.provinceOrTerritoryCode,
      },
      {
        where: { siteId: id },
      }
    )
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
};

function deleteSite(id) {
  return new Promise((resolve, reject) => {
    console.log("in delete func" + `${id}`);
    Site.destroy({
      where: {
        siteId: id,
      },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
}

module.exports = {
  initialize,
  getAllSites,
  getSiteById,
  getSitesByProvinceOrTerritoryName,
  getSitesByRegion,
  addSite,
  getAllProvincesAndTerritories,
  editSite,
  deleteSite,
};

