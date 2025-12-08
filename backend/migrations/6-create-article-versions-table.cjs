'use strict';

const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "article_versions" CASCADE;');

    await queryInterface.createTable('article_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      article_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Anonymous',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('article_versions', {
      fields: ['article_id', 'version_number'],
      type: 'unique',
      name: 'article_versions_unique_per_article',
    });

    await queryInterface.addIndex('article_versions', ['article_id'], {
      name: 'article_versions_article_id_idx',
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "current_version_number" INTEGER NOT NULL DEFAULT 1;',
    );

    const [articles] = await queryInterface.sequelize.query(
      'SELECT id, title, content, author, created_at, updated_at FROM articles',
    );

    if (articles.length > 0) {
      await queryInterface.bulkInsert(
        'article_versions',
        articles.map((article) => ({
          id: randomUUID(),
          article_id: article.id,
          version_number: 1,
          title: article.title,
          content: article.content,
          author: article.author,
          created_at: article.created_at,
          updated_at: article.updated_at,
        })),
      );

      await queryInterface.sequelize.query(
        'UPDATE articles SET current_version_number = 1 WHERE current_version_number IS NULL',
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "articles" DROP COLUMN IF EXISTS "current_version_number";',
    );
    await queryInterface.removeIndex('article_versions', 'article_versions_article_id_idx').catch(() => {});
    await queryInterface.removeConstraint('article_versions', 'article_versions_unique_per_article').catch(() => {});
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "article_versions" CASCADE;');
  },
};


