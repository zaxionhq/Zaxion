import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Decision extends Model {
    static associate(models) {
      this.belongsTo(models.PolicyVersion, { foreignKey: 'policy_version_id', as: 'policyVersion' });
      this.belongsTo(models.Override, { foreignKey: 'override_id', as: 'override' });
      this.belongsTo(models.Decision, { foreignKey: 'previous_decision_id', as: 'previousDecision' });
      this.belongsTo(models.FactSnapshot, { foreignKey: 'fact_id', as: 'factSnapshot' });
    }
  }

  Decision.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fact_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      result: {
        type: DataTypes.ENUM('PASS', 'BLOCK', 'WARN'),
        allowNull: false,
      },
      rationale: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      override_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      previous_decision_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      evaluation_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: 'Pillar 1.3: Deterministic evaluation hash for integrity verification',
      },
      github_check_run_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Link to the GitHub Check Run for precise PATCHing',
      },
      author_handle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pr_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      base_branch: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      risk_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      is_merged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      merged_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Decision',
      tableName: 'Decisions',
      timestamps: true,
    }
  );

  return Decision;
};
