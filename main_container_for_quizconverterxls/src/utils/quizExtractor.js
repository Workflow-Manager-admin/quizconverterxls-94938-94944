/**
 * Quiz Extractor Utility
 * 
 * This utility contains functions to extract questions, options, and answers
 * from HTML content converted from a Word document.
 */

// PUBLIC_INTERFACE
/**
 * Process HTML content to extract quiz questions, options, and answers
 * @param {string} htmlContent - The HTML content extracted from a Word document
 * @returns {Array} An array of quiz items with question, options, and answer
 */
export const extractQuizData = (htmlContent) => {
  // Create a temporary element to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Get all paragraphs
  const paragraphs = tempDiv.querySelectorAll('p');
  const results = [];
  
  // Simple extraction approach - look for paragraphs that seem like questions
  // and the following paragraphs that appear to be options
  let currentQuestion = null;
  let currentOptions = [];
  let currentAnswer = '';
  
  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i].textContent.trim();
    
    // Skip empty paragraphs
    if (!text) continue;
    
    // Check if this paragraph looks like a question (ends with question mark)
    if (text.includes('?')) {
      // If we already have a question in progress, save it before starting a new one
      if (currentQuestion && currentOptions.length > 0) {
        results.push({
          question: currentQuestion,
          options: currentOptions,
          answer: currentAnswer
        });
      }
      
      // Start a new question
      currentQuestion = text;
      currentOptions = [];
      currentAnswer = '';
    }
    // Check if it looks like an option (e.g., "A. Option text")
    else if (currentQuestion && /^[A-D][.)]/i.test(text)) {
      // Extract the option letter and the option text
      const optionLetter = text.charAt(0).toUpperCase();
      const optionText = text.substring(2).trim();
      currentOptions.push(optionText);
      
      // If this option has formatting that suggests it's the answer
      const hasEmphasis = paragraphs[i].querySelector('strong, b, u, em');
      if (hasEmphasis) {
        currentAnswer = optionLetter;
      }
    }
    // Check if this paragraph indicates the correct answer
    else if (currentQuestion && /correct|answer|solution/i.test(text)) {
      // Try to extract the option letter (A, B, C, D)
      const match = text.match(/[A-D]/i);
      if (match) {
        currentAnswer = match[0].toUpperCase();
      }
      
      // If we haven't completed the current question yet, do so now
      if (currentQuestion && currentOptions.length > 0) {
        results.push({
          question: currentQuestion,
          options: currentOptions,
          answer: currentAnswer
        });
        
        currentQuestion = null;
        currentOptions = [];
        currentAnswer = '';
      }
    }
  }
  
  // Add the last question if any
  if (currentQuestion && currentOptions.length > 0) {
    results.push({
      question: currentQuestion,
      options: currentOptions,
      answer: currentAnswer
    });
  }
  
  return results;
};

// PUBLIC_INTERFACE
/**
 * Create column headers for the Excel file based on the number of options
 * @param {number} maxOptions - Maximum number of options in any question
 * @returns {Array} Array of column headers
 */
export const createColumnHeaders = (maxOptions) => {
  const headers = ['Question'];
  
  // Add headers for each option (Option A, Option B, etc.)
  for (let i = 0; i < maxOptions; i++) {
    const optionLetter = String.fromCharCode(65 + i); // Convert 0 to 'A', 1 to 'B', etc.
    headers.push(`Option ${optionLetter}`);
  }
  
  headers.push('Correct Answer');
  return headers;
};

// PUBLIC_INTERFACE
/**
 * Prepare quiz data for Excel export
 * @param {Array} quizData - Array of quiz items with question, options, and answer
 * @returns {Object} Excel workbook data in the format { headers, rows, maxOptions }
 */
export const prepareExcelData = (quizData) => {
  if (!quizData || quizData.length === 0) {
    return { headers: [], rows: [], maxOptions: 0 };
  }
  
  // Find the maximum number of options in any question
  const maxOptions = quizData.reduce(
    (max, item) => Math.max(max, item.options.length), 
    0
  );
  
  // Create headers based on the maximum number of options
  const headers = createColumnHeaders(maxOptions);
  
  // Create rows for each quiz item
  const rows = quizData.map(item => {
    const row = [item.question];
    
    // Add each option, padding with empty strings if needed
    for (let i = 0; i < maxOptions; i++) {
      row.push(item.options[i] || '');
    }
    
    // Add the correct answer
    row.push(item.answer);
    
    return row;
  });
  
  return { headers, rows, maxOptions };
};
