import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class GovernanceSignal extends Model {
    static associate(models) {
      // Signals are loosely coupled to targets (Org, Repo, Team) via target_id
    }
  }

  GovernanceSignal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('BYPASS_VELOCITY', 'POLICY_DRIFT', 'COMPLIANCE_GAP'),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Identifier of the target (Org UUID, Repo full_name, etc.)',
      },
      signal_level: {
        type: DataTypes.ENUM('INFO', 'ATTENTION', 'ANOMALY'),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'GovernanceSignal',
      tableName: 'GovernanceSignals',
      timestamps: true,
    }
  );

  return GovernanceSignal;
};
