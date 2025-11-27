'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      article_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      data: {
        type: Sequelize.BLOB('long'),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('attachments', ['article_id'], {
      name: 'attachments_article_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attachments');
  }
};

