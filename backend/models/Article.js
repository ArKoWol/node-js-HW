import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Attachment from './Attachment.js';

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title is required and must be a non-empty string'
      },
      len: {
        args: [1, 200],
        msg: 'Title must be between 1 and 200 characters'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Content is required and must be a non-empty string'
      },
      len: {
        args: [1, 1000000],
        msg: 'Content must be between 1 and 1,000,000 characters'
      }
    }
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Anonymous'
  },
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

export default Article;

