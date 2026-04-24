import { useState, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { Upload, X, Image as ImageIcon, File, CheckCircle, AlertCircle } from 'lucide-react';

const FileUploader = ({ 
  endpoint = '/upload', 
  maxSize = 100, 
  acceptedTypes = ['image/*', 'application/pdf', 'application/zip'],
  onUploadComplete,
  multiple = false 
}) => {
  const { post } = useApi();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setError('');

    // Validate files
    const validFiles = [];
    for (const file of selectedFiles) {
      // Check size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }

      // Check type
      const isAllowed = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.split('*')[0]);
        }
        return file.type === type || file.name.endsWith(type);
      });

      if (!isAllowed) {
        setError(`${file.name} is not an allowed file type`);
        continue;
      }

      validFiles.push({
        file,
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
        type: file.type,
        progress: 0,
        status: 'pending'
      });
    }

    if (validFiles.length > 0) {
      setFiles(multiple ? [...files, ...validFiles] : validFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));

      const res = await post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res?.success) {
        setFiles(files.map(f => ({ ...f, status: 'success', url: res.data?.urls?.[0] })));
        if (onUploadComplete) {
          onUploadComplete(res.data);
        }
        alert('Upload successful!');
      } else {
        setError(res?.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <File className="w-5 h-5 text-yellow-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p className="text-sm text-gray-500">
          Max size: {maxSize}MB | Types: {acceptedTypes.join(', ')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{file.size} MB</p>
              </div>
              {file.status === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {file.status === 'pending' && !uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
};

export default FileUploader;
