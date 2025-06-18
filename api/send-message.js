// api/send-message.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to and message' 
      });
    }

    // Clean phone number
    const cleanNumber = to.replace(/[^\d]/g, '');
    
    // Validate Indonesian phone number
    if (!cleanNumber.startsWith('62') || cleanNumber.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Indonesian phone number format' 
      });
    }

    // Using TextMeBot API (you need to register and get API key)
    const TEXTMEBOT_API_KEY = process.env.TEXTMEBOT_API_KEY;
    const TEXTMEBOT_INSTANCE = process.env.TEXTMEBOT_INSTANCE;

    if (!TEXTMEBOT_API_KEY || !TEXTMEBOT_INSTANCE) {
      return res.status(500).json({ 
        success: false, 
        error: 'TextMeBot configuration missing' 
      });
    }

    const response = await fetch(`https://api.textmebot.com/send.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'apikey': TEXTMEBOT_API_KEY,
        'instance': TEXTMEBOT_INSTANCE,
        'number': cleanNumber,
        'message': message
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message || 'Failed to send message'
      });
    }

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}