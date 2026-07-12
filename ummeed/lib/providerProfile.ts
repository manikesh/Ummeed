import type { AppRole, Profile } from './types';

export const PROVIDER_ROLES: AppRole[] = ['doctor', 'ngo', 'counselor', 'legal_aid', 'volunteer'];

export function isProviderRole(role: AppRole): boolean {
  return PROVIDER_ROLES.includes(role);
}

export function getProviderProfileMissingFields(profile: Profile): string[] {
  const missing: string[] = [];
  if (!profile.full_name?.trim()) missing.push('full name');
  if (!profile.phone?.trim()) missing.push('mobile number');
  if (!profile.organization_name?.trim()) {
    missing.push(profile.role === 'doctor' ? 'hospital or clinic name' : 'organisation name');
  }
  if (profile.role === 'doctor') {
    if (!profile.license_number?.trim()) missing.push('medical license number');
    if (!profile.specialization?.trim()) missing.push('specialization');
  } else if (!profile.registration_number?.trim()) {
    missing.push('registration or certification number');
  }
  if (!profile.address?.trim()) missing.push('address');
  if (!profile.city?.trim()) missing.push('city');
  if (!profile.state?.trim()) missing.push('state');
  return missing;
}

export function isProviderProfileComplete(profile: Profile): boolean {
  return getProviderProfileMissingFields(profile).length === 0;
}
