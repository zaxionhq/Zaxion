// src/models/testCaseModel.js
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class TestCase extends Model {
    static associate(models) {
      // Belongs to one user
      this.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  TestCase.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      steps: {
        type: DataTypes.JSON, // store array of steps
        allowNull: false,
      },
      expectedResult: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "TestCase",
      tableName: "test_cases",
      timestamps: true,
    }
  );

  return TestCase;
};
