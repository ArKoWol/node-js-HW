import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Attachment from './Attachment.js';

const ArticleVersion = sequelize.define('ArticleVersion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  articleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'article_id',
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'version_number',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Anonymous',
  },
}, {
  tableName: 'article_versions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['article_id'],
    },
    {
      unique: true,
      fields: ['article_id', 'version_number'],
    },
  ],
});

export default ArticleVersion;


