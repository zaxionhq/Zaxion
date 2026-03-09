import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class RepositoryMaintainerMapping extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Repository, { foreignKey: 'repositoryId', as: 'repository' });
    }
  }

  RepositoryMaintainerMapping.init({
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'user_id'
    },
    repositoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: 'repository_id'
    },
    githubPermissionLevel: {
      type: DataTypes.ENUM('admin', 'write'),
      allowNull: false,
      field: 'github_permission_level'
    }
  }, {
    sequelize,
    modelName: 'RepositoryMaintainerMapping',
    tableName: 'repository_maintainer_mappings',
    timestamps: true,
    underscored: true,
  });

  return RepositoryMaintainerMapping;
};
