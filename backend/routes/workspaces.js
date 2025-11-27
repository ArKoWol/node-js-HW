import express from 'express';
import { fn, col } from 'sequelize';
import Workspace from '../models/Workspace.js';
import Article from '../models/Article.js';

const router = express.Router();

const toSlug = (value) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const formatWorkspaceResponse = (workspace, articleCount = 0) => ({
  id: workspace.id,
  name: workspace.name,
  slug: workspace.slug,
  description: workspace.description,
  articleCount
});

router.get('/', async (req, res, next) => {
  try {
    const [workspaces, articleCounts] = await Promise.all([
      Workspace.findAll({ order: [['name', 'ASC']] }),
      Article.findAll({
        attributes: ['workspaceId', [fn('COUNT', col('id')), 'count']],
        group: ['workspaceId'],
        raw: true
      })
    ]);

    const countMap = articleCounts.reduce((acc, record) => {
      const workspaceId = record.workspaceId;
      if (workspaceId) {
        acc[workspaceId] = Number(record.count);
      }
      return acc;
    }, {});

    res.json({
      success: true,
      workspaces: workspaces.map((workspace) => formatWorkspaceResponse(
        workspace,
        countMap[workspace.id] || 0
      ))
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, slug } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Name is required and must be a non-empty string'],
        status: 400
      });
    }

    let normalizedSlug = typeof slug === 'string' && slug.trim().length > 0
      ? toSlug(slug)
      : toSlug(name);

    if (!normalizedSlug) {
      normalizedSlug = `workspace-${Date.now().toString(36)}`;
    }

    let slugCandidate = normalizedSlug;
    let suffix = 1;

    while (await Workspace.findOne({ where: { slug: slugCandidate } })) {
      slugCandidate = `${normalizedSlug}-${suffix}`;
      suffix += 1;
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim() || null,
      slug: slugCandidate
    });

    res.status(201).json({
      success: true,
      workspace: formatWorkspaceResponse(workspace, 0)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, slug } = req.body;

    const workspace = await Workspace.findByPk(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
        status: 404
      });
    }

    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Name must be a non-empty string if provided'],
        status: 400
      });
    }

    const updates = {};

    if (name) {
      updates.name = name.trim();
    }

    if (typeof description === 'string') {
      updates.description = description.trim();
    }

    if (slug) {
      const normalizedSlug = toSlug(slug);
      if (!normalizedSlug) {
        return res.status(400).json({
          success: false,
          error: 'Slug cannot be empty',
          status: 400
        });
      }
      const existing = await Workspace.findOne({
        where: { slug: normalizedSlug },
        attributes: ['id']
      });

      if (existing && existing.id !== workspace.id) {
        return res.status(409).json({
          success: false,
          error: 'Slug already in use',
          status: 409
        });
      }

      updates.slug = normalizedSlug;
    }

    await workspace.update(updates);

    const articleCount = await Article.count({ where: { workspaceId: workspace.id } });

    res.json({
      success: true,
      workspace: formatWorkspaceResponse(workspace, articleCount)
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findByPk(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found',
        status: 404
      });
    }

    const articleCount = await Article.count({ where: { workspaceId: id } });

    if (articleCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Workspace cannot be deleted while it still has articles',
        status: 400
      });
    }

    await workspace.destroy();

    res.json({
      success: true,
      message: 'Workspace deleted successfully',
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
});

export default router;

