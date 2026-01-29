import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PolicySimulation extends Model {
    static associate(models) {
      this.belongsTo(models.Policy, { foreignKey: 'policy_id', as: 'policy' });
      this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    }
  }

  PolicySimulation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      simulation_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Pillar 3.3: hash(draft_policy + snapshot_ids + engine_version)',
      },
      policy_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      draft_rules: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'The rules_logic of the draft policy version being simulated',
      },
      engine_version: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      sample_strategy: {
        type: DataTypes.ENUM('TIME_BASED', 'REPO_BASED', 'RISK_BASED'),
        allowNull: false,
        defaultValue: 'TIME_BASED',
      },
      sample_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      results: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Aggregated simulation results (pass rate change, newly blocked PRs, etc.)',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'PolicySimulation',
      tableName: 'PolicySimulations',
      timestamps: true,
      underscored: true,
    }
  );

  return PolicySimulation;
};
