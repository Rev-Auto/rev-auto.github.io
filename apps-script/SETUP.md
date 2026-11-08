# Connect the website to a Google Sheet (about 10 minutes)

This gives Rev Auto:

- **A "Bookings" spreadsheet.** Every appointment request lands there, with a reference number and a Status column (New / Confirmed / Done / Cancelled / No-show).
- **Anonymous visit stats.** It records visits, where visitors came from, WhatsApp/Call taps and the questions people ask the chatbot.
- **The private dashboard** at `/pit/`, which opens with a passcode.

Booking emails through Web3Forms keep working exactly as before. The Sheet is an extra copy.

## 1. Create the Sheet

1. Sign in to the Google account that should own the data, then open **https://sheets.new**.
2. Name it **RevAuto: Website**.
3. Later, use **Share** to add Mr. Uriel's Gmail so he can open it too.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete the sample code. Paste in everything from `apps-script/Code.gs`.
3. Click 💾 **Save**, and name the project **RevAuto website**.
4. In the toolbar's function menu, choose **setup**, then click **▶ Run**.
5. Google asks for permission:
   1. Click **Review permissions** and choose your account.
   2. You'll see "Google hasn't verified this app". That's expected, because it's your own script. Click **Advanced → Go to RevAuto website (unsafe) → Allow**.
6. Back in the Sheet, you'll now have **Bookings** and **Events** tabs.

## 3. Set the dashboard passcode

1. In Apps Script, click ⚙️ **Project Settings**, scroll to **Script properties** and click **Add script property**.
2. Fill it in:
   - **Property:** `ADMIN_KEY`
   - **Value:** a long passcode (at least 12 characters). Three or four random words work well, for example `torque-velvet-harbor-91`.
3. Click **Save script properties**.

Share the passcode with Mr. Uriel in person or by private message. After 8 wrong tries, the dashboard locks for 15 minutes.

## 4. Publish it as a web app

1. Click **Deploy → New deployment**.
2. Click ⚙️ next to "Select type" and choose **Web app**:
   - **Description:** `website`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**. This lets the website send bookings. Reading anything back still needs the passcode.
3. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
4. Send that URL to Claude, or paste it into `js/config.js` as `sheetsUrl: "…/exec"` and publish.

## 5. Open the dashboard

**To get there:** on the website, scroll to the very bottom and tap the **© 2026 Rev Auto** line **5 times quickly**. You can also go straight to `https://ftalla18.github.io/revauto/pit/`. Nothing on the site points there, and search engines are told to skip it.

**To sign in:** enter the passcode, leave **Remember this device** checked, and tap **Unlock**. On a phone, use **Share → Add to Home Screen** so it opens like an app.

**Your own visits:** devices that have signed in are left out of visitor counts.

**Preview:** `…/pit/?demo` shows the dashboard with sample data, no passcode needed.

## Changing the script later

1. Paste in the new `Code.gs` and save.
2. Click **Deploy → Manage deployments → ✏️ Edit**, set **Version** to **New version**, and click **Deploy**.
3. The URL stays the same, so the website doesn't need to change.
