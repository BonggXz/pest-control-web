// === Vercel API Function: sendWA.js ===

import admin from "firebase-admin";
import fetch from "node-fetch";

// Inisialisasi Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pest-control-system-393aa-default-rtdb.asia-southeast1.firebasedatabase.app"
});
}

export default async function handler(req, res) {
  try {
    const db = admin.database();
    const ref = db.ref("schedule/wa");
    const snapshot = await ref.once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ sent: false, reason: "No WA schedule set." });
    }

    const { date, message } = snapshot.val();
    const today = new Date().toISOString().split("T")[0];

    if (date !== today) {
      return res.status(200).json({ sent: false, reason: "Today is not the scheduled date." });
    }

    const phone = "628xxxxxxxxxx"; // ganti dengan nomor WA petani (awali dengan 62)
    const encodedMessage = encodeURIComponent(message);
    const apiKey = process.env.TEXTMEBOT_APIKEY;

    const url = `https://textmebot.com/send.php?recipient=${phone}&apikey=${apiKey}&text=${encodedMessage}`;
    const response = await fetch(url);
    const text = await response.text();

    // (Opsional) Reset pesan setelah dikirim
    await ref.set(null); // Hapus pesan WA setelah dikirim

    return res.status(200).json({ sent: true, response: text });
  } catch (error) {
    return res.status(500).json({ sent: false, error: error.message });
  }
}
