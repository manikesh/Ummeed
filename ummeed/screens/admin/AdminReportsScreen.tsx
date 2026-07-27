import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { supabase } from '../../lib/supabase';
import type { BurnIncident, Connection, ContentItem, Hospital, MedicalRecord, Profile } from '../../lib/types';
import { colors, font, radius, spacing } from '../../theme';

type ReportTab = 'overview' | 'patients' | 'providers' | 'hospitals' | 'activity' | 'content';
type HospitalReport = Hospital & { created_at?: string; updated_at?: string };
type Summary = {
  patients: number;
  providers: number;
  hospitals: number;
  burnIncidents: number;
  records: number;
  pendingApprovals: number;
  pendingContent: number;
};

interface ReportData {
  profiles: Profile[];
  hospitals: HospitalReport[];
  incidents: BurnIncident[];
  records: MedicalRecord[];
  content: ContentItem[];
  connections: Connection[];
}

interface ActivityItem {
  id: string;
  at: string;
  title: string;
  detail: string;
  searchable: string;
}

type TableColumn<T> = {
  key: string;
  label: string;
  width?: number;
  render: (item: T) => React.ReactNode;
};

const PROVIDER_ROLES = ['doctor', 'ngo', 'counselor', 'legal_aid', 'volunteer'];
const TABS: { key: ReportTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'providers', label: 'Providers' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'activity', label: 'Activity' },
  { key: 'content', label: 'Content' },
];

const emptyData: ReportData = {
  profiles: [],
  hospitals: [],
  incidents: [],
  records: [],
  content: [],
  connections: [],
};

const roleLabel = (role: string) => role.replace('_', ' ');
const compactDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : 'No date');
const joinText = (...parts: Array<string | number | null | undefined>) => parts.filter(Boolean).join(' ');
const includesSearch = (text: string, search: string) => text.toLowerCase().includes(search.trim().toLowerCase());
const fallback = (value?: string | number | null) => (value || value === 0 ? String(value) : '-');
const locationText = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join(', ') || '-';

export function AdminReportsScreen() {
  const [data, setData] = useState<ReportData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<ReportTab>('overview');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [profilesRes, hospitalsRes, incidentsRes, recordsRes, contentRes, connectionsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('hospitals').select('*').order('name', { ascending: true }),
      supabase.from('burn_incidents').select('*').order('created_at', { ascending: false }),
      supabase.from('medical_records').select('*').order('created_at', { ascending: false }),
      supabase.from('content_items').select('*').order('created_at', { ascending: false }),
      supabase.from('connections').select('*').order('created_at', { ascending: false }),
    ]);

    setLoading(false);
    const error = profilesRes.error || hospitalsRes.error || incidentsRes.error || recordsRes.error || contentRes.error || connectionsRes.error;
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }

    setData({
      profiles: (profilesRes.data as Profile[]) ?? [],
      hospitals: (hospitalsRes.data as HospitalReport[]) ?? [],
      incidents: (incidentsRes.data as BurnIncident[]) ?? [],
      records: (recordsRes.data as MedicalRecord[]) ?? [],
      content: (contentRes.data as ContentItem[]) ?? [],
      connections: (connectionsRes.data as Connection[]) ?? [],
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const profileById = useMemo(() => new Map(data.profiles.map((p) => [p.id, p])), [data.profiles]);
  const patients = useMemo(() => data.profiles.filter((p) => p.role === 'patient'), [data.profiles]);
  const providers = useMemo(() => data.profiles.filter((p) => PROVIDER_ROLES.includes(p.role)), [data.profiles]);

  const summary = useMemo(() => ({
    patients: patients.length,
    providers: providers.length,
    hospitals: data.hospitals.length,
    burnIncidents: data.incidents.length,
    records: data.records.length,
    pendingApprovals: providers.filter((p) => p.verification_status === 'pending').length,
    pendingContent: data.content.filter((c) => !c.is_published).length,
  }), [data, patients, providers]);

  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    data.incidents.forEach((it) => {
      const patient = profileById.get(it.patient_id);
      const name = patient?.full_name || 'Patient';
      items.push({
        id: `incident-${it.id}`,
        at: it.created_at,
        title: 'Burn incident reported',
        detail: `${name} - ${[it.burn_type, it.severity, it.location].filter(Boolean).join(', ') || 'Incident details added'}`,
        searchable: joinText(name, patient?.phone, it.burn_type, it.severity, it.location),
      });
    });

    data.records.forEach((r) => {
      const patient = profileById.get(r.patient_id);
      const uploader = r.created_by ? profileById.get(r.created_by) : null;
      items.push({
        id: `record-${r.id}`,
        at: r.created_at,
        title: 'Medical record uploaded',
        detail: `${patient?.full_name || 'Patient'} - ${r.title}${uploader ? ` by ${uploader.full_name || roleLabel(uploader.role)}` : ''}`,
        searchable: joinText(patient?.full_name, patient?.phone, uploader?.full_name, r.title, r.mime_type),
      });
    });

    data.content.forEach((c) => {
      const creator = c.created_by ? profileById.get(c.created_by) : null;
      items.push({
        id: `content-${c.id}`,
        at: c.created_at,
        title: c.is_published ? 'Content published' : 'Content pending review',
        detail: `${c.title} - ${c.category.replace('_', ' ')}${creator ? ` by ${creator.full_name || creator.organization_name || roleLabel(creator.role)}` : ''}`,
        searchable: joinText(c.title, c.category, creator?.full_name, creator?.organization_name, creator?.role),
      });
    });

    data.connections.forEach((c) => {
      const patient = profileById.get(c.patient_id);
      const provider = profileById.get(c.provider_id);
      items.push({
        id: `connection-${c.id}`,
        at: c.created_at,
        title: `Connection ${c.status}`,
        detail: `${patient?.full_name || 'Patient'} -> ${provider?.organization_name || provider?.full_name || 'Provider'}`,
        searchable: joinText(patient?.full_name, provider?.full_name, provider?.organization_name, c.status),
      });
    });

    data.profiles.forEach((p) => {
      items.push({
        id: `profile-${p.id}`,
        at: p.created_at,
        title: `${roleLabel(p.role)} profile created`,
        detail: `${p.organization_name || p.full_name || 'User'} - ${p.verification_status}`,
        searchable: joinText(p.full_name, p.organization_name, p.phone, p.city, p.state, p.role, p.verification_status),
      });
    });

    data.hospitals.forEach((h) => {
      items.push({
        id: `hospital-${h.id}`,
        at: h.created_at ?? '',
        title: 'Hospital added',
        detail: `${h.name} - ${[h.city, h.state].filter(Boolean).join(', ') || 'Location not set'}`,
        searchable: joinText(h.name, h.city, h.state, h.phone),
      });
    });

    return items
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [data, profileById]);

  const q = search.trim();
  const filteredPatients = patients.filter((p) => !q || includesSearch(joinText(p.full_name, p.phone, p.city, p.state, p.gender), q));
  const filteredProviders = providers.filter((p) => !q || includesSearch(joinText(p.full_name, p.organization_name, p.phone, p.city, p.state, p.role, p.verification_status), q));
  const filteredHospitals = data.hospitals.filter((h) => !q || includesSearch(joinText(h.name, h.city, h.state, h.phone, h.address), q));
  const filteredContent = data.content.filter((c) => {
    const creator = c.created_by ? profileById.get(c.created_by) : null;
    return !q || includesSearch(joinText(c.title, c.category, creator?.full_name, creator?.organization_name, creator?.role), q);
  });
  const filteredActivity = activity.filter((a) => !q || includesSearch(`${a.title} ${a.detail} ${a.searchable}`, q)).slice(0, 40);

  return (
    <Screen title="Admin reports" subtitle="A simple system-wide view of people, care activity and content.">
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Input label="Search reports" value={search} onChangeText={setSearch} placeholder="Name, phone, city, content..." testID="ar-search" />
        </View>
        <View style={styles.refreshWrap}>
          <Button title="Refresh" onPress={load} loading={loading} variant="ghost" testID="ar-refresh" />
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            title={t.label}
            fullWidth={false}
            variant={tab === t.key ? 'primary' : 'ghost'}
            style={styles.tabButton}
            onPress={() => setTab(t.key)}
            testID={`ar-tab-${t.key}`}
          />
        ))}
      </View>

      {tab === 'overview' ? <Overview summary={summary} activity={filteredActivity} /> : null}
      {tab === 'patients' ? <PatientsReport patients={filteredPatients} incidents={data.incidents} records={data.records} /> : null}
      {tab === 'providers' ? <ProvidersReport providers={filteredProviders} content={data.content} connections={data.connections} /> : null}
      {tab === 'hospitals' ? <HospitalsReport hospitals={filteredHospitals} /> : null}
      {tab === 'activity' ? <ActivityReport activity={filteredActivity} /> : null}
      {tab === 'content' ? <ContentReport content={filteredContent} profileById={profileById} /> : null}
    </Screen>
  );
}

function Overview({ summary, activity }: { summary: Summary; activity: ActivityItem[] }) {
  return (
    <View>
      <View style={styles.summaryGrid}>
        <SummaryTile label="Patients" value={summary.patients} />
        <SummaryTile label="Providers" value={summary.providers} />
        <SummaryTile label="Hospitals" value={summary.hospitals} />
        <SummaryTile label="Burn incidents" value={summary.burnIncidents} />
        <SummaryTile label="Medical records" value={summary.records} />
        <SummaryTile label="Pending approvals" value={summary.pendingApprovals} tone="warning" />
        <SummaryTile label="Content review" value={summary.pendingContent} tone="warning" />
      </View>
      <Text style={styles.section}>Latest activity</Text>
      <ActivityReport activity={activity.slice(0, 8)} compact />
    </View>
  );
}

function SummaryTile({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' }) {
  return (
    <View style={[styles.summaryTile, tone === 'warning' ? styles.summaryTileWarning : null]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function PatientsReport({ patients, incidents, records }: { patients: Profile[]; incidents: BurnIncident[]; records: MedicalRecord[] }) {
  const patientRows = patients.map((p) => {
    const incidentCount = incidents.filter((i) => i.patient_id === p.id).length;
    const recordCount = records.filter((r) => r.patient_id === p.id).length;
    return { ...p, incidentCount, recordCount };
  });

  return (
    <ReportSection title={`Patients (${patients.length})`} empty="No patients match this search.">
      <DataTable
        data={patientRows}
        testIDPrefix="ar-patient"
        columns={[
          { key: 'name', label: 'Name', width: 180, render: (p) => fallback(p.full_name || 'Patient') },
          { key: 'phone', label: 'Phone number', width: 150, render: (p) => fallback(p.phone) },
          { key: 'location', label: 'Location', width: 180, render: (p) => locationText(p.city, p.state) },
          { key: 'incidents', label: 'Incidents', width: 140, render: (p) => String(p.incidentCount) },
        ]}
      />
    </ReportSection>
  );
}

function ProvidersReport({ providers, content, connections }: { providers: Profile[]; content: ContentItem[]; connections: Connection[] }) {
  const providerRows = providers.map((p) => {
    const contentCount = content.filter((c) => c.created_by === p.id).length;
    const connectionCount = connections.filter((c) => c.provider_id === p.id).length;
    return { ...p, contentCount, connectionCount };
  });

  return (
    <ReportSection title={`Providers (${providers.length})`} empty="No providers match this search.">
      <DataTable
        data={providerRows}
        testIDPrefix="ar-provider"
        columns={[
          { key: 'name', label: 'Name', width: 190, render: (p) => fallback(p.organization_name || p.full_name || roleLabel(p.role)) },
          { key: 'service', label: 'Service type', width: 150, render: (p) => roleLabel(p.role) },
          { key: 'contact', label: 'Contact', width: 160, render: (p) => fallback(p.phone || p.full_name) },
          { key: 'location', label: 'Location', width: 180, render: (p) => locationText(p.city, p.state) },
        ]}
      />
    </ReportSection>
  );
}

function HospitalsReport({ hospitals }: { hospitals: HospitalReport[] }) {
  return (
    <ReportSection title={`Hospitals (${hospitals.length})`} empty="No hospitals match this search.">
      <DataTable
        data={hospitals}
        testIDPrefix="ar-hospital"
        columns={[
          { key: 'name', label: 'Name', width: 220, render: (h) => fallback(h.name) },
          { key: 'location', label: 'Location', width: 220, render: (h) => locationText(h.city, h.state) },
          { key: 'contact', label: 'Contact number', width: 170, render: (h) => fallback(h.phone) },
        ]}
      />
    </ReportSection>
  );
}

function ActivityReport({ activity, compact }: { activity: ActivityItem[]; compact?: boolean }) {
  return (
    <ReportSection title={compact ? undefined : `Activity (${activity.length})`} empty="No activity matches this search.">
      <DataTable
        data={activity}
        testIDPrefix="ar-activity"
        columns={[
          { key: 'date', label: 'Date', width: 130, render: (item) => compactDate(item.at) },
          { key: 'activity', label: 'Activity', width: 210, render: (item) => item.title },
          { key: 'details', label: 'Details', width: compact ? 260 : 360, render: (item) => item.detail },
        ]}
      />
    </ReportSection>
  );
}

function ContentReport({ content, profileById }: { content: ContentItem[]; profileById: Map<string, Profile> }) {
  const contentRows = content.map((c) => ({ ...c, creator: c.created_by ? profileById.get(c.created_by) : null }));

  return (
    <ReportSection title={`Content (${content.length})`} empty="No content matches this search.">
      <DataTable
        data={contentRows}
        testIDPrefix="ar-content"
        columns={[
          { key: 'title', label: 'Title', width: 240, render: (c) => c.title },
          { key: 'category', label: 'Category', width: 150, render: (c) => c.category.replace('_', ' ') },
          { key: 'status', label: 'Status', width: 150, render: (c) => (c.is_published ? 'Published' : 'Pending review') },
          { key: 'createdBy', label: 'Created by', width: 190, render: (c) => c.creator?.organization_name || c.creator?.full_name || 'System/Admin' },
        ]}
      />
    </ReportSection>
  );
}

function ReportSection({ title, empty, children }: { title?: string; empty: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <View>
      {title ? <Text style={styles.section}>{title}</Text> : null}
      {items.length === 0 ? <Text style={styles.empty}>{empty}</Text> : items}
    </View>
  );
}

function DataTable<T extends { id: string }>({ data, columns, testIDPrefix }: { data: T[]; columns: TableColumn<T>[]; testIDPrefix: string }) {
  const minWidth = columns.reduce((total, column) => total + (column.width ?? 160), 0);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
      <View style={[styles.table, { minWidth }]}>
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          {columns.map((column) => (
            <Text key={column.key} style={[styles.tableHeaderCell, { width: column.width ?? 160 }]}>
              {column.label}
            </Text>
          ))}
        </View>
        {data.map((item, index) => (
          <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : null]} testID={`${testIDPrefix}-${item.id}`}>
            {columns.map((column) => (
              <Text key={column.key} style={[styles.tableCell, { width: column.width ?? 160 }]}>
                {column.render(item)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  refreshWrap: { width: 128, marginLeft: spacing.sm, marginTop: 30 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  tabButton: { marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.lg },
  summaryTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginRight: '2%',
    marginBottom: spacing.sm,
  },
  summaryTileWarning: { backgroundColor: colors.surfaceAlt, borderColor: colors.warning },
  summaryValue: { color: colors.primary, fontSize: font.h2, fontWeight: font.weightBold },
  summaryLabel: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: 2, lineHeight: 24 },
  muted: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic', marginVertical: spacing.md },
  tableScroll: { marginBottom: spacing.md },
  table: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  tableRow: { flexDirection: 'row', borderTopColor: colors.border, borderTopWidth: 1 },
  tableHeaderRow: { backgroundColor: colors.primary, borderTopWidth: 0 },
  tableRowAlt: { backgroundColor: colors.surfaceAlt },
  tableHeaderCell: {
    color: colors.textInverse,
    fontSize: font.small,
    fontWeight: font.weightBold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tableCell: {
    color: colors.text,
    fontSize: font.small,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
