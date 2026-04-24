const axios = require('axios');

/**
 * Build the authenticated Exotel API URL.
 * Exotel uses HTTP Basic Auth with API Key as username and API Token as password,
 * embedded directly in the URL (as shown in their official curl examples).
 */
const getAuthUrl = (path) => {
  const apiKey = process.env.EXOTEL_API_KEY;
  const apiToken = process.env.EXOTEL_API_TOKEN;
  const subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
  const accountSid = process.env.EXOTEL_ACCOUNT_SID;
  return `https://${apiKey}:${apiToken}@${subdomain}/v1/Accounts/${accountSid}${path}`;
};

/**
 * Initiate an Exotel outbound call.
 * 
 * How Exotel connect.json works:
 *   - 'From' = Customer phone number (Exotel dials this number FIRST)
 *   - 'To'   = Agent phone number OR ExoPhone (Exotel dials this SECOND and bridges the call)
 *   - 'CallerId' = Your ExoPhone number (what customer sees on caller ID)
 *   - 'Url'  = (Optional) ExoML URL fetched when call connects, for IVR/greeting
 * 
 * For a voice bot scenario where we just want to play a greeting/IVR to the customer:
 *   - From = customer number
 *   - To   = same as CallerId (the ExoPhone, so the call bridges to itself)
 *   - Url  = our server endpoint that returns ExoML instructions
 */
const initiateCall = async (phoneNumber, orderId, language) => {
  try {
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const callerId = process.env.EXOTEL_PHONE_NUMBER; // Your ExoPhone

    const params = new URLSearchParams();
    params.append('From', cleanPhone);          // Customer's number (must be whitelisted in trial)
    params.append('CallerId', callerId);        // Caller ID shown to customer
    params.append('CallType', 'trans');          // Transactional call
    
    // Instead of bridging to 'To' (which triggers KYC blocks in trial mode),
    // we directly execute the Applet (Flow) URL. 
    // App ID 1231414 is the 'sportsnews1 Landing Flow' from the user's screenshots.
    const appUrl = `http://my.exotel.com/${process.env.EXOTEL_SUBDOMAIN}/exoml/start_voice/1231414`;
    params.append('Url', appUrl);
    
    params.append('StatusCallback', `${baseUrl}/api/exotel/status?orderId=${orderId}`);
    params.append('CustomField', JSON.stringify({ orderId, language }));

    console.log(`📞 Initiating Exotel call to ${cleanPhone} via CallerID ${callerId}...`);

    const response = await axios.post(
      getAuthUrl('/Calls/connect.json'),
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const callSid = response.data?.Call?.Sid;
    console.log(`📞 Exotel call initiated: SID=${callSid}, To=${cleanPhone}`);
    return { sid: callSid };
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error(`❌ Exotel call error:`, JSON.stringify(errData, null, 2));
    throw new Error(`Exotel API Error: ${JSON.stringify(errData)}`);
  }
};

/**
 * Send SMS/WhatsApp fallback (placeholder — Exotel SMS requires DLT registration)
 */
const sendWhatsAppFallback = async (order) => {
  console.log(`📱 [Exotel] SMS Fallback triggered for ${order.phoneNumber}`);
  return { sid: 'mock_sid' };
};

/**
 * Send SMS/WhatsApp confirmation (placeholder)
 */
const sendWhatsAppConfirmation = async (order) => {
  console.log(`📱 [Exotel] Confirmation triggered for ${order.phoneNumber}`);
  return { sid: 'mock_sid' };
};

module.exports = { initiateCall, sendWhatsAppFallback, sendWhatsAppConfirmation };
