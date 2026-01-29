import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Decision extends Model {
    static associate(models) {
      this.belongsTo(models.PolicyVersion, { foreignKey: 'policy_version_id', as: 'policyVersion' });
      this.belongsTo(models.Override, { foreignKey: 'override_id', as: 'override' });
      this.belongsTo(models.Decision, { foreignKey: 'previous_decision_id', as: 'previousDecision' });
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
