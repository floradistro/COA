// Lab employee definitions with their roles/titles
export const LAB_EMPLOYEE_ROLES = {
  'Sarah Mitchell': 'Laboratory Director',
  'Michael Minogue': 'Head Scientist',
  'K. Patel': 'Laboratory Tech'
} as const;

export type LabEmployeeName = keyof typeof LAB_EMPLOYEE_ROLES;

// Helper to get employee title by name
export const getEmployeeTitle = (employeeName: string): string => {
  return LAB_EMPLOYEE_ROLES[employeeName as LabEmployeeName] || 'Laboratory Tech';
};

// Get all employee names
export const getAllEmployeeNames = (): LabEmployeeName[] => {
  return Object.keys(LAB_EMPLOYEE_ROLES) as LabEmployeeName[];
};

