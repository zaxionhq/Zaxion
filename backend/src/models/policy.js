import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Policy extends Model {
    static associate(models) {
      // A Policy has many Versions
      this.hasMany(models.PolicyVersion, {
        foreignKey: 'policy_id',
        as: 'versions',
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
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'UUID of the Organization or Repository',
      },
      owning_role: {
        type: DataTypes.STRING,
        allowNull: false,
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
