import { generateChatResponse } from '../services/ai.service.js';
import { escapeForLLM, sanitizeCodeString } from '../utils/sanitization.utils.js';
import { logResourceEvent } from '../services/audit.service.js';

export async function chatWithAI(req, res, next) {
  const userId = req.user ? req.user.id : null;
  try {
    const { message, currentCode, language, context } = req.body;

    if (!message || !currentCode) {
      logResourceEvent(userId, 'CHAT_WITH_AI', 'Chatbot', null, 'FAILURE', { reason: "Message and current code are required." });
      return res.status(400).json({
        error: "Message and current code are required."
      });
    }

    // Sanitize user inputs
    const sanitizedMessage = escapeForLLM(message);
    const sanitizedCurrentCode = sanitizeCodeString(currentCode); // Use sanitizeCodeString for code
    const sanitizedContext = escapeForLLM(context);

    // Build a prompt for the AI to improve the test code
    const prompt = `As an AI testing expert, help improve this ${language} test code. 

User Request: ${sanitizedMessage}

Current Test Code:
\`\`\`${language}
${sanitizedCurrentCode}
\`\`\`

Context: ${sanitizedContext || 'General test improvement'}

Please provide:
1. A helpful response explaining what improvements can be made
2. An improved version of the test code with better practices, edge cases, and assertions
3. Specific suggestions for better test coverage

Format your response as:
- Explanation of improvements
- Improved code block
- Additional recommendations`;

    // Use the AI service to generate a response
    const aiResponse = await generateChatResponse(prompt);
    logResourceEvent(userId, 'CHAT_WITH_AI', 'Chatbot', null, 'SUCCESS', { language, messageLength: message.length });
    res.status(200).json({
      message: aiResponse.message,
      suggestedCode: aiResponse.suggestedCode,
      recommendations: aiResponse.recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    logResourceEvent(userId, 'CHAT_WITH_AI', 'Chatbot', null, 'FAILURE', { error: error.message, details: req.body });
    next(error);
  }
}

export async function analyzeTestCoverage(req, res, next) {
  const userId = req.user ? req.user.id : null;
  try {
    const { testCode, sourceCode, language } = req.body;

    if (!testCode || !sourceCode || !language) {
      logResourceEvent(userId, 'ANALYZE_COVERAGE', 'Chatbot', null, 'FAILURE', { reason: "Test code, source code, and language are required." });
      return res.status(400).json({
        error: "Test code, source code, and language are required."
      });
    }

    // Sanitize user inputs
    const sanitizedTestCode = sanitizeCodeString(testCode);
    const sanitizedSourceCode = sanitizeCodeString(sourceCode);
    const sanitizedLanguage = escapeForLLM(language);

    const prompt = `Analyze the test coverage for this ${sanitizedLanguage} code.

Source Code:
\`\`\`${sanitizedLanguage}
${sanitizedSourceCode}
\`\`\`

Test Code:
\`\`\`${sanitizedLanguage}
${sanitizedTestCode}
\`\`\`

Please provide:
1. Coverage analysis (what's tested vs. what's missing)
2. Suggestions for additional test cases
3. Edge cases that should be covered
4. Any potential improvements to existing tests`;

    const aiResponse = await generateChatResponse(prompt);
    logResourceEvent(userId, 'ANALYZE_COVERAGE', 'Chatbot', null, 'SUCCESS', { language, testCodeLength: testCode.length, sourceCodeLength: sourceCode.length });
    res.status(200).json({
      coverage: aiResponse.coverage,
      missingTests: aiResponse.missingTests,
      suggestions: aiResponse.suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Coverage analysis error:', error);
    logResourceEvent(userId, 'ANALYZE_COVERAGE', 'Chatbot', null, 'FAILURE', { error: error.message, details: req.body });
    next(error);
  }
}
