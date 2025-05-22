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
  // Split the content by common question separators (numbers followed by period or parenthesis)
  const questionsHtml = splitIntoQuestions(htmlContent);
  
  // Process each question block
  return questionsHtml
    .map(parseQuestionBlock)
    .filter(item => item !== null); // Remove any failed parses
};

/**
 * Split HTML content into individual question blocks
 * @param {string} htmlContent - The HTML content from the Word document
 * @returns {Array} Array of HTML strings, each representing a question block
 */
const splitIntoQuestions = (htmlContent) => {
  // Create a temporary element to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Convert to plain text to make it easier to process
  const textContent = tempDiv.textContent;
  
  // Find potential question starters using regex
  // This looks for patterns like "1.", "2)", "Question 1:", etc.
  const questionRegex = /(?:\n|\r|\r\n)(?:\d+[\.\):]|[A-Za-z][\.\):])(?:\s+|$)|(?:\n|\r|\r\n)Question\s+\d+[\.\:]/gi;
  
  // Get the positions of all matches
  const matches = [];
  let match;
  while ((match = questionRegex.exec(textContent)) !== null) {
    matches.push({
      index: match.index,
      text: match[0]
    });
  }

  // If no question patterns were found, try to split by paragraphs
  if (matches.length === 0) {
    const paragraphs = tempDiv.querySelectorAll('p');
    const result = [];
    
    let currentQuestion = '';
    let questionStarted = false;
    
    // Group paragraphs that seem to be part of the same question
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].textContent.trim();
      
      // If paragraph seems to be a question (ends with ? or has "?" and is not too long)
      if (para.endsWith('?') || (para.includes('?') && para.length < 200)) {
        // If we already have a current question, add it to results
        if (questionStarted) {
          result.push(currentQuestion);
          currentQuestion = '';
        }
        questionStarted = true;
        currentQuestion += paragraphs[i].outerHTML;
      } 
      // If paragraph looks like options (starts with A., B., etc.)
      else if (/^[A-D][\.\)]/.test(para) && questionStarted) {
        currentQuestion += paragraphs[i].outerHTML;
      } 
      // If paragraph indicates the correct answer
      else if (/correct|answer|solution/i.test(para) && questionStarted) {
        currentQuestion += paragraphs[i].outerHTML;
        result.push(currentQuestion);
        currentQuestion = '';
        questionStarted = false;
      } 
      // Otherwise just add it to the current question if one is in progress
      else if (questionStarted) {
        currentQuestion += paragraphs[i].outerHTML;
      }
    }
    
    // Add the last question if any
    if (currentQuestion) {
      result.push(currentQuestion);
    }
    
    return result;
  }
  
  // Split content based on the identified question starters
  const result = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : textContent.length;
    
    // Get the HTML content corresponding to this question block
    // We need to map text positions back to HTML
    const textBeforeQuestion = textContent.substring(0, start);
    const textOfQuestion = textContent.substring(start, end);
    
    // Count how many text nodes to skip to get to our question
    const textNodesBefore = textBeforeQuestion.split(/\n|\r|\r\n/).length;
    
    // Extract HTML nodes that correspond to this question
    const questionHtml = extractHTMLForTextRange(tempDiv, textNodesBefore, textOfQuestion);
    
    if (questionHtml) {
      result.push(questionHtml);
    }
  }
  
  return result;
};

/**
 * Extract HTML content that corresponds to a specific text range
 * @param {Element} container - DOM element containing the HTML
 * @param {number} startNodeIndex - Index to start looking from
 * @param {string} textToFind - Text content to locate
 * @returns {string} HTML content for the specified range
 */
const extractHTMLForTextRange = (container, startNodeIndex, textToFind) => {
  // This is a simplified approach - in a real implementation, you would need
  // a more robust algorithm to map text positions to HTML nodes
  const nodes = container.querySelectorAll('*');
  let html = '';
  let foundStart = false;
  let textFound = '';
  
  for (let i = startNodeIndex; i < nodes.length; i++) {
    const node = nodes[i];
    if (!foundStart && node.textContent.trim()) {
      foundStart = true;
    }
    
    if (foundStart) {
      html += node.outerHTML || '';
      textFound += node.textContent || '';
      
      // If we've captured enough text, stop
      if (textFound.length >= textToFind.length) {
        break;
      }
    }
  }
  
  return html;
};

/**
 * Parse a question block to extract the question, options, and answer
 * @param {string} questionHtml - HTML string representing a question block
 * @returns {Object|null} Object with question, options, and answer, or null if parsing failed
 */
const parseQuestionBlock = (questionHtml) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = questionHtml;
  
  // Extract text content
  const textContent = tempDiv.textContent.trim();
  
  // Try to find the question text (usually ends with a question mark)
  const questionEndIndex = textContent.indexOf('?') + 1;
  if (questionEndIndex <= 0) return null; // No question found
  
  // Extract question text
  let questionText = textContent.substring(0, questionEndIndex).trim();
  
  // Remove any question numbering prefix (like "1. " or "Q1: ")
  questionText = questionText.replace(/^(\d+[\.\):]\s*|[A-Za-z][\.\):]\s*|Question\s+\d+[\.\:]\s*)/i, '').trim();
  
  // Get the text after the question (contains options and answer)
  const optionsText = textContent.substring(questionEndIndex).trim();
  
  // Extract options (looking for patterns like A., B., C., etc.)
  const optionMatches = optionsText.match(/[A-Z][\.\)]\s*[^\n\r]*([\n\r]|$)/g) || [];
  
  const options = optionMatches.map(match => {
    // Remove the option label (A., B., etc.) and clean up
    return match.replace(/^[A-Z][\.\)]\s*/i, '').trim();
  }).filter(option => option.length > 0);
  
  // Try to identify the correct answer
  // Look for patterns like "Answer: A" or "Correct: C" or just "B"
  const answerMatch = optionsText.match(/(?:answer|correct|solution):?\s*([A-Z])[\.\)]/i) ||
                      optionsText.match(/\b([A-Z])[\.\)]\s*(?:is\s+(?:the\s+)?correct|is\s+(?:the\s+)?right)\b/i);
  
  let answer = '';
  if (answerMatch) {
    answer = answerMatch[1]; // This would be just the letter (A, B, C, etc.)
  }
  
  // If we couldn't extract options or find an answer, try alternative approaches
  if (options.length === 0) {
    // Try to find options in list elements
    const listItems = tempDiv.querySelectorAll('li');
    if (listItems.length > 0) {
      for (let i = 0; i < listItems.length; i++) {
        const text = listItems[i].textContent.trim();
        options.push(text);
        
        // If the list item has a bold or underlined element, it might be the correct answer
        if (listItems[i].querySelector('strong, b, u, em') && !answer) {
          answer = String.fromCharCode(65 + i); // Convert to A, B, C, etc.
        }
      }
    }
  }
  
  // Return the structured quiz item
  return {
    question: questionText,
    options: options,
    answer: answer
  };
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
