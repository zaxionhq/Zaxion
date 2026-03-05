import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class FactSnapshot extends Model {
    static associate(models) {
      // Link snapshots to their governance decisions so simulations
      // can filter by branch or other decision metadata.
      this.hasMany(models.Decision, { foreignKey: 'fact_id', as: 'decisions' });
    }
  }

  FactSnapshot.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      repo_full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      pr_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      commit_sha: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      snapshot_version: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '1.0.0',
      },
      ingested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'FactSnapshot',
      tableName: 'fact_snapshots',
      timestamps: true,
      underscored: true,
    }
  );

  return FactSnapshot;
};
