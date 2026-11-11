# Handing the Google side over to Rev Auto's Gmail (about 15 minutes, together)

The website stays on GitHub (Rev-Auto organization). Only the Google part moves: the **RevAuto: Website** Sheet,
its script (bookings, emails, dashboard, website content) and the two Drive photo folders.
Everything keeps working; the website needs **one line** changed at the end.

Do it with Mr. Uriel signed in to **revautosrq@gmail.com** on his computer or phone.

## 1. Move ownership (you)
1. Open the **RevAuto: Website** Sheet → **Share** → add `revautosrq@gmail.com` as **Editor** → Send.
2. In **Share**, next to his address choose **Transfer ownership** → Send invitation. He accepts it from the email.
3. In Google Drive, open **RevAuto · booking photos (private)** and **RevAuto · website photos (public)**.
   For each: share the folder with him as Editor, select the folder **and all files inside** → Share → **Transfer ownership**.

The script, its passcode and settings travel with the Sheet; nothing needs to be typed again.

## 2. Make the script run as Rev Auto (Mr. Uriel)
1. In the Sheet: **Extensions → Apps Script**. Paste the latest `Code.gs` from this folder and click 💾.
2. Choose **setup** → **▶ Run** → **Review permissions** → his account → **Advanced → Go to RevAuto website (unsafe) → Allow**.
3. **Deploy → New deployment** → ⚙️ **Web app** → Execute as **Me**, Who has access **Anyone** → **Deploy**.
4. Copy the **Web app URL** (ends in `/exec`) and send it to Freeman.

## 3. Switch the website over (Freeman)
- In `js/config.js`, replace `sheetsUrl` with the new URL, then publish. (Claude can do this.)
- Test: send a booking with a photo → the email arrives at revautosrq@gmail.com **from** revautosrq → tap Approve.

## 4. Clean up (you)
1. Apps Script → **Deploy → Manage deployments** → select the **old** one → **Archive**.
2. Remove yourself from the Sheet and the two folders if you no longer need access.
3. Optional: Mr. Uriel changes the dashboard passcode (`ADMIN_KEY` in Project Settings → Script properties).

Booking emails, confirmations to customers and the photos are now all on Rev Auto's account. Your Gmail is out of the loop.
