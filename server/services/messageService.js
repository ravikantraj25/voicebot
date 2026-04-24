/**
 * Message Service
 * Provides multilingual voice messages for the Twilio call flow
 * Supports: English, Hindi, Kannada, Marathi
 * Includes multi-level IVR messages for interactive customer support
 */

const messages = {
  english: {
    greeting:
      'Hello! This is an automated call from Automaton AI Infosystem regarding your recent order.',
    prompt:
      'Press 1 to confirm your order. Press 2 to reject your order. Press 3 for order support.',
    confirmed:
      'Thank you! Your order has been confirmed. You will receive a confirmation message shortly. Have a great day!',
    rejected:
      'Your order has been rejected. If you change your mind, you can place a new order anytime. Goodbye!',
    invalid:
      'Sorry, we did not recognize your input. Please try again.',
    noInput:
      'We did not receive any input. Your order will remain pending. Goodbye!',

    // Level 2 — Support Menu
    supportMenu:
      'We are here to help! Press 1 for delivery issues. Press 2 for payment issues. Press 3 for product issues. Press 4 to speak to an agent.',
    
    // Level 3 — Issue Resolutions
    deliveryIssue:
      'We understand your concern about delivery. Our team has been notified and will update the delivery status within 2 hours. You will receive an SMS with tracking details. Is there anything else? Press 1 to go back to main menu, or hang up to end the call.',
    paymentIssue:
      'For payment concerns, please note that refunds are processed within 3 to 5 business days. If the payment was deducted but the order was not placed, it will be auto-refunded within 24 hours. Press 1 to go back to main menu, or hang up to end the call.',
    productIssue:
      'We are sorry about the product issue. A replacement request has been initiated. Our support team will contact you within 24 hours to arrange a pickup and replacement. Press 1 to go back to main menu, or hang up to end the call.',
    agentTransfer:
      'Please hold while we connect you to a customer support agent. Our agents are available Monday to Saturday, 9 AM to 6 PM. If no agent is available, we will call you back within 1 hour. Thank you for your patience!',
    
    // Farewell
    thankYou:
      'Thank you for contacting Automaton AI Infosystem. Have a wonderful day! Goodbye!',

    voice: 'alice',
    language: 'en-US',
  },
  hindi: {
    greeting:
      'नमस्ते! यह Automaton AI Infosystem की ओर से आपके हाल के ऑर्डर के बारे में एक स्वचालित कॉल है।',
    prompt:
      'अपने ऑर्डर की पुष्टि करने के लिए 1 दबाएं। अस्वीकार करने के लिए 2 दबाएं। ऑर्डर सहायता के लिए 3 दबाएं।',
    confirmed:
      'धन्यवाद! आपके ऑर्डर की पुष्टि हो गई है। आपको जल्द ही एक पुष्टि संदेश प्राप्त होगा। आपका दिन शुभ हो!',
    rejected:
      'आपका ऑर्डर अस्वीकार कर दिया गया है। यदि आप अपना मन बदलते हैं, तो आप कभी भी नया ऑर्डर दे सकते हैं। अलविदा!',
    invalid:
      'क्षमा करें, हम आपका इनपुट पहचान नहीं पाए। कृपया पुनः प्रयास करें।',
    noInput:
      'हमें कोई इनपुट नहीं मिला। आपका ऑर्डर पेंडिंग रहेगा। अलविदा!',

    supportMenu:
      'हम आपकी मदद के लिए यहाँ हैं! डिलीवरी समस्या के लिए 1 दबाएं। भुगतान समस्या के लिए 2 दबाएं। उत्पाद समस्या के लिए 3 दबाएं। एजेंट से बात करने के लिए 4 दबाएं।',
    
    deliveryIssue:
      'हम डिलीवरी के बारे में आपकी चिंता समझते हैं। हमारी टीम को सूचित कर दिया गया है और 2 घंटे के भीतर डिलीवरी स्थिति अपडेट करेगी। आपको ट्रैकिंग विवरण के साथ एक SMS प्राप्त होगा। मुख्य मेनू पर वापस जाने के लिए 1 दबाएं, या कॉल समाप्त करने के लिए फोन रखें।',
    paymentIssue:
      'भुगतान संबंधी चिंताओं के लिए, कृपया ध्यान दें कि रिफंड 3 से 5 कार्य दिवसों में प्रोसेस किया जाता है। यदि भुगतान कटा लेकिन ऑर्डर नहीं हुआ, तो 24 घंटे में ऑटो-रिफंड हो जाएगा। मुख्य मेनू के लिए 1 दबाएं।',
    productIssue:
      'उत्पाद समस्या के लिए खेद है। रिप्लेसमेंट अनुरोध शुरू कर दिया गया है। हमारी सपोर्ट टीम 24 घंटे के भीतर पिकअप और रिप्लेसमेंट की व्यवस्था के लिए संपर्क करेगी। मुख्य मेनू के लिए 1 दबाएं।',
    agentTransfer:
      'कृपया प्रतीक्षा करें, हम आपको ग्राहक सहायता एजेंट से जोड़ रहे हैं। हमारे एजेंट सोमवार से शनिवार, सुबह 9 बजे से शाम 6 बजे तक उपलब्ध हैं। धन्यवाद!',
    
    thankYou:
      'Automaton AI Infosystem से संपर्क करने के लिए धन्यवाद। आपका दिन शुभ हो! अलविदा!',

    voice: 'Polly.Aditi',
    language: 'hi-IN',
  },
  kannada: {
    greeting:
      'ನಮಸ್ಕಾರ! ಇದು Automaton AI Infosystem ನಿಂದ ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಆರ್ಡರ್ ಕುರಿತು ಸ್ವಯಂಚಾಲಿತ ಕರೆ.',
    prompt:
      'ನಿಮ್ಮ ಆರ್ಡರ್ ಖಚಿತಪಡಿಸಲು 1 ಒತ್ತಿ. ತಿರಸ್ಕರಿಸಲು 2 ಒತ್ತಿ. ಆರ್ಡರ್ ಸಹಾಯಕ್ಕಾಗಿ 3 ಒತ್ತಿ.',
    confirmed:
      'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಆರ್ಡರ್ ಖಚಿತಪಡಿಸಲಾಗಿದೆ. ನೀವು ಶೀಘ್ರದಲ್ಲೇ ಖಚಿತಪಡಿಸುವ ಸಂದೇಶವನ್ನು ಸ್ವೀಕರಿಸುತ್ತೀರಿ. ಶುಭ ದಿನ!',
    rejected:
      'ನಿಮ್ಮ ಆರ್ಡರ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. ನೀವು ಮನಸ್ಸು ಬದಲಾಯಿಸಿದರೆ, ಯಾವಾಗ ಬೇಕಾದರೂ ಹೊಸ ಆರ್ಡರ್ ಮಾಡಬಹುದು. ವಿದಾಯ!',
    invalid:
      'ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಇನ್‌ಪುಟ್ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    noInput:
      'ನಮಗೆ ಯಾವುದೇ ಇನ್‌ಪುಟ್ ಸಿಕ್ಕಿಲ್ಲ. ನಿಮ್ಮ ಆರ್ಡರ್ ಬಾಕಿ ಇರುತ್ತದೆ. ವಿದಾಯ!',

    supportMenu:
      'ನಾವು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇವೆ! ಡೆಲಿವರಿ ಸಮಸ್ಯೆಗೆ 1 ಒತ್ತಿ. ಪಾವತಿ ಸಮಸ್ಯೆಗೆ 2 ಒತ್ತಿ. ಉತ್ಪನ್ನ ಸಮಸ್ಯೆಗೆ 3 ಒತ್ತಿ. ಏಜೆಂಟ್ ಸಂಪರ್ಕಕ್ಕೆ 4 ಒತ್ತಿ.',
    
    deliveryIssue:
      'ಡೆಲಿವರಿ ಬಗ್ಗೆ ನಿಮ್ಮ ಕಳವಳ ನಾವು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇವೆ. ನಮ್ಮ ತಂಡಕ್ಕೆ ತಿಳಿಸಲಾಗಿದೆ ಮತ್ತು 2 ಗಂಟೆಗಳಲ್ಲಿ ಡೆಲಿವರಿ ಸ್ಥಿತಿ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ. ಮುಖ್ಯ ಮೆನುಗೆ 1 ಒತ್ತಿ.',
    paymentIssue:
      'ಪಾವತಿ ಸಮಸ್ಯೆಗಳಿಗೆ, ಮರುಪಾವತಿ 3 ರಿಂದ 5 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ಪ್ರಕ್ರಿಯೆಗೊಳ್ಳುತ್ತದೆ. ಮುಖ್ಯ ಮೆನುಗೆ 1 ಒತ್ತಿ.',
    productIssue:
      'ಉತ್ಪನ್ನ ಸಮಸ್ಯೆಗೆ ಕ್ಷಮಿಸಿ. ಬದಲಿ ವಿನಂತಿ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ. 24 ಗಂಟೆಗಳಲ್ಲಿ ನಮ್ಮ ತಂಡ ಸಂಪರ್ಕಿಸುತ್ತದೆ. ಮುಖ್ಯ ಮೆನುಗೆ 1 ಒತ್ತಿ.',
    agentTransfer:
      'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ, ನಾವು ನಿಮ್ಮನ್ನು ಗ್ರಾಹಕ ಸೇವಾ ಏಜೆಂಟ್‌ಗೆ ಸಂಪರ್ಕಿಸುತ್ತಿದ್ದೇವೆ. ಧನ್ಯವಾದ!',
    
    thankYou:
      'Automaton AI Infosystem ಅನ್ನು ಸಂಪರ್ಕಿಸಿದಕ್ಕೆ ಧನ್ಯವಾದ. ಶುಭ ದಿನ! ವಿದಾಯ!',

    voice: 'Polly.Aditi',
    language: 'kn-IN',
  },
  marathi: {
    greeting:
      'नमस्कार! हा Automaton AI Infosystem कडून तुमच्या अलीकडील ऑर्डरबद्दल एक स्वयंचलित कॉल आहे.',
    prompt:
      'तुमचा ऑर्डर पुष्टी करण्यासाठी 1 दाबा. नाकारण्यासाठी 2 दाबा. ऑर्डर सहाय्यासाठी 3 दाबा.',
    confirmed:
      'धन्यवाद! तुमच्या ऑर्डरची पुष्टी झाली आहे. तुम्हाला लवकरच पुष्टीकरण संदेश प्राप्त होईल. तुमचा दिवस शुभ असो!',
    rejected:
      'तुमचा ऑर्डर नाकारला गेला आहे. तुम्ही विचार बदलल्यास, कधीही नवीन ऑर्डर देऊ शकता. बाय!',
    invalid:
      'माफ करा, आम्हाला तुमचे इनपुट ओळखता आले नाही. कृपया पुन्हा प्रयत्न करा.',
    noInput:
      'आम्हाला कोणतेही इनपुट मिळाले नाही. तुमचा ऑर्डर पेंडिंग राहील. बाय!',

    supportMenu:
      'आम्ही मदतीसाठी येथे आहोत! डिलिव्हरी समस्येसाठी 1 दाबा. पेमेंट समस्येसाठी 2 दाबा. उत्पाद समस्येसाठी 3 दाबा. एजंटशी बोलण्यासाठी 4 दाबा.',
    
    deliveryIssue:
      'डिलिव्हरीबद्दल तुमची चिंता आम्हाला समजते. आमच्या टीमला कळवले आहे आणि 2 तासांत डिलिव्हरी स्थिती अपडेट होईल. मुख्य मेनूसाठी 1 दाबा.',
    paymentIssue:
      'पेमेंट समस्यांसाठी, रिफंड 3 ते 5 कार्यदिवसांत प्रक्रिया होतो. मुख्य मेनूसाठी 1 दाबा.',
    productIssue:
      'उत्पाद समस्येबद्दल माफ करा. बदली विनंती सुरू केली आहे. 24 तासांत आमची टीम संपर्क करेल. मुख्य मेनूसाठी 1 दाबा.',
    agentTransfer:
      'कृपया थांबा, आम्ही तुम्हाला ग्राहक सेवा एजंटशी जोडत आहोत. धन्यवाद!',
    
    thankYou:
      'Automaton AI Infosystem शी संपर्क केल्याबद्दल धन्यवाद. तुमचा दिवस शुभ असो! बाय!',

    voice: 'Polly.Aditi',
    language: 'mr-IN',
  },
};

/**
 * Get all messages for a specific language
 * @param {string} language - The language key (english, hindi, kannada, marathi)
 * @returns {object} Messages object for the specified language
 */
const getMessages = (language) => {
  return messages[language] || messages.english;
};

/**
 * Get a specific message in a specific language
 * @param {string} language - The language key
 * @param {string} key - The message key (greeting, prompt, confirmed, etc.)
 * @returns {string} The translated message
 */
const getMessage = (language, key) => {
  const langMessages = messages[language] || messages.english;
  return langMessages[key] || messages.english[key];
};

/**
 * Get Twilio voice configuration for a language
 * @param {string} language - The language key
 * @returns {object} Object with voice and language properties
 */
const getVoiceConfig = (language) => {
  const langMessages = messages[language] || messages.english;
  return {
    voice: langMessages.voice,
    language: langMessages.language,
  };
};

module.exports = { getMessages, getMessage, getVoiceConfig };
