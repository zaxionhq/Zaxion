import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Override extends Model {
    static associate(models) {
      // An Override belongs to a PolicyVersion
      this.belongsTo(models.PolicyVersion, {
        foreignKey: 'policy_version_id',
        as: 'policyVersion',
      });

      // An Override belongs to a Decision
      this.belongsTo(models.Decision, {
        foreignKey: 'decision_id',
        as: 'decision',
      });

      // An Override has many Signatures
      this.hasMany(models.OverrideSignature, {
        foreignKey: 'override_id',
        as: 'signatures',
      });

      // An Override can have one Revocation
      this.hasOne(models.OverrideRevocation, {
        foreignKey: 'override_id',
        as: 'revocation',
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
      decision_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Link to the canonical Governance Record being overridden',
      },
      policy_version_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      evaluation_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Cryptographic binding to the exact code/policy state',
      },
      target_sha: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Scope confinement: only valid for this commit SHA',
      },
      category: {
        type: DataTypes.ENUM('EMERGENCY_HOTFIX', 'FALSE_POSITIVE', 'LEGACY_CODE', 'BUSINESS_EXCEPTION'),
        allowNull: false,
        defaultValue: 'BUSINESS_EXCEPTION',
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED'),
        allowNull: false,
        defaultValue: 'APPROVED',
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Temporal expiry for governance safety',
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
