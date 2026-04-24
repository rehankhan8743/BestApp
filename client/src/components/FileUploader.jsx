import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const FileUploader = ({
  endpoint = '/upload',
  maxSize = 100, // MB
  acceptedTypes = ['image/*', 'application/pdf', 'application/zip', 'application/x-rar-compressed'],
  multiple = true,
  onUploadComplete,
  onUploadError
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate files
    const validatedFiles = selectedFiles.filter(file => {
      // Check size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File "${file.name}" exceeds ${maxSize}MB limit`);
        return false;
      }
      
      // Check type
      const isAllowed = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type || file.name.endsWith(type.replace('*.', '.'));
      });
      
      if (!isAllowed) {
        setError(`File "${file.name}" type not allowed`);
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validatedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
      error: null
    }))]);

    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    pendingFiles.forEach(item => {
      formData.append('files', item.file);
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
          setFiles(prev => prev.map(item => {
            if (item.status === 'pending') {
              return { ...item, progress: percentCompleted };
            }
            return item;
          }));
        }
      });

      const result = await response.json();

      if (result.success) {
        setFiles(prev => prev.map(item => {
          if (item.status === 'pending') {
            return { ...item, status: 'uploaded', progress: 100 };
          }
          return item;
        }));
        
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
      setFiles(prev => prev.map(item => {
        if (item.status === 'pending') {
          return { ...item, status: 'error', error: err.message };
        }
        return item;
      }));
      
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-gray-500">
          Max file size: {maxSize}MB | Types: {acceptedTypes.join(', ')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept={acceptedTypes.join(',')}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.file.name}</p>
                <p className="text-sm text-gray-500">{formatSize(item.file.size)}</p>
                
                {item.status === 'pending' && uploading && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'pending' && !uploading && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                
                {item.status === 'uploaded' && (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
                
                {item.status === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.some(f => f.status === 'pending') && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading... {progress}%
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload {files.filter(f => f.status === 'pending').length} File(s)
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default FileUploader;
