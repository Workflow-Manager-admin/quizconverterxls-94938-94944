import React, { useState } from 'react';
import './QuizConverterXLSMainContainer.css';
import mammoth from 'mammoth';
import { extractQuizData } from '../utils/quizExtractor';

// PUBLIC_INTERFACE
/**
 * QuizConverterXLSMainContainer Component
 * 
 * Main component for the Word-to-Excel quiz converter
 * 
 * @returns {JSX.Element} The QuizConverterXLSMainContainer component
 */
const QuizConverterXLSMainContainer = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedQuizData, setExtractedQuizData] = useState([]);
  const [error, setError] = useState(null);
  
  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };
  
  // Handle file upload and processing
  const handleUpload = () => {
    if (!file) return;
    
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };
  
  // Demo data for preview table
  const previewData = [
    { question: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], answer: "B" },
    { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: "B" }
  ];
  
  return (
    <div className="quiz-converter-container">
      <h1 className="converter-title">Quiz Converter XLS</h1>
      <p className="converter-description">
        Convert quiz questions from Word documents to Excel format.
      </p>
      
      {/* Simple file upload area */}
      <div className="upload-area">
        <div className="upload-icon">📄</div>
        <p className="upload-text">Upload a Word document</p>
        <input 
          type="file" 
          accept=".docx" 
          onChange={handleFileChange} 
          style={{ marginBottom: '1rem' }}
        />
        {file && <p className="file-info">Selected: {file.name}</p>}
        <button className="btn" onClick={handleUpload}>Process File</button>
      </div>
      
      {/* Processing status */}
      {isProcessing && (
        <div className="processing-section">
          Processing document...
        </div>
      )}
      
      {/* Demo preview table */}
      <div className="preview-section">
        <h3>Preview (Demo data)</h3>
        <table className="preview-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Option A</th>
              <th>Option B</th>
              <th>Option C</th>
              <th>Option D</th>
              <th>Answer</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((item, index) => (
              <tr key={index}>
                <td>{item.question}</td>
                {item.options.map((option, optIndex) => (
                  <td key={optIndex}>{option}</td>
                ))}
                <td>{item.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Action buttons */}
      <div className="btn-container">
        <button className="btn">Export to Excel</button>
        <button className="btn btn-secondary">Clear</button>
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <h3>How to use:</h3>
        <ol>
          <li>Upload a Word document (.docx) containing quiz questions.</li>
          <li>The document should have clearly formatted questions with options labeled (A, B, C, etc.).</li>
          <li>Each question should indicate the correct answer somewhere in the text.</li>
          <li>Review the extracted data in the preview table.</li>
          <li>Click "Export to Excel" to download the data as an Excel file.</li>
        </ol>
      </div>
    </div>
  );
};

export default QuizConverterXLSMainContainer;
