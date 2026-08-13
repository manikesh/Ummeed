import { supabase } from './supabase';
import type { Profile } from './types';

export function isPatientProfileComplete(profile: Profile): boolean {
  return !!(
    profile.full_name?.trim()
    && profile.phone?.trim()
    && profile.age
    && profile.gender?.trim()
    && profile.city?.trim()
    && profile.avatar_path?.trim()
  );
}

export async function getPatientOnboardingStatus(profile: Profile) {
  if (profile.role !== 'patient') {
    return { hasIncident: false, hasMedicalRecord: false, isComplete: false };
  }

  const [incidentRes, recordRes] = await Promise.all([
    supabase.from('burn_incidents').select('id').eq('patient_id', profile.id).limit(1),
    supabase.from('medical_records').select('id').eq('patient_id', profile.id).limit(1),
  ]);

  if (incidentRes.error) throw incidentRes.error;
  if (recordRes.error) throw recordRes.error;

  const hasIncident = (incidentRes.data?.length ?? 0) > 0;
  const hasMedicalRecord = (recordRes.data?.length ?? 0) > 0;

  return {
    hasIncident,
    hasMedicalRecord,
    isComplete: isPatientProfileComplete(profile) && hasIncident && hasMedicalRecord,
  };
}
