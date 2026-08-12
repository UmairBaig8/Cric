export type Registration = {
  id: string;
  name: string;
  email: string;
  department: string;
  created_at: string;
};

export type RegistrationInput = Pick<Registration, 'name' | 'email' | 'department'>;
