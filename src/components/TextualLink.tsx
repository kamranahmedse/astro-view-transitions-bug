type TextualLinkProps = {
  href: string;
  text: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
};

export function TextualLink(props: TextualLinkProps) {
  const { href, text, target = '_blank' } = props;

  return (
    <a
      href={href}
      className="font-medium underline decoration-2 underline-offset-2 transition-colors hover:text-zinc-200"
      target={target}
    >
      {text}
    </a>
  );
}
