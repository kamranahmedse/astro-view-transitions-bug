export type MarkdownFileType<F> = {
  file: string;
  frontmatter: F;
  rawContent: any;
  Content: any;
  default: any;
  compiledContent: any;
  getHeadings: () => [{ depth: number; text: string; slug: string }];
  getHeaders: () => [{ depth: number; text: string; slug: string }];
};
