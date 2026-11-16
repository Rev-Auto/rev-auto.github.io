# Handing the Google side over to Rev Auto's Gmail (about 15 minutes, together)

The website stays on GitHub (Rev-Auto organization). Only the Google part moves: the **RevAuto: Website** Sheet,
its script (bookings, emails, dashboard, website content) and the two Drive photo folders.
Everything keeps working; the website needs **one line** changed at the end.
After that, Mr. Uriel connects his Instagram (step 5) so new reels show up on the website by themselves.

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
   The list includes "connect to an external service" and "run when you are not present": that's the hourly Instagram check (step 5).
3. **Deploy → New deployment** → ⚙️ **Web app** → Execute as **Me**, Who has access **Anyone** → **Deploy**.
4. Copy the **Web app URL** (ends in `/exec`) and send it to Freeman.

## 3. Switch the website over (Freeman)
- In `js/config.js`, replace `sheetsUrl` with the new URL, then publish. (Claude can do this.)
- Test: send a booking with a photo → the email arrives at revautosrq@gmail.com **from** revautosrq → tap Approve.

## 4. Clean up (you)
1. Apps Script → **Deploy → Manage deployments** → select the **old** one → **Archive**.
2. Apps Script → ⏰ **Triggers** (left bar): delete any trigger whose **Owner** is you (`syncInstagram`, `refreshInstagramToken`).
   His own ones, made when he ran **setup**, stay.
3. Remove yourself from the Sheet and the two folders if you no longer need access.
4. Optional: Mr. Uriel changes the dashboard passcode (`ADMIN_KEY` in Project Settings → Script properties).

Booking emails, confirmations to customers and the photos are now all on Rev Auto's account. Your Gmail is out of the loop.

## 5. Connect Instagram (Mr. Uriel, about 15 minutes, once)
New reels on @revautosrq then show up on the website by themselves (the newest 12), checked every hour.
Until this is done, or if Instagram ever stops answering, the website shows its built-in videos, so the strip is never empty.

**a. Make @revautosrq a professional account** (skip if it already is)
In the Instagram app: **Settings → Account type and tools → Switch to professional account** → **Business** (or Creator). Free.

**b. Create the Meta app** (on a computer, signed in to **his** Facebook)
1. Open **developers.facebook.com** → **Get started** if asked (accept the terms) → **My Apps → Create app**.
2. Name: **Rev Auto website**, contact email `revautosrq@gmail.com`.
3. Use case: **Manage messaging & content on Instagram** → Next → no business portfolio needed → **Create app**.
4. In the app, open **Instagram → API setup with Instagram login**.
5. Under **Generate access tokens**, click **Add account** and log in as **@revautosrq**. Allow access.
6. Click **Generate token** next to @revautosrq, tick "I understand", and **copy the token** (a long line of letters and numbers).
   Treat it like a password: paste it only into the next step.

The app can stay in **Development** mode: it only reads his own account, so Meta's app review isn't needed.
Screens on Meta's site get renamed now and then; the steps stay the same.

**c. Give the token to the website's script**
1. In the Sheet: **Extensions → Apps Script → ⚙️ Project Settings → Script properties → Add script property**.
2. Property `IG_TOKEN`, value: the token. **Save script properties**.
3. Back in the editor (◇ Editor), choose **setup** → **▶ Run**. The log should end with **Instagram: N reels found.**

**d. Check it**
Open the dashboard → **🌐 Website → From the shop floor**. It shows "✓ Instagram connected" and his reels.
Untick **Show on website** on any reel he doesn't want there, then **Publish**. **Videos on the website → Default videos** switches back to the built-in videos at any time.

The token lasts 60 days and the script renews it every Monday on its own. If Instagram ever stops working, the website
switches to the built-in videos by itself and revautosrq@gmail.com gets one email about it. To reconnect: repeat **b.6** and **c**.
