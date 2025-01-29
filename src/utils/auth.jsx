import { openDB } from 'idb';
import * as jwt_decode from 'jwt-decode'; // Modified import

const dbName = 'my-app-db';
const storeName = 'auth';
const tokenKey = 'jwt-token';

const getDB = async () => {
  return openDB(dbName, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    },
  });
};

export const storeToken = async (token) => {
  const db = await getDB();
  await db.put(storeName, token, tokenKey);
};

export const getStoredToken = async () => {
  const db = await getDB();
  return db.get(storeName, tokenKey);
};

export const clearToken = async () => {
  const db = await getDB();
  await db.delete(storeName, tokenKey);
};

export const validateToken = async (token, supabase) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (data && data.user) {
      return true;
    } else {
      console.error('JWT 验证失败:', error);
      return false;
    }
  } catch (error) {
    console.error('JWT 验证失败:', error);
    return false;
  }
};

export const refreshToken = async (supabase) => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('JWT 刷新失败:', error);
      return null;
    }
    console.log('JWT 刷新成功:', data);
    return data.session.access_token;
  } catch (error) {
    console.error('JWT 刷新失败:', error);
    return null;
  }
};

export const validateTokenLocally = (token) => {
  try {
    const decoded = jwt_decode.jwtDecode(token); // Modified usage
    if (decoded.exp > Date.now() / 1000) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('本地 JWT 验证失败:', error);
    return false;
  }
};
