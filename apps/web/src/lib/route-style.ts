export function getRouteStyle(route: string) {
  switch (route) {
    case "Red":
      return {
        badge: "bg-rose-600 text-white",
        glow: "shadow-[0_20px_60px_rgba(225,29,72,0.18)]"
      };
    case "Blue":
      return {
        badge: "bg-blue-600 text-white",
        glow: "shadow-[0_20px_60px_rgba(37,99,235,0.18)]"
      };
    case "Brown":
      return {
        badge: "bg-amber-700 text-white",
        glow: "shadow-[0_20px_60px_rgba(180,83,9,0.18)]"
      };
    default:
      return {
        badge: "bg-slate-800 text-white",
        glow: "shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      };
  }
}
