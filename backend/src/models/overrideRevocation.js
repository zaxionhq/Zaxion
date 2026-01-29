import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class OverrideRevocation extends Model {
    static associate(models) {
      // A Revocation belongs to an Override
      this.belongsTo(models.Override, {
        foreignKey: 'override_id',
        as: 'override',
      });

      // A Revocation belongs to a User (revoker)
      this.belongsTo(models.User, {
        foreignKey: 'revoked_by_actor_id',
        as: 'revoker',
      });
    }
  }

  OverrideRevocation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      override_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      revoked_by_actor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'OverrideRevocation',
      tableName: 'OverrideRevocations',
      timestamps: true,
      underscored: true,
    }
  );

  return OverrideRevocation;
};
