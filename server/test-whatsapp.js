/**
 * Quick test script to verify WhatsApp messaging via Twilio
 * Sends a test message to the configured number
 */
require('dotenv').config();
const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const WHATSAPP_TO = 'whatsapp:+91'; // From Twilio console screenshot

async function testWhatsApp() {
  console.log('🔧 WhatsApp Test Configuration:');
  console.log(`   Account SID: ${ACCOUNT_SID}`);
  console.log(`   From: ${WHATSAPP_FROM}`);
  console.log(`   To: ${WHATSAPP_TO}`);
  console.log('');

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    console.log('📤 Sending WhatsApp test message...');
    const message = await client.messages.create({
      body: '📦 *Automaton AI Infosystem*\n\nHi! This is a test message from Voice Order Bot.\n\nYour WhatsApp integration is working correctly! ✅\n\n_Sent at: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '_',
      from: WHATSAPP_FROM,
      to: WHATSAPP_TO,
    });

    console.log('');
    console.log('✅ WhatsApp message sent successfully!');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   Date Sent: ${message.dateCreated}`);
    console.log(`   Direction: ${message.direction}`);
    console.log(`   Price: ${message.price || 'N/A'}`);
  } catch (error) {
    console.error('');
    console.error('❌ WhatsApp message FAILED!');
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    
    if (error.code === 21608) {
      console.error('');
      console.error('💡 FIX: The recipient must first send a message to the Twilio');
      console.error('   WhatsApp Sandbox number. Ask them to send "join <keyword>"');
      console.error('   to +14155238886 on WhatsApp.');
    } else if (error.code === 63007) {
      console.error('');
      console.error('💡 FIX: Message delivery failed. The recipient may not have');
      console.error('   opted into the WhatsApp Sandbox, or the number is invalid.');
    }
  }
}

testWhatsApp();
