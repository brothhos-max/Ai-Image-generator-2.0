import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ImageEditor from './components/ImageEditor';
import { generateOrEnhanceImage } from './services/geminiService';
import type { InputImage } from './types';

// Helper to read a file as a Data URL
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

// Component to display the uploaded image preview
const ImagePreview: React.FC<{
  image: InputImage;
  onEdit: () => void;
  onClear: () => void;
}> = ({ image, onEdit, onClear }) => {
  return (
    <div className="relative group w-24 h-24 mb-3">
      <img
        src={`data:${image.mimeType};base64,${image.base64}`}
        alt="Input Preview"
        className="w-full h-full object-contain rounded-md border border-gray-500"
      />
      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
          aria-label="Edit image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={onClear}
          className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
          aria-label="Remove image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [inputImage, setInputImage] = useState<InputImage | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{ src: string; mimeType: string; } | null>(null);

  const handleImageSelect = (image: InputImage) => {
    setInputImage(image);
    setGeneratedImage(null); 
  };

  const handleImageClear = () => {
    setInputImage(null);
  };
  
  const handleFileSelected = async (file: File) => {
    try {
        const dataUrl = await fileToDataUrl(file);
        setEditingImage({ src: dataUrl, mimeType: file.type });
    } catch (err) {
        console.error("Error reading file", err);
        setError("Error reading the selected file.");
    }
  };

  const handleEditClick = () => {
    if (inputImage) {
      const src = `data:${inputImage.mimeType};base64,${inputImage.base64}`;
      setEditingImage({ src, mimeType: inputImage.mimeType });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt) {
      setError('Please enter a prompt to generate an image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageB64 = await generateOrEnhanceImage(prompt, inputImage);
      setGeneratedImage(`data:image/png;base64,${imageB64}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, inputImage]);

  return (
    <div className="min-h-screen bg-base-100 font-sans flex flex-col items-center">
      <Header />
      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Input Panel */}
          <div className="bg-base-200 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Your Creative Controls</h2>
                
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Prompt
                </label>
                <div className="bg-base-300 border border-gray-600 rounded-lg p-3 focus-within:ring-2 focus-within:ring-brand-primary transition-all duration-200">
                    {inputImage && (
                    <ImagePreview 
                        image={inputImage} 
                        onEdit={handleEditClick}
                        onClear={handleImageClear} 
                    />
                    )}
                    <div className="flex items-start space-x-3">
                    <textarea
                        id="prompt"
                        rows={4}
                        className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-white placeholder-gray-400 resize-none"
                        placeholder={inputImage ? "Describe how you want to change the image..." : "e.g., A futuristic city skyline at sunset..."}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                    <ImageUploader 
                        onFileSelected={handleFileSelected}
                        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-base-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </ImageUploader>
                    </div>
                </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading || !prompt}
              className="mt-6 w-full flex justify-center items-center bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-300"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  {inputImage ? 'Enhancing...' : 'Generating...'}
                </>
              ) : (
                inputImage ? 'Enhance Image' : 'Generate Image'
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-base-200 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[400px] lg:min-h-0">
            {isLoading && !generatedImage && (
              <div className="text-center">
                <LoadingSpinner isLarge={true} />
                <p className="mt-4 text-lg">AI is crafting your vision...</p>
              </div>
            )}
            {!isLoading && error && (
              <div className="text-center text-red-400">
                <p className="font-bold">Generation Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            {!isLoading && !error && (
              <ImageDisplay generatedImage={generatedImage} />
            )}
          </div>
        </div>
      </main>

      {editingImage && (
        <ImageEditor
          imageSrc={editingImage.src}
          mimeType={editingImage.mimeType}
          onCancel={() => setEditingImage(null)}
          onSave={(editedImage) => {
            handleImageSelect(editedImage);
            setEditingImage(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
