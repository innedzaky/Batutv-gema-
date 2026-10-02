import { supabase } from '../../lib/supabase';
import {
  NavigationItem,
  SubNavigationItem,
  SubNavSettings,
} from '../../types/navigation';
import { INavigationRepository } from '../INavigationRepository';
const DEFAULT_SUBNAV_SETTINGS: SubNavSettings = {
  showBreakingBadge: true,
  breakingBadgeText: 'LIVE BREAKING',
  breakingNewsTitle: 'Peringatan Dini Cuaca Ekstrem Kota Batu',
  breakingNewsUrl: '/berita/waspada-cuaca-ekstrem-kota-batu',
};

export function toNavigationDbRow(item: NavigationItem): Record<string, any> {
  return {
    id: item.id,
    label: item.label,
    type: item.type || 'internal',
    target_type: item.targetType || 'kategori',
    target_id: item.targetId || '',
    url: item.url,
    slug: item.slug,
    parent_id: item.parentId || null,
    sort_order: item.sortOrder || 0,
    active: item.active ?? true,
    open_new_tab: item.openNewTab ?? false,
    icon: item.icon || '',
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || new Date().toISOString(),
  };
}

export function fromNavigationDbRow(row: Record<string, any>): NavigationItem {
  return {
    id: row.id,
    label: row.label,
    type: (row.type as any) || 'internal',
    targetType: row.target_type || 'kategori',
    targetId: row.target_id || '',
    url: row.url,
    slug: row.slug,
    parentId: row.parent_id || null,
    sortOrder: Number(row.sort_order) || 0,
    active: Boolean(row.active),
    openNewTab: Boolean(row.open_new_tab),
    icon: row.icon || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function toSubNavDbRow(item: SubNavigationItem): Record<string, any> {
  return {
    id: item.id,
    label: item.label,
    target_type: item.targetType || 'category',
    target_id: item.targetId || '',
    url: item.url,
    slug: item.slug,
    sort_order: item.sortOrder || 0,
    active: item.active ?? true,
    open_new_tab: item.openNewTab ?? false,
    badge: item.badge || '',
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || new Date().toISOString(),
  };
}

export function fromSubNavDbRow(row: Record<string, any>): SubNavigationItem {
  return {
    id: row.id,
    label: row.label,
    targetType: (row.target_type as any) || 'category',
    targetId: row.target_id || '',
    url: row.url,
    slug: row.slug,
    sortOrder: Number(row.sort_order) || 0,
    active: Boolean(row.active),
    openNewTab: Boolean(row.open_new_tab),
    badge: row.badge || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export class SupabaseNavigationRepository implements INavigationRepository {
  async getPrimaryNav(): Promise<NavigationItem[]> {
    try {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return [];
      }
      return data.map(fromNavigationDbRow);
    } catch (err: any) {
      console.warn('[SupabaseNavigationRepository] getPrimaryNav fallback:', err?.message);
      return [];
    }
  }

  async getSubNav(): Promise<SubNavigationItem[]> {
    try {
      const { data, error } = await supabase
        .from('sub_navigation_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        return [];
      }
      return data.map(fromSubNavDbRow);
    } catch (err: any) {
      console.warn('[SupabaseNavigationRepository] getSubNav fallback:', err?.message);
      return [];
    }
  }

  async getSubNavSettings(): Promise<SubNavSettings> {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('identity')
        .eq('id', 'current')
        .maybeSingle();

      if (data?.identity?.subNavSettings) {
        return data.identity.subNavSettings;
      }
      return DEFAULT_SUBNAV_SETTINGS;
    } catch {
      return DEFAULT_SUBNAV_SETTINGS;
    }
  }

  async savePrimaryNav(items: NavigationItem[]): Promise<void> {
    const rows = items.map(toNavigationDbRow);
    const { error } = await supabase
      .from('navigation_items')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;
  }

  async saveSubNav(items: SubNavigationItem[]): Promise<void> {
    const rows = items.map(toSubNavDbRow);
    const { error } = await supabase
      .from('sub_navigation_items')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;
  }

  async saveSubNavSettings(settings: SubNavSettings): Promise<void> {
    const { data: current } = await supabase
      .from('site_settings')
      .select('identity')
      .eq('id', 'current')
      .maybeSingle();

    const identity = current?.identity || {};
    identity.subNavSettings = settings;

    await supabase
      .from('site_settings')
      .upsert({ id: 'current', identity, updated_at: new Date().toISOString() });
  }

  async createPrimaryItem(item: NavigationItem): Promise<NavigationItem> {
    const row = toNavigationDbRow(item);
    const { data, error } = await supabase
      .from('navigation_items')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromNavigationDbRow(data);
  }

  async updatePrimaryItem(id: string, partial: Partial<NavigationItem>): Promise<NavigationItem> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (partial.label !== undefined) updates.label = partial.label;
    if (partial.url !== undefined) updates.url = partial.url;
    if (partial.slug !== undefined) updates.slug = partial.slug;
    if (partial.sortOrder !== undefined) updates.sort_order = partial.sortOrder;
    if (partial.active !== undefined) updates.active = partial.active;
    if (partial.openNewTab !== undefined) updates.open_new_tab = partial.openNewTab;
    if (partial.icon !== undefined) updates.icon = partial.icon;
    if (partial.parentId !== undefined) updates.parent_id = partial.parentId;
    if (partial.targetType !== undefined) updates.target_type = partial.targetType;
    if (partial.targetId !== undefined) updates.target_id = partial.targetId;

    const { data, error } = await supabase
      .from('navigation_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromNavigationDbRow(data);
  }

  async deletePrimaryItem(id: string): Promise<void> {
    const { error } = await supabase.from('navigation_items').delete().eq('id', id);
    if (error) throw error;
  }

  async createSubNavItem(item: SubNavigationItem): Promise<SubNavigationItem> {
    const row = toSubNavDbRow(item);
    const { data, error } = await supabase
      .from('sub_navigation_items')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return fromSubNavDbRow(data);
  }

  async updateSubNavItem(id: string, partial: Partial<SubNavigationItem>): Promise<SubNavigationItem> {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (partial.label !== undefined) updates.label = partial.label;
    if (partial.url !== undefined) updates.url = partial.url;
    if (partial.slug !== undefined) updates.slug = partial.slug;
    if (partial.sortOrder !== undefined) updates.sort_order = partial.sortOrder;
    if (partial.active !== undefined) updates.active = partial.active;
    if (partial.openNewTab !== undefined) updates.open_new_tab = partial.openNewTab;
    if (partial.badge !== undefined) updates.badge = partial.badge;
    if (partial.targetType !== undefined) updates.target_type = partial.targetType;
    if (partial.targetId !== undefined) updates.target_id = partial.targetId;

    const { data, error } = await supabase
      .from('sub_navigation_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromSubNavDbRow(data);
  }

  async deleteSubNavItem(id: string): Promise<void> {
    const { error } = await supabase.from('sub_navigation_items').delete().eq('id', id);
    if (error) throw error;
  }

  subscribe(
    onNext: (data: {
      primary: NavigationItem[];
      subNav: SubNavigationItem[];
      subNavSettings: SubNavSettings;
    }) => void,
    onError?: (error: Error) => void
  ): () => void {
    const fetchAll = async () => {
      try {
        const [primary, subNav, subNavSettings] = await Promise.all([
          this.getPrimaryNav(),
          this.getSubNav(),
          this.getSubNavSettings(),
        ]);
        onNext({ primary, subNav, subNavSettings });
      } catch (err: any) {
        onError?.(err);
      }
    };

    fetchAll();

    const channel = supabase
      .channel('public:navigation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_items' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_navigation_items' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseNavigationRepository = new SupabaseNavigationRepository();
