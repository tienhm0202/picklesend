interface AvatarProps {
  name: string;
  color?: string;
  letter?: string;
  size?: number;
}

// Generate letter from name (max 2 characters)
export function generateLetter(name: string): string {
  if (!name || name.trim() === '') return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    // Take first letter of first word and first letter of last word
    return (words[0][0] + words[words.length - 1][0]).toUpperCase().substring(0, 2);
  } else {
    // Take first 2 characters of the name
    return name.substring(0, 2).toUpperCase();
  }
}

// Default color palette
export const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#06B6D4', // cyan
];

// Get color based on name (deterministic)
export function generateColor(name: string, customColor?: string): string {
  if (customColor) return customColor;
  
  // Generate a deterministic color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % defaultColors.length;
  return defaultColors[index];
}

export default function Avatar({ name, color, letter, size = 40 }: AvatarProps) {
  const avatarColor = generateColor(name, color);
  const avatarLetter = letter || generateLetter(name);
  const fontSize = Math.floor(size * 0.4);

  return (
    <div
      className="rounded-full flex items-center justify-center text-black font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor,
        fontSize: fontSize,
        minWidth: size,
        minHeight: size,
      }}
    >
      {avatarLetter}
    </div>
  );
}

