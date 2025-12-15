'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add version_id column to attachments (nullable initially for backward compatibility)
    await queryInterface.addColumn('attachments', 'version_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'article_versions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // For existing attachments, link them to version 1 of their articles
    await queryInterface.sequelize.query(`
      UPDATE attachments a
      SET version_id = (
        SELECT av.id
        FROM article_versions av
        WHERE av.article_id = a.article_id
        AND av.version_number = 1
        LIMIT 1
      )
      WHERE version_id IS NULL;
    `);

    // Add index for version_id
    await queryInterface.addIndex('attachments', ['version_id'], {
      name: 'attachments_version_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('attachments', 'attachments_version_id_idx');
    await queryInterface.removeColumn('attachments', 'version_id');
  }
};

