import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Override extends Model {
    static associate(models) {
      // An Override belongs to a PolicyVersion
      this.belongsTo(models.PolicyVersion, {
        foreignKey: 'policy_version_id',
        as: 'policyVersion',
      });

      // An Override has many Signatures
      this.hasMany(models.OverrideSignature, {
        foreignKey: 'override_id',
        as: 'signatures',
      });
    }
  }

  Override.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      subject_ref: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'JSON containing type (PR_CHECK|POLICY_EVALUATION) and external_id',
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
    },
    {
      sequelize,
      modelName: 'Override',
      tableName: 'Overrides',
      timestamps: true,
    }
  );

  return Override;
};
