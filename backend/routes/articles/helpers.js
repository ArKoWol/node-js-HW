export const formatWorkspace = (workspace) =>
  workspace
    ? {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
      }
    : null;

export const formatComment = (comment) => ({
  id: comment.id,
  author: comment.author,
  content: comment.content,
  userId: comment.userId,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const formatVersionMetadata = (version) => ({
  id: version.id,
  versionNumber: version.versionNumber,
  title: version.title,
  author: version.author,
  createdAt: version.createdAt,
});

