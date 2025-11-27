import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Article from './Article.js';
import Workspace from './Workspace.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  articleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'article_id'
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'workspace_id'
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Anonymous'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Comment content is required'
      }
    }
  }
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true
});

Article.hasMany(Comment, {
  foreignKey: 'articleId',
  as: 'comments',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Article, {
  foreignKey: 'articleId',
  as: 'article'
});

Workspace.hasMany(Comment, {
  foreignKey: 'workspaceId',
  as: 'comments',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Workspace, {
  foreignKey: 'workspaceId',
  as: 'workspace'
});

export default Comment;

