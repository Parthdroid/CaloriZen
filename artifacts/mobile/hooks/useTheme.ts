import Colors from "@/constants/colors";

export function useTheme() {
  const colors = Colors.light;
  return { colors, isDark: false };
}
