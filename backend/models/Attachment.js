import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Attachment = sequelize.define('Attachment', {
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
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mime_type'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  data: {
    type: DataTypes.BLOB('long'),
    allowNull: false
  }
}, {
  tableName: 'attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Attachment;

