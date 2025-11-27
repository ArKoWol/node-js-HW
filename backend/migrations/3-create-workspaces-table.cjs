'use strict';

const GENERAL_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const PRODUCT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000002';
const ENGINEERING_WORKSPACE_ID = '00000000-0000-0000-0000-000000000003';

const DEFAULT_WORKSPACES = [
  {
    id: GENERAL_WORKSPACE_ID,
    name: 'General',
    slug: 'general',
    description: 'Default workspace for uncategorized articles',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: PRODUCT_WORKSPACE_ID,
    name: 'Product',
    slug: 'product',
    description: 'Articles related to product management and launches',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: ENGINEERING_WORKSPACE_ID,
    name: 'Engineering',
    slug: 'engineering',
    description: 'Engineering runbooks, RFCs, and technical updates',
    created_at: new Date(),
    updated_at: new Date()
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workspaces', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('workspaces', ['name'], {
      name: 'workspaces_name_idx'
    });

    await queryInterface.bulkInsert('workspaces', DEFAULT_WORKSPACES);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('workspaces');
  }
};

