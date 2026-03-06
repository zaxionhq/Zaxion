import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Policy extends Model {
    static associate(models) {
      // A Policy has many Versions
      this.hasMany(models.PolicyVersion, {
        foreignKey: 'policy_id',
        as: 'versions',
      });

      // Optional: user who deleted this policy (for audit)
      this.belongsTo(models.User, {
        foreignKey: 'deleted_by_user_id',
        as: 'deletedBy',
      });
    }
  }

  Policy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      scope: {
        type: DataTypes.ENUM('ORG', 'REPO'),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Identifier of the Organization or Repository (UUID or full_name)',
      },
      owning_role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed description of the policy goals',
      },
      // Soft delete + audit metadata
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deletion_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Policy',
      tableName: 'Policies',
      timestamps: true, // adds createdAt, updatedAt
    }
  );

  return Policy;
};
