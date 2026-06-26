export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as unknown as Record<string, boolean>).__TAURI__ === true
  );
}

export function useLocalStorage(): boolean {
  if (typeof window === "undefined") return false;
  return (
    isTauri() ||
    process.env.NEXT_PUBLIC_STORAGE_MODE === "local" ||
    (typeof window !== "undefined" &&
      (window as unknown as Record<string, boolean>).__TAURI_STATIC__ === true)
  );
}
