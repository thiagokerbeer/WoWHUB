type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={`wowui-skeleton ${className}`.trim()} />;
}