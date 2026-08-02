// IndexedDB helper for Offline Sync Queue and Offline File Caching
export const initOfflineDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('student_os_offline_db', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('offline_actions')) {
        db.createObjectStore('offline_actions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached_materials')) {
        db.createObjectStore('cached_materials', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const queueOfflineAction = async (type, path, data) => {
  try {
    const db = await initOfflineDB();
    const transaction = db.transaction('offline_actions', 'readwrite');
    const store = transaction.objectStore('offline_actions');
    await new Promise((resolve, reject) => {
      const request = store.add({ type, path, data, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to queue offline action:', err);
  }
};

export const getOfflineActions = async () => {
  try {
    const db = await initOfflineDB();
    const transaction = db.transaction('offline_actions', 'readonly');
    const store = transaction.objectStore('offline_actions');
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to get offline actions:', err);
    return [];
  }
};

export const deleteOfflineAction = async (id) => {
  try {
    const db = await initOfflineDB();
    const transaction = db.transaction('offline_actions', 'readwrite');
    const store = transaction.objectStore('offline_actions');
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to delete offline action:', err);
  }
};

export const cacheMaterialFile = async (id, title, fileName, fileData) => {
  try {
    const db = await initOfflineDB();
    const transaction = db.transaction('cached_materials', 'readwrite');
    const store = transaction.objectStore('cached_materials');
    await new Promise((resolve, reject) => {
      const request = store.put({ id, title, fileName, fileData, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to cache material file:', err);
  }
};

export const getCachedMaterialFile = async (id) => {
  try {
    const db = await initOfflineDB();
    const transaction = db.transaction('cached_materials', 'readonly');
    const store = transaction.objectStore('cached_materials');
    return await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to get cached material:', err);
    return null;
  }
};
