import { supabase } from '../../lib/supabase';
import { CMSUser, UserRole, UserStatus } from '../../types/user';
import { IUserRepository, UserQueryOptions } from '../IUserRepository';
import { INITIAL_CMS_USERS } from '../../data/userAdminDummyData';

export function toUserDbRow(u: CMSUser): Record<string, any> {
  return {
    id: u.id,
    full_name: u.fullName,
    username: u.username,
    email: u.email,
    password: u.password || 'BatuTV123!',
    role: u.role || 'reporter',
    status: u.status || 'aktif',
    author_id: u.authorId || null,
    author_name: u.authorName || null,
    author_position: u.authorPosition || null,
    author_photo_url: u.authorPhotoUrl || null,
    last_login: u.lastLogin || null,
    last_login_details: u.lastLoginDetails || null,
    force_password_change: u.forcePasswordChange || false,
    failed_login_attempts: u.failedLoginAttempts || 0,
    sessions_count: u.sessionsCount || 0,
    notes: u.notes || '',
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: u.updatedAt || new Date().toISOString(),
  };
}

export function fromUserDbRow(row: Record<string, any>): CMSUser {
  return {
    id: row.id,
    fullName: row.full_name || '',
    username: row.username || '',
    email: row.email || '',
    password: row.password,
    role: (row.role as UserRole) || 'reporter',
    status: (row.status as UserStatus) || 'aktif',
    authorId: row.author_id || null,
    authorName: row.author_name || undefined,
    authorPosition: row.author_position || undefined,
    authorPhotoUrl: row.author_photo_url || undefined,
    lastLogin: row.last_login || null,
    lastLoginDetails: row.last_login_details || undefined,
    forcePasswordChange: Boolean(row.force_password_change),
    failedLoginAttempts: Number(row.failed_login_attempts) || 0,
    sessionsCount: Number(row.sessions_count) || 0,
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export class SupabaseUserRepository implements IUserRepository {
  async getUsers(options?: UserQueryOptions): Promise<CMSUser[]> {
    try {
      let q = supabase.from('users').select('*');

      if (options?.role) {
        q = q.eq('role', options.role);
      }
      if (options?.status) {
        q = q.eq('status', options.status);
      }
      if (options?.limit) {
        q = q.limit(options.limit);
      }

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;

      if (error) throw error;
      if (!data || data.length === 0) {
        return INITIAL_CMS_USERS;
      }
      return data.map(fromUserDbRow);
    } catch (err: any) {
      console.warn('[SupabaseUserRepository] getUsers fallback:', err?.message);
      return INITIAL_CMS_USERS;
    }
  }

  async getUserById(id: string): Promise<CMSUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromUserDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseUserRepository] getUserById error:', err?.message);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<CMSUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return fromUserDbRow(data);
    } catch (err: any) {
      console.warn('[SupabaseUserRepository] getUserByEmail error:', err?.message);
      return null;
    }
  }

  async saveUser(user: CMSUser): Promise<CMSUser> {
    const row = toUserDbRow(user);
    const { data, error } = await supabase
      .from('users')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return fromUserDbRow(data);
  }

  async updateUser(id: string, updates: Partial<CMSUser>): Promise<CMSUser> {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fullName !== undefined) updatePayload.full_name = updates.fullName;
    if (updates.username !== undefined) updatePayload.username = updates.username;
    if (updates.email !== undefined) updatePayload.email = updates.email;
    if (updates.password !== undefined) updatePayload.password = updates.password;
    if (updates.role !== undefined) updatePayload.role = updates.role;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.authorId !== undefined) updatePayload.author_id = updates.authorId;
    if (updates.authorName !== undefined) updatePayload.author_name = updates.authorName;
    if (updates.authorPosition !== undefined) updatePayload.author_position = updates.authorPosition;
    if (updates.authorPhotoUrl !== undefined) updatePayload.author_photo_url = updates.authorPhotoUrl;
    if (updates.lastLogin !== undefined) updatePayload.last_login = updates.lastLogin;
    if (updates.lastLoginDetails !== undefined) updatePayload.last_login_details = updates.lastLoginDetails;
    if (updates.forcePasswordChange !== undefined) updatePayload.force_password_change = updates.forcePasswordChange;
    if (updates.failedLoginAttempts !== undefined) updatePayload.failed_login_attempts = updates.failedLoginAttempts;
    if (updates.sessionsCount !== undefined) updatePayload.sessions_count = updates.sessionsCount;
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;

    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromUserDbRow(data);
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }

  subscribe(
    onNext: (users: CMSUser[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    this.getUsers()
      .then((items) => onNext(items))
      .catch((err) => onError?.(err));

    const channel = supabase
      .channel('public:users')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          this.getUsers().then(onNext).catch(onError);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Supabase Realtime Channel error for users'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseUserRepository = new SupabaseUserRepository();
