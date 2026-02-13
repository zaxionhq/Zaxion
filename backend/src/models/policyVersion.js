import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PolicyVersion extends Model {
    static associate(models) {
      // A PolicyVersion belongs to a Policy
      this.belongsTo(models.Policy, {
        foreignKey: 'policy_id',
        as: 'policy',
      });

      // A PolicyVersion belongs to a User (creator)
      this.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
      });
    }
  }

  PolicyVersion.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      policy_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      enforcement_level: {
        type: DataTypes.ENUM('MANDATORY', 'OVERRIDABLE', 'ADVISORY'),
        allowNull: false,
      },
      rules_logic: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description of changes in this version',
      },
    },
    {
      sequelize,
      modelName: 'PolicyVersion',
      tableName: 'PolicyVersions',
      timestamps: true, // adds createdAt, updatedAt
      indexes: [
        {
          unique: true,
          fields: ['policy_id', 'version_number'],
        },
      ],
    }
  );

  return PolicyVersion;
};
