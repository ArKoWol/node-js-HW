'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
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
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      author: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Anonymous'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('comments', ['article_id'], {
      name: 'comments_article_id_idx'
    });

    await queryInterface.addIndex('comments', ['workspace_id'], {
      name: 'comments_workspace_id_idx'
    });

    await queryInterface.addIndex('comments', ['created_at'], {
      name: 'comments_created_at_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comments');
  }
};

