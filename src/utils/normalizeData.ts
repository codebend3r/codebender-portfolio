type LegacyContact = {
  email?: string
  phone?: string
  location?: string
  github?: string
  linkedin?: string
}

const LEGACY_CONTACT_ORDER: [keyof LegacyContact, string][] = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["location", "Location"],
  ["github", "GitHub"],
  ["linkedin", "LinkedIn"],
]

// Variations saved before the contact-list migration store `contact` as a
// keyed object; convert it to the ordered entry list the app now expects.
export function normalizeData(data: Data): Data {
  if (Array.isArray(data.contact)) return data
  const legacy = data.contact as unknown as LegacyContact
  const contact: ContactEntry[] = []
  for (const [key, label] of LEGACY_CONTACT_ORDER) {
    const value = legacy[key]
    if (value) contact.push({ label, value })
  }
  return { ...data, contact }
}
