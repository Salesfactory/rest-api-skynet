const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const sequelize = require('../config/database');
const db = { Sequelize, sequelize };

const onlyModels = file =>
  file.indexOf('.') !== 0 &&
  file !== basename &&
  file.slice(-3) === '.js';

const importModel = file => {
  const modelPath = path.join(__dirname, file);
  const model = require(modelPath)(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
};

const associate = modelName => {
  if (typeof db[modelName].associate === 'function')
    db[modelName].associate(db);
};

fs.readdirSync(__dirname)
  .filter(onlyModels)
  .forEach(importModel);

Object.keys(db).forEach(associate);

// this file reads all models in the current directory and imports them into the db object.
module.exports = db;