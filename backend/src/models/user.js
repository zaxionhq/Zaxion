// src/models/user.js
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.TestCase, {
        foreignKey: "userId",
        as: "testCases",
      });
      this.hasMany(models.RefreshToken, {
        foreignKey: "userId",
        as: "refreshTokens",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      githubId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      authProvider: {
        type: DataTypes.ENUM("github"),
        defaultValue: "github",
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
        allowNull: false,
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING,
        defaultValue: 'github',
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    }
  );

  return User;
};
