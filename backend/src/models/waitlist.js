// src/models/waitlist.js
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Waitlist extends Model {
    static associate(models) {
      // No associations needed for now
    }
  }

  Waitlist.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      status: {
        type: DataTypes.ENUM("PENDING", "VERIFIED", "UNSUBSCRIBED", "SENT"),
        defaultValue: "PENDING",
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Waitlist",
      tableName: "Waitlist",
      timestamps: true,
    }
  );

  return Waitlist;
};
