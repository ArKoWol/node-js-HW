'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('articles', 'creator_id', {
      type: Sequelize.UUID,
      allowNull: true,  
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('articles', ['creator_id'], {
      name: 'articles_creator_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('articles', 'articles_creator_id_idx');
    await queryInterface.removeColumn('articles', 'creator_id');
  }
};

