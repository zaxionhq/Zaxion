// backend/src/models/refreshToken.js

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Hashed token should be unique
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID, // Changed from INTEGER to UUID
      references: {
        model: 'users', // Changed from 'Users' to 'users' to match table name
        key: 'id',
      },
      allowNull: false,
    },
  });

  // Class method to create a new refresh token
  RefreshToken.createToken = async function (user, tokenValue, expiresAt) {
    return this.create({
      token: tokenValue, // Store the hashed token
      userId: user.id,
      expiresAt,
    });
  };

  return RefreshToken;
};

