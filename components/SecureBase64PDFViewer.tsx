import { API_CONFIG } from '@/config/constants';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface SecureBase64PDFViewerProps {
  pdfId: string;
  style?: any;
  onLoadComplete?: (pages: number) => void;
  onError?: (error: any) => void;
}

const SecureBase64PDFViewer: React.FC<SecureBase64PDFViewerProps> = ({
  pdfId,
  style,
  onLoadComplete,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Screenshot prevention is handled globally by the root layout
    fetchPDFData();
  }, [pdfId]);

  const fetchPDFData = async () => {
    try {
      setIsLoading(true);
      
      // Get auth token - temporarily disabled for testing
      // const token = await AsyncStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      // if (!token) {
      //   throw new Error('No authentication token found');
      // }
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/pdfs/${pdfId}/secure`, {
        headers: {
          // 'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        }
      });
      
      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        console.error('PDF fetch failed:', response.status, text);
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      // Try to parse as JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Expected JSON but got:', contentType, text.substring(0, 100));
        throw new Error('Invalid response format - expected JSON');
      }

      if (data.success && data.data.content) {
        setPdfData(data.data.content);
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete(1);
        }
      } else {
        throw new Error('Failed to load PDF data');
      }
    } catch (err) {
      console.error('Error fetching PDF:', err);
      setError('Failed to load PDF');
      setIsLoading(false);
      if (onError) {
        onError(err);
      }
    }
  };

  const getHtml = () => {
    if (!pdfData) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <!-- Allow pinch-to-zoom (initial=1, max=5x) so readers can blow up small text -->
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <title>Secure PDF Viewer</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          /* Disable all selection and interaction */
          html, body {
            width: 100%;
            height: 100%;
            overflow: auto;
            background: #525659;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
          
          /* Hide all text selection */
          ::selection {
            background: transparent;
          }
          ::-moz-selection {
            background: transparent;
          }
          
          #pdfContainer {
            width: 100%;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
          }
          
          .pdfPage {
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            position: relative;
            background: white;
          }
          
          canvas {
            display: block;
            max-width: 100%;
            height: auto;
          }
          
          /* Security overlay on each page */
          .pageOverlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10;
            background: transparent;
          }
          
          .loading {
            color: white;
            text-align: center;
            padding: 50px;
            font-family: -apple-system, sans-serif;
          }
          
          .error {
            color: #ff6b6b;
            text-align: center;
            padding: 50px;
            font-family: -apple-system, sans-serif;
          }
        </style>
        <script>
          // Disable all interactions
          document.addEventListener('contextmenu', e => e.preventDefault());
          document.addEventListener('selectstart', e => e.preventDefault());
          document.addEventListener('dragstart', e => e.preventDefault());
          document.addEventListener('copy', e => e.preventDefault());
          document.addEventListener('cut', e => e.preventDefault());
          document.addEventListener('paste', e => e.preventDefault());
          
          // Disable keyboard shortcuts
          document.addEventListener('keydown', e => {
            // Disable all Ctrl/Cmd combinations
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              return false;
            }
            // Disable F12 (dev tools)
            if (e.keyCode === 123) {
              e.preventDefault();
              return false;
            }
          });
          
          // Disable print
          window.addEventListener('beforeprint', e => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          });
          
          // Initialize PDF.js
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          // Load and render PDF
          async function loadPDF() {
            try {
              const pdfData = '${pdfData}';
              const loadingTask = pdfjsLib.getDocument({ data: atob(pdfData.split(',')[1]) });
              
              const pdf = await loadingTask.promise;
              const container = document.getElementById('pdfContainer');
              container.innerHTML = ''; // Clear loading message
              
              // Render all pages.
              // Use a higher device-pixel-ratio aware scale so the canvas stays sharp
              // when the user pinch-zooms past 100%. We multiply by DPR (capped at 2.5
              // to keep memory use in check on low-end devices) and let CSS scale the
              // canvas back down for the base view via max-width:100%.
              const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
              const renderScale = 2.0 * dpr;
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: renderScale });
                
                // Create page container
                const pageDiv = document.createElement('div');
                pageDiv.className = 'pdfPage';
                
                // Create canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Create overlay
                const overlay = document.createElement('div');
                overlay.className = 'pageOverlay';
                
                pageDiv.appendChild(canvas);
                pageDiv.appendChild(overlay);
                container.appendChild(pageDiv);
                
                // Render page
                await page.render({
                  canvasContext: context,
                  viewport: viewport
                }).promise;
              }
              
              // Notify that PDF is loaded
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'loaded',
                  pages: pdf.numPages
                }));
              }
              
            } catch (error) {
              console.error('Error rendering PDF:', error);
              document.getElementById('pdfContainer').innerHTML = 
                '<div class="error">Failed to render PDF: ' + error.message + '</div>';
            }
          }
          
          // Load PDF when page is ready
          document.addEventListener('DOMContentLoaded', loadPDF);
        </script>
      </head>
      <body>
        <div id="pdfContainer">
          <div class="loading">Loading secure PDF...</div>
        </div>
      </body>
      </html>
    `;
  };

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (isLoading || !pdfData) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading secure PDF...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: getHtml() }}
        style={styles.webview}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'loaded' && onLoadComplete) {
              onLoadComplete(data.pages);
            }
          } catch (error) {
            console.error('Message error:', error);
          }
        }}
        // Security settings
        javaScriptEnabled={true}
        domStorageEnabled={false}
        startInLoadingState={false}
        mixedContentMode="never"
        allowsInlineMediaPlayback={false}
        originWhitelist={['about:*']}
        // Disable all file access
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        // Disable cache to prevent local storage
        cacheEnabled={false}
        incognito={true}
        // Enable pinch-to-zoom — the viewport meta tag inside the HTML allows
        // it, and these props make Android/iOS WebView honour it consistently.
        scalesPageToFit
        setBuiltInZoomControls
        setDisplayZoomControls={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#525659',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#fff',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
  },
});

export default SecureBase64PDFViewer;