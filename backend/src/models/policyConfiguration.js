import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PolicyConfiguration extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  PolicyConfiguration.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      policy_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'The ID of the core policy (e.g., SEC-001)',
      },
      scope: {
        type: DataTypes.ENUM('GLOBAL', 'ORG', 'REPO', 'BRANCH'),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Target identifier: Org name, Repo full_name, or repo_full_name:branch_name. Null for GLOBAL.',
      },
      is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who performed the action',
      },
    },
    {
      sequelize,
      modelName: 'PolicyConfiguration',
      tableName: 'PolicyConfigurations',
      timestamps: true,
    }
  );

  return PolicyConfiguration;
};
