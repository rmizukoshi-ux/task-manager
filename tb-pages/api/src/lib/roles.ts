export type Role = 'ADMIN' | 'UPLOADER' | 'VIEWER'

export function getRole(email: string, adminEmails: string, uploaderEmails: string): Role {
  const lower = email.toLowerCase()
  if (adminEmails.split(',').map(e => e.trim().toLowerCase()).includes(lower)) return 'ADMIN'
  if (uploaderEmails.split(',').map(e => e.trim().toLowerCase()).includes(lower)) return 'UPLOADER'
  return 'VIEWER'
}
