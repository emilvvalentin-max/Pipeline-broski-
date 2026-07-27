export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Burning the midnight oil, champ!";
  if (hour < 12) return "Good morning, champ!";
  if (hour < 18) return "Good afternoon, champ!";
  return "Good evening, champ!";
}
