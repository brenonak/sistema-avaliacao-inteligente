"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";

export default function BlobTestPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setErrorMessage("");
    
    // Generate preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const uploadSingleFile = async (file) => {
    try {
      setUploadProgress(0);
      
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
        clientPayload: JSON.stringify({ 
          originalFilename: file.name,
          timestamp: Date.now()
        }),
        onProgress: (progress) => {
          setUploadProgress(progress.percentage);
        }
      });

      // Add to uploaded images
      const newImage = {
        name: file.name,
        size: file.size,
        url: blob.url,
        uploadedAt: new Date().toISOString()
      };
      
      setUploadedImages(prev => [...prev, newImage]);

      // Register resource for local development (fallback)
      try {
        await fetch('/api/resources/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: blob.url,
            key: blob.pathname,
            filename: file.name,
            mime: file.type,
            sizeBytes: file.size
          })
        });
      } catch (registerError) {
        console.warn("Failed to register resource (this is normal in production):", registerError);
      }

      return blob;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage("Please select at least one file");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setUploadProgress(0);

    try {
      for (const file of selectedFiles) {
        await uploadSingleFile(file);
      }
      
      // Clear selections after successful upload
      setSelectedFiles([]);
      setPreviewUrls([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Vercel Blob Upload Test
        </h1>

        {/* File Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Images</h2>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Selected {selectedFiles.length} file(s)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {selectedFiles[index].name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Upload Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {uploadProgress.toFixed(1)}% complete
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Upload Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "Uploading..." : "Upload Images"}
          </button>
        </div>

        {/* Uploaded Images Gallery */}
        {uploadedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Uploaded Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploadedImages.map((image, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {image.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Size: {formatFileSize(image.size)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(image.uploadedAt).toLocaleString()}
                    </p>
                    <div className="flex space-x-2">
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </a>
                      <button
                        onClick={() => copyToClipboard(image.url)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Development Note */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Development Note</h3>
          <p className="text-yellow-700 text-sm">
            In local development, the onUploadCompleted callback may not work. 
            The fallback registration endpoint will handle resource registration automatically.
            In production, resources are registered via the onUploadCompleted callback.
          </p>
        </div>
      </div>
    </div>
  );
}
