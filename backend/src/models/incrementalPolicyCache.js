export default (sequelize, DataTypes) => {
  const IncrementalPolicyCache = sequelize.define(
    'IncrementalPolicyCache',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cache_key: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true,
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      engine_version: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'incr-v1',
      },
      expires_at: DataTypes.DATE,
    },
    {
      tableName: 'incremental_policy_cache',
      underscored: true,
      timestamps: true,
    }
  );
  return IncrementalPolicyCache;
};
