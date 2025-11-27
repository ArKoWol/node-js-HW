'use strict';

const GENERAL_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('articles', 'workspace_id', {
      type: Sequelize.UUID,
      allowNull: false,
      defaultValue: GENERAL_WORKSPACE_ID,
      references: {
        model: 'workspaces',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    await queryInterface.addIndex('articles', ['workspace_id'], {
      name: 'articles_workspace_id_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('articles', 'articles_workspace_id_idx');
    await queryInterface.removeColumn('articles', 'workspace_id');
  }
};

