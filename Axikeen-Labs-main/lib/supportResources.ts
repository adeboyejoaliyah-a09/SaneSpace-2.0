export type SupportResource = {
  name: string
  contact: string
  description: string
}

export const NIGERIAN_SUPPORT_RESOURCES: SupportResource[] = [
  {
    name: 'Mentally Aware Nigeria Initiative (MANI)',
    contact: '08091726902',
    description: 'Mental health support resource in Nigeria',
  },
  {
    name: 'She Writes Woman',
    contact: 'Crisis support resource',
    description: 'Mental health support and advocacy, especially for women',
  },
  {
    name: 'Nearest hospital or emergency service',
    contact: 'Local emergency contact',
    description: 'Use immediately if there is direct danger',
  },
]
