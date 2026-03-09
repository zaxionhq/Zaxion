import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class AuditEvent extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
      // target_id is generic, so not strictly a FK to a single table
    }
  }

  AuditEvent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'event_type'
    },
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'actor_id'
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'target_id'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'AuditEvent',
    tableName: 'audit_events',
    timestamps: true,
    underscored: true,
  });

  return AuditEvent;
};
