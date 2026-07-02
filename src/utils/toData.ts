// Strips the store's action functions, leaving only the serializable resume
// fields.
export function toData(state: ResumeStore): Data {
  return Object.fromEntries(
    Object.entries(state).filter(([, v]) => typeof v !== "function")
  ) as Data
}
