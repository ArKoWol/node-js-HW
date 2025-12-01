'use strict';

const WORKSPACES = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'General',
    slug: 'general',
    description: 'Default workspace for uncategorized articles',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Product',
    slug: 'product',
    description: 'Articles related to product management and launches',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Engineering',
    slug: 'engineering',
    description: 'Engineering runbooks, RFCs, and technical updates',
  },
];

module.exports = {
  async up(queryInterface) {
    for (const workspace of WORKSPACES) {
      await queryInterface.sequelize.query(
        `
          INSERT INTO workspaces (id, name, slug, description, created_at, updated_at)
          VALUES (:id, :name, :slug, :description, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
        `,
        {
          replacements: workspace,
        },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'workspaces',
      { id: WORKSPACES.map((workspace) => workspace.id) },
      {},
    );
  },
};

