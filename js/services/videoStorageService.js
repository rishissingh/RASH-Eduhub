/**
 * RASH EduHub - IndexedDB Video & Media Storage Service
 * High-performance media manager storing raw uploaded video Files & Blobs in IndexedDB.
 * Guarantees 100% video source data binding with ZERO animal/placeholder fallbacks.
 */

const VideoStorageService = {
   DB_NAME: 'EduHubMediaDB',
   STORE_NAME: 'video_blobs',
   db: null,

   /**
    * Open IndexedDB Connection
    */
   async getDB() {
      if (this.db) return this.db;

      return new Promise((resolve, reject) => {
         const request = indexedDB.open(this.DB_NAME, 1);

         request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(this.STORE_NAME)) {
               db.createObjectStore(this.STORE_NAME);
            }
         };

         request.onsuccess = (e) => {
            this.db = e.target.result;
            resolve(this.db);
         };

         request.onerror = (e) => {
            console.error('IndexedDB open error:', e.target.error);
            reject(e.target.error);
         };
      });
   },

   /**
    * Save uploaded File/Blob to IndexedDB under lessonId key
    */
   async saveVideo(lessonId, fileOrBlob) {
      if (!fileOrBlob || typeof fileOrBlob === 'string') {
         return fileOrBlob;
      }

      try {
         const db = await this.getDB();
         return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.put(fileOrBlob, lessonId);

            request.onsuccess = () => {
               const blobUrl = URL.createObjectURL(fileOrBlob);
               resolve(blobUrl);
            };

            request.onerror = (e) => {
               console.error('IndexedDB put error:', e.target.error);
               reject(e.target.error);
            };
         });
      } catch (err) {
         console.warn('IndexedDB unavailable, returning Blob URL:', err);
         return URL.createObjectURL(fileOrBlob);
      }
   },

   /**
    * Retrieve exact playable video source URL for a lesson
    */
   async getVideoUrl(lessonId, rawVideoUrl = '') {
      if (!lessonId) return rawVideoUrl;

      try {
         const db = await this.getDB();
         return new Promise((resolve) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.get(lessonId);

            request.onsuccess = (e) => {
               const blob = e.target.result;
               if (blob && blob instanceof Blob) {
                  const blobUrl = URL.createObjectURL(blob);
                  resolve(blobUrl);
               } else {
                  // Return exact uploaded video string without any hardcoded overrides
                  resolve(rawVideoUrl);
               }
            };

            request.onerror = () => resolve(rawVideoUrl);
         });
      } catch (err) {
         return rawVideoUrl;
      }
   }
};

window.VideoStorageService = VideoStorageService;
