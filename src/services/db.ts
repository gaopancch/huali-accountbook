import { supabase } from '../supabase';

// 数据库服务 - 统一的Supabase数据操作接口

export const dbService = {
  // 账本相关
  books: {
    async getAll(uid: string) {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .or(`uid.eq.${uid},shared_with.cs.{${uid}}`);
      
      if (error) throw error;
      return data || [];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(book: any) {
      const { data, error } = await supabase
        .from('books')
        .insert([book])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  // 记账记录相关
  records: {
    async getByBookId(bookId: string) {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('book_id', bookId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(record: any) {
      const { data, error } = await supabase
        .from('records')
        .insert([record])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const { data, error} = await supabase
        .from('records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
  },

  // 用户资料相关
  userProfiles: {
    async getByUid(uid: string) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('uid', uid)
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(uid: string, updates: any) {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('uid', uid)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  },
};

export default dbService;
