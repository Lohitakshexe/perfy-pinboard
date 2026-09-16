# Perfy Pinboard 📌✨

Hey! So I built this because I really needed a cool, freeform digital pinboard to just throw all my notes, thoughts, and checklists on without feeling restricted by normal list apps. It's basically a massive infinite canvas where you can drag and drop colorful sticky notes, resize them exactly how you want, and organize your chaotic brain!

<!-- ADD YOUR SCREENSHOT BELOW THIS LINE BY DRAGGING AND DROPPING IT IN THE GITHUB WEB EDITOR -->
<p align="center">
  <i>(Screenshot goes here!)</i>
</p>

I spent a bunch of time getting the note scaling and dragging to feel *just right* (seriously, try resizing the notes using the corner handle vs the side handles—it's super smooth and text scales perfectly now!).

### What it does:
- ♾️ **Infinite Canvas**: Zoom in, zoom out, pan around. It's a massive board.
- 📝 **Sticky Notes**: Add sticky notes with titles and content.
- 🎨 **Colors**: Pick cool colors for your notes to keep things categorized.
- 📐 **Smart Resizing**: 
  - Drag the **corner handle** to scale the whole note up (perfect for BIG priority notes that you want to read from far away).
  - Drag the **right or bottom handles** to just change the physical size of the note and let the text naturally wrap and reflow. 
- ✅ **Checklists**: Just type `[ ]` and it magically turns into a beautiful, clickable custom checkbox! The whole row is clickable so it's super touch-friendly.
- 🗑️ **Trash Bin**: Drag a note to the bottom of the screen to delete it.

## How to run it yourself 🛠️

If you wanna spin this up locally or build the Android app, here's what you need to do. It's built with **Next.js** for the web stuff, **Capacitor** to wrap it into an Android app, and **Supabase** for the backend database.

### 1. Setup Supabase
1. Create a free account on [Supabase](https://supabase.com).
2. Create a new project.
3. In the SQL editor, run this to create the table:
```sql
create table notes (
  id text primary key,
  x float not null,
  y float not null,
  width float not null,
  height float not null,
  color text not null,
  title text not null,
  content text not null,
  deleted_at timestamp with time zone
);
```
4. Grab your Project URL and Anon Key from the API settings.

### 2. Local Setup
1. Clone this repo: `git clone https://github.com/Lohitakshexe/perfy-pinboard.git`
2. Run `bun install`.
3. Rename the `.env.example` file to `.env.local` and paste your Supabase URL and Key in there.
4. Run `bun run dev` and open `http://localhost:3000` to see it working on the web!

### 3. Building the Android App 📱
1. Make sure you have Android Studio installed.
2. Run a full web build first: `bun run build`
3. Sync it to Capacitor: `bunx cap sync android`
4. Open the Android project in Android Studio to build the APK, or just run `cd android && ./gradlew assembleDebug` in the terminal.

Hope you like it! Let me know if you run into any weird bugs lol.
