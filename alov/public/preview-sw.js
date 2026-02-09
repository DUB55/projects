const CACHE_NAME = 'alov-preview-vfs';
let vfs = {};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_VFS') {
    vfs = event.data.files;
    console.log('[SW] VFS Updated:', Object.keys(vfs));
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.url);
  
  // Only intercept requests to the same origin or blob-like paths
  // In our case, we'll use a virtual path prefix like /__preview__/
  if (url.pathname.startsWith('/__preview__/')) {
    const filePath = url.pathname.replace('/__preview__/', '');
    const fileName = filePath || 'index.html';
    
    if (vfs[fileName]) {
      const content = vfs[fileName];
      const type = getContentType(fileName);
      
      if (fileName.endsWith('.html')) {
        const errorScript = `
          <script>
            (function() {
              const reportError = (error) => {
                window.parent.postMessage({
                  type: 'PREVIEW_ERROR',
                  message: error.message,
                  stack: error.stack,
                  filename: error.filename,
                  lineno: error.lineno,
                  colno: error.colno
                }, '*');
              };

              window.onerror = function(message, source, lineno, colno, error) {
                reportError({ message, stack: error?.stack, filename: source, lineno, colno });
                return false;
              };

              window.onunhandledrejection = function(event) {
                reportError({ message: 'Unhandled Promise Rejection: ' + (event.reason?.message || event.reason) });
              };
              
              console.log('[Preview] Error reporting initialized');
            })();
          </script>
        `;
        
        let modifiedContent = content;
        if (content.includes('</body>')) {
          modifiedContent = content.replace('</body>', errorScript + '</body>');
        } else if (content.includes('</html>')) {
          modifiedContent = content.replace('</html>', errorScript + '</html>');
        } else {
          modifiedContent = content + errorScript;
        }

        event.respondWith(
          new Response(modifiedContent, {
            headers: { 'Content-Type': type }
          })
        );
      } else {
        event.respondWith(
          new Response(content, {
            headers: { 'Content-Type': type }
          })
        );
      }
      return;
    }
  }
});

function getContentType(fileName) {
  if (fileName.endsWith('.html')) return 'text/html';
  if (fileName.endsWith('.css')) return 'text/css';
  if (fileName.endsWith('.js')) return 'application/javascript';
  if (fileName.endsWith('.json')) return 'application/json';
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
  if (fileName.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}
