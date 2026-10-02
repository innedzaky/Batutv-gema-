import { supabase } from '../../lib/supabase';
import {
  SystemInfoConfig,
  MaintenanceConfig,
  SecurityConfig,
  ActivityLogItem,
  CacheStats,
} from '../../types/systemSettings';
import {
  ISystemSettingsRepository,
  SystemSettingsSnapshot,
} from '../ISystemSettingsRepository';

const LOCAL_SYSTEM_INFO: SystemInfoConfig = {
  appName: 'BATUTV Control',
  cmsVersion: 'v1.0.0',
  buildVersion: 'build-2026.08-rev4',
  environment: 'Production',
  installationDate: '15 Januari 2026',
  systemStatus: 'Online',
  serverSpecs: {
    runtime: 'Node.js v20.14.0 (LTS)',
    framework: 'React 18 + Vite (SPA Mode)',
    engine: 'High-Performance Cloud Container',
    database: 'PostgreSQL Supabase (Cloud SQL Engine)',
    serverRegion: 'Singapore (ap-southeast-1)',
    timezone: 'Asia/Jakarta (WIB / UTC+7)',
  },
};

const LOCAL_MAINTENANCE_CONFIG: MaintenanceConfig = {
  isEnabled: false,
  title: 'Situs Sedang Dalam Pemeliharaan Sistem',
  message: 'Kami sedang melakukan peningkatan performa portal berita BatuTV.',
  estimatedCompletion: 'Segera Kembali Online',
  allowAdminBypass: true,
  contactEmail: 'redaksi@batutv.id',
  contactPhone: '+62 341 590001',
  lastToggledAt: new Date().toISOString(),
  toggledBy: 'Super Administrator',
};

const LOCAL_SECURITY_CONFIG: SecurityConfig = {
  sessionTimeoutMinutes: 120,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  requireStrongPassword: true,
  enableTwoFactor: false,
  forcePasswordChangeDays: 90,
  allowedIpAddresses: [],
  disallowConcurrentSessions: true,
  activityLoggingLevel: 'detail',
};

export class SupabaseSystemSettingsRepository implements ISystemSettingsRepository {
  async getInfo(): Promise<SystemInfoConfig> {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('general')
        .eq('id', 'current')
        .maybeSingle();

      return data?.general || LOCAL_SYSTEM_INFO;
    } catch {
      return LOCAL_SYSTEM_INFO;
    }
  }

  async saveInfo(info: SystemInfoConfig): Promise<SystemInfoConfig> {
    await supabase
      .from('system_settings')
      .upsert({ id: 'current', general: info, updated_at: new Date().toISOString() });
    return info;
  }

  async getMaintenance(): Promise<MaintenanceConfig> {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('seo')
        .eq('id', 'current')
        .maybeSingle();

      return data?.seo || LOCAL_MAINTENANCE_CONFIG;
    } catch {
      return LOCAL_MAINTENANCE_CONFIG;
    }
  }

  async saveMaintenance(config: MaintenanceConfig): Promise<MaintenanceConfig> {
    await supabase
      .from('system_settings')
      .upsert({ id: 'current', seo: config, updated_at: new Date().toISOString() });
    return config;
  }

  async getSecurity(): Promise<SecurityConfig> {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('security')
        .eq('id', 'current')
        .maybeSingle();

      return data?.security || LOCAL_SECURITY_CONFIG;
    } catch {
      return LOCAL_SECURITY_CONFIG;
    }
  }

  async saveSecurity(config: SecurityConfig): Promise<SecurityConfig> {
    await supabase
      .from('system_settings')
      .upsert({ id: 'current', security: config, updated_at: new Date().toISOString() });
    return config;
  }

  async getActivityLogs(limitCount: number = 50): Promise<ActivityLogItem[]> {
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limitCount);

      if (!data) return [];
      return data.map((d) => ({
        id: d.id,
        userName: d.user_name,
        userRole: d.user_role,
        action: d.action as any,
        targetTitle: d.target_title,
        targetType: d.target_type as any,
        timestamp: d.timestamp,
        timeAgo: d.time_ago || '',
      }));
    } catch {
      return [];
    }
  }

  async addActivityLog(log: ActivityLogItem): Promise<ActivityLogItem> {
    await supabase.from('activity_logs').insert({
      id: log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_name: log.userName,
      user_role: log.userRole,
      action: log.action,
      target_title: log.targetTitle,
      target_type: log.targetType,
      timestamp: log.timestamp || new Date().toISOString(),
      time_ago: log.timeAgo || '',
    });
    return log;
  }

  async logActivity(log: ActivityLogItem): Promise<ActivityLogItem> {
    return this.addActivityLog(log);
  }

  async clearActivityLogs(): Promise<void> {
    await supabase.from('activity_logs').delete().neq('id', '');
  }

  async clearLogs(): Promise<void> {
    return this.clearActivityLogs();
  }

  async getCacheStats(): Promise<CacheStats> {
    return {
      entriesCount: 42,
      hitRate: 98.4,
      lastPurged: new Date().toISOString(),
      sizeBytes: 1024 * 512,
    };
  }

  async saveCacheStats(stats: CacheStats): Promise<CacheStats> {
    return stats;
  }

  subscribe(
    onNext: (snapshot: SystemSettingsSnapshot) => void,
    onError?: (error: Error) => void
  ): () => void {
    const fetchAll = async () => {
      try {
        const [info, maintenance, security, logs] = await Promise.all([
          this.getInfo(),
          this.getMaintenance(),
          this.getSecurity(),
          this.getActivityLogs(20),
        ]);
        onNext({ info, maintenance, security, logs });
      } catch (err: any) {
        onError?.(err);
      }
    };

    fetchAll();
    const channel = supabase
      .channel('public:system_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeMaintenance(
    onNext: (config: MaintenanceConfig) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getMaintenance().then(onNext).catch(onError);
    const channel = supabase
      .channel('public:maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        this.getMaintenance().then(onNext).catch(onError);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeSecurity(
    onNext: (config: SecurityConfig) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getSecurity().then(onNext).catch(onError);
    const channel = supabase
      .channel('public:security')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        this.getSecurity().then(onNext).catch(onError);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseSystemSettingsRepository = new SupabaseSystemSettingsRepository();
