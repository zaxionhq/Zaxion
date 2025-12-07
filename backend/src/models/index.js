// src/models/index.js

import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";
import sequelize from "../config/sequelize.js";

// emulate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// keep Sequelize symbol local for model definitions
const SequelizeLib = Sequelize;

// ✅ Object to hold all models
const db = {};

export async function initDb() {
  // ✅ Dynamically import all model files
  const modelsDir = __dirname;
  const files = fs.readdirSync(modelsDir).filter(
    (file) => file !== "index.js" && file.endsWith(".js")
  );

  for (const file of files) {
    const modelPath = path.join(modelsDir, file);
    const modelFileUrl = pathToFileURL(modelPath).href;

    const { default: modelImport } = await import(modelFileUrl);

    // ✅ Pass both sequelize instance & DataTypes
    const model = modelImport(sequelize, SequelizeLib.DataTypes);
    db[model.name] = model;
  }

  // ✅ Set up associations
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  // Explicitly define associations here if not handled in model's associate method
  if (!db.User.associations.refreshTokens) { // Prevent re-adding if hot-reloading
    db.User.hasMany(db.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
  }
  if (!db.RefreshToken.associations.User) { // Prevent re-adding if hot-reloading
    db.RefreshToken.belongsTo(db.User, { foreignKey: 'userId' });
  }

  // ✅ Export Sequelize + models
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}
