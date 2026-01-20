import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class OverrideSignature extends Model {
    static associate(models) {
      // A Signature belongs to an Override
      this.belongsTo(models.Override, {
        foreignKey: 'override_id',
        as: 'override',
      });

      // A Signature belongs to a User (actor)
      this.belongsTo(models.User, {
        foreignKey: 'actor_id',
        as: 'actor',
      });
    }
  }

  OverrideSignature.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      override_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      actor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role_at_signing: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      justification: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [10, 5000],
        },
      },
      commit_sha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'OverrideSignature',
      tableName: 'OverrideSignatures',
      timestamps: true,
    }
  );

  return OverrideSignature;
};
