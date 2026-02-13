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
  Object.values(db).forEach((model) => {
    if (model && typeof model.associate === 'function') {
      model.associate(db);
    }
  });

  // ✅ Export Sequelize + models
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}
