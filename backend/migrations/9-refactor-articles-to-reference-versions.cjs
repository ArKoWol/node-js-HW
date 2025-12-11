'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Make title, content, and author nullable since they'll come from versions
    // We keep them for backward compatibility but they should be read from versions
    await queryInterface.changeColumn('articles', 'title', {
      type: Sequelize.STRING(200),
      allowNull: true
    });

    await queryInterface.changeColumn('articles', 'content', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.changeColumn('articles', 'author', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null
    });

    // Ensure all articles have a version 1 if they don't already
    await queryInterface.sequelize.query(`
      INSERT INTO article_versions (id, article_id, version_number, title, content, author, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        a.id,
        1,
        a.title,
        a.content,
        a.author,
        a.created_at,
        a.updated_at
      FROM articles a
      WHERE NOT EXISTS (
        SELECT 1 FROM article_versions av 
        WHERE av.article_id = a.id AND av.version_number = 1
      )
      AND a.title IS NOT NULL;
    `);

    // Ensure current_version_number is set for all articles
    await queryInterface.sequelize.query(`
      UPDATE articles
      SET current_version_number = 1
      WHERE current_version_number IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Restore non-nullable constraints
    await queryInterface.changeColumn('articles', 'title', {
      type: Sequelize.STRING(200),
      allowNull: false
    });

    await queryInterface.changeColumn('articles', 'content', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    await queryInterface.changeColumn('articles', 'author', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Anonymous'
    });
  }
};

