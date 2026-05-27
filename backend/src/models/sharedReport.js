import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class SharedReport extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    }
  }

  SharedReport.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      share_token: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('founder_audit', 'policy_simulation'),
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      report_html: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'SharedReport',
      tableName: 'SharedReports',
      timestamps: true,
      underscored: true,
    }
  );

  return SharedReport;
};
