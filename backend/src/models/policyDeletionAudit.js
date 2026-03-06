import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class PolicyDeletionAudit extends Model {
    static associate(models) {
      this.belongsTo(models.Policy, {
        foreignKey: 'policy_id',
        as: 'policy',
      });
      this.belongsTo(models.User, {
        foreignKey: 'deleted_by_user_id',
        as: 'deletedBy',
      });
    }
  }

  PolicyDeletionAudit.init(
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
      deleted_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletion_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      policy_name_snapshot: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      policy_rules_count_snapshot: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      decisions_count_snapshot: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      violations_count_snapshot: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'PolicyDeletionAudit',
      tableName: 'PolicyDeletionAudits',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['policy_id'],
        },
        {
          fields: ['deleted_by_user_id'],
        },
      ],
    }
  );

  return PolicyDeletionAudit;
};

