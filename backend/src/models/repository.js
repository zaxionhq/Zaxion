import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Repository extends Model {
    static associate(models) {
      this.hasMany(models.RepositoryMaintainerMapping, {
        foreignKey: 'repositoryId',
        as: 'maintainers'
      });
      // Can associate with policies, decisions, etc. later
    }
  }

  Repository.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    githubRepoId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'github_repo_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    installationId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'installation_id'
    }
  }, {
    sequelize,
    modelName: 'Repository',
    tableName: 'repositories',
    timestamps: true,
    underscored: true,
  });

  return Repository;
};
