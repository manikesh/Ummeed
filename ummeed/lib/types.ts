export type AppRole =
  | 'patient'
  | 'doctor'
  | 'ngo'
  | 'counselor'
  | 'legal_aid'
  | 'volunteer'
  | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  city: string | null;
  state: string | null;
  verification_status: VerificationStatus;
  age: number | null;
  gender: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  license_number: string | null;
  specialization: string | null;
  hospital_id: string | null;
  organization_name: string | null;
  registration_number: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  has_burn_unit: boolean;
  is_active: boolean;
}

export interface BurnIncident {
  id: string;
  patient_id: string;
  incident_date: string | null;
  burn_type: string | null;
  body_part: string | null;
  severity: string | null;
  description: string | null;
  location: string | null;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  created_by: string | null;
  title: string;
  notes: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Connection {
  id: string;
  patient_id: string;
  provider_id: string;
  message: string | null;
  status: ConnectionStatus;
  created_at: string;
}

export interface ContentItem {
  id: string;
  category: 'first_aid' | 'remedy' | 'news' | 'scheme' | 'helpline' | 'video';
  title: string;
  body: string | null;
  url: string | null;
  phone: string | null;
  is_published: boolean;
  created_at: string;
}
