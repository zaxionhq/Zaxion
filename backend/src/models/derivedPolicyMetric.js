import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class DerivedPolicyMetric extends Model {
    static associate(models) {
      this.belongsTo(models.Policy, { foreignKey: 'policy_id', as: 'policy' });
      this.belongsTo(models.PolicyVersion, { foreignKey: 'version_id', as: 'policyVersion' });
    }
  }

  DerivedPolicyMetric.init(
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
      version_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      total_evaluations: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_blocks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_overrides: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      policy_challenge_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'DerivedPolicyMetric',
      tableName: 'DerivedPolicyMetrics',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['policy_id', 'version_id'],
        },
      ],
    }
  );

  return DerivedPolicyMetric;
};
