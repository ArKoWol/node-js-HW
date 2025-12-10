import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Attachment from './Attachment.js';
import ArticleVersion from './ArticleVersion.js';

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    // Title should come from the current version, kept here for backward compatibility
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    // Content should come from the current version, kept here for backward compatibility
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    // Author should come from the current version, kept here for backward compatibility
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'workspace_id'
  },
  currentVersionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'current_version_number',
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'articles',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['created_at']
    },
    {
      fields: ['title']
    },
    {
      fields: ['workspace_id']
    }
  ]
});

Article.hasMany(Attachment, {
  foreignKey: 'articleId',
  as: 'attachments',
  onDelete: 'CASCADE'
});

Attachment.belongsTo(Article, {
  foreignKey: 'articleId',
  as: 'article'
});

Article.hasMany(ArticleVersion, {
  foreignKey: 'articleId',
  as: 'versions',
  onDelete: 'CASCADE'
});

ArticleVersion.belongsTo(Article, {
  foreignKey: 'articleId',
  as: 'article'
});

export default Article;

