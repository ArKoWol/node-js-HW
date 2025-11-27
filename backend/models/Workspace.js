import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Article from './Article.js';

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'workspaces',
  timestamps: true,
  underscored: true
});

Workspace.hasMany(Article, {
  foreignKey: 'workspaceId',
  as: 'articles',
  onDelete: 'RESTRICT'
});

Article.belongsTo(Workspace, {
  foreignKey: 'workspaceId',
  as: 'workspace'
});

export default Workspace;

