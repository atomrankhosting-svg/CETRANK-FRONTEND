/** True after the admin passcode gate was unlocked this browser session. */
export function isAdminSessionUnlocked(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem("admin_unlocked") === "true";
}
