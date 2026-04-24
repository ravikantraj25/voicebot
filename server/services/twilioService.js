/**
 * Twilio Service — Enhanced
 * Handles voice calling with recording, and WhatsApp fallback
 */
const twilio = require('twilio');

let client = null;

const getClient = () => {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

/**
 * Initiate a voice call with recording enabled
 */
const initiateCall = async (phoneNumber, orderId, language) => {
  try {
    const twilioClient = getClient();
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${baseUrl}/api/twilio/voice?orderId=${orderId}&language=${language}`,
      method: 'POST',
      statusCallback: `${baseUrl}/api/twilio/status?orderId=${orderId}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      record: true, // Enable call recording
      recordingStatusCallback: `${baseUrl}/api/twilio/recording?orderId=${orderId}`,
      recordingStatusCallbackMethod: 'POST',
      timeout: 25, // 25 seconds before triggering WhatsApp fallback
    });

    console.log(`📞 Call initiated: SID=${call.sid}, To=${phoneNumber}`);
    return call;
  } catch (error) {
    console.error(`❌ Twilio call error: ${error.message}`);
    throw error;
  }
};

/**
 * Send WhatsApp fallback message when call goes unanswered
 */
const sendWhatsAppFallback = async (order) => {
  try {
    const twilioClient = getClient();
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    // Build message based on language
    const productInfo = order.productName
      ? `${order.productQty}x ${order.productName} — ₹${order.productPrice}`
      : 'your recent order';

    const messages = {
      english: `📦 *Automaton AI Infosystem*\n\nHi! We tried calling you about ${productInfo}.\n\nReply *YES* to confirm or *NO* to cancel.\n\n_This is an automated message._`,
      hindi: `📦 *Automaton AI Infosystem*\n\nनमस्ते! हमने ${productInfo} के बारे में आपको कॉल किया था।\n\n*YES* लिखें पुष्टि के लिए या *NO* रद्द करने के लिए।`,
      kannada: `📦 *Automaton AI Infosystem*\n\nನಮಸ್ಕಾರ! ${productInfo} ಬಗ್ಗೆ ನಿಮಗೆ ಕರೆ ಮಾಡಿದ್ದೆವು.\n\nಖಚಿತಪಡಿಸಲು *YES* ಅಥವಾ ರದ್ದು ಮಾಡಲು *NO* ಟೈಪ್ ಮಾಡಿ.`,
      marathi: `📦 *Automaton AI Infosystem*\n\nनमस्कार! ${productInfo} बद्दल तुम्हाला कॉल केला होता.\n\nपुष्टीसाठी *YES* किंवा रद्द करण्यासाठी *NO* टाइप करा.`,
    };

    const body = messages[order.language] || messages.english;

    const cleanPhone = order.phoneNumber.replace(/\s+/g, '');

    const msg = await twilioClient.messages.create({
      body,
      from: whatsappFrom,
      to: `whatsapp:${cleanPhone}`,
    });

    console.log(`📱 WhatsApp sent to ${order.phoneNumber}: ${msg.sid}`);
    return msg;
  } catch (error) {
    console.error(`❌ WhatsApp error: ${error.message}`);
    // Don't throw — WhatsApp is a fallback, shouldn't break the flow
    return null;
  }
};

/**
 * Send WhatsApp confirmation after order is confirmed or rejected via voice call
 */
const sendWhatsAppConfirmation = async (order) => {
  try {
    const twilioClient = getClient();
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    const productInfo = order.productName
      ? `${order.productQty}x ${order.productName} — ₹${order.productPrice}`
      : 'your recent order';

    const isConfirmed = order.status === 'confirmed';

    const messages = {
      english: isConfirmed
        ? `✅ *Order Confirmed!*\n\n*Automaton AI Infosystem*\n\nThank you! Your order of ${productInfo} has been *confirmed* successfully.\n\nWe will process your order shortly. You'll receive delivery updates soon.\n\n_Thank you for choosing us!_ 🙏`
        : `❌ *Order Cancelled*\n\n*Automaton AI Infosystem*\n\nYour order of ${productInfo} has been *cancelled* as per your request.\n\nIf you change your mind, feel free to place a new order anytime.\n\n_We're sorry to see you go!_ 😔`,

      hindi: isConfirmed
        ? `✅ *ऑर्डर कन्फर्म हो गया!*\n\n*Automaton AI Infosystem*\n\nधन्यवाद! आपका ${productInfo} का ऑर्डर सफलतापूर्वक *कन्फर्म* हो गया है।\n\nहम जल्द ही आपका ऑर्डर प्रोसेस करेंगे।\n\n_हमें चुनने के लिए शुक्रिया!_ 🙏`
        : `❌ *ऑर्डर रद्द किया गया*\n\n*Automaton AI Infosystem*\n\nआपके अनुरोध पर ${productInfo} का ऑर्डर *रद्द* कर दिया गया है।\n\nकभी भी नया ऑर्डर दे सकते हैं।`,

      kannada: isConfirmed
        ? `✅ *ಆರ್ಡರ್ ಖಚಿತಪಡಿಸಲಾಗಿದೆ!*\n\n*Automaton AI Infosystem*\n\nಧನ್ಯವಾದ! ನಿಮ್ಮ ${productInfo} ಆರ್ಡರ್ *ಖಚಿತಪಡಿಸಲಾಗಿದೆ*.\n\nನಾವು ಶೀಘ್ರದಲ್ಲೇ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತೇವೆ. 🙏`
        : `❌ *ಆರ್ಡರ್ ರದ್ದು ಮಾಡಲಾಗಿದೆ*\n\n*Automaton AI Infosystem*\n\n${productInfo} ಆರ್ಡರ್ ರದ್ದು ಮಾಡಲಾಗಿದೆ. ಯಾವಾಗ ಬೇಕಾದರೂ ಮತ್ತೆ ಆರ್ಡರ್ ಮಾಡಬಹುದು.`,

      marathi: isConfirmed
        ? `✅ *ऑर्डर कन्फर्म झाला!*\n\n*Automaton AI Infosystem*\n\nधन्यवाद! ${productInfo} चा ऑर्डर *कन्फर्म* झाला आहे.\n\nआम्ही लवकरच प्रक्रिया करू. 🙏`
        : `❌ *ऑर्डर रद्द केला*\n\n*Automaton AI Infosystem*\n\n${productInfo} चा ऑर्डर रद्द केला गेला आहे. कधीही नवीन ऑर्डर देऊ शकता.`,
    };

    const body = messages[order.language] || messages.english;

    const cleanPhone = order.phoneNumber.replace(/\s+/g, '');

    const msg = await twilioClient.messages.create({
      body,
      from: whatsappFrom,
      to: `whatsapp:${cleanPhone}`,
    });

    console.log(`📱 WhatsApp ${order.status} confirmation sent to ${order.phoneNumber}: ${msg.sid}`);
    return msg;
  } catch (error) {
    console.error(`❌ WhatsApp confirmation error: ${error.message}`);
    return null;
  }
};

module.exports = { initiateCall, getClient, sendWhatsAppFallback, sendWhatsAppConfirmation };
