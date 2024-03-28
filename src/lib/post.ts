import type { MarkdownFileType } from './file';

export type PostFrontmatter = {
  title: string;
  description: string;
  externalUrl?: string;
  seo: {
    title: string;
    description: string;
  };
  isNew: boolean;
  isDraft: boolean;
  type: 'textual' | 'graphical' | 'video';
  tags: string[];
  date: string;
};

export interface Post extends MarkdownFileType<PostFrontmatter> {
  slug: string;
}

export async function getPostsByTag(tagText: string): Promise<Post[]> {
  const posts = await getAllPosts();

  return posts.filter((post) => post.frontmatter.tags.includes(tagText));
}

export async function getAllPosts(): Promise<Post[]> {
  const posts = import.meta.glob<MarkdownFileType<PostFrontmatter>>(
    '../posts/**/*.md',
    {
      eager: true,
    },
  );

  return Object.keys(posts)
    .sort((a, b) => {
      const postA = posts[a];
      const postB = posts[b];

      const secondDate = new Date(postB.frontmatter.date).valueOf();
      const firstDate = new Date(postA.frontmatter.date).valueOf();

      return secondDate - firstDate;
    })
    .filter((path) => !posts[path].frontmatter.isDraft)
    .map((path) => {
      const slug = path.replace('../posts/', '').replace('.md', '');
      const data = posts[path] || {};
      return {
        slug,
        ...data,
      };
    });
}
