# WAD2 Project description

This project is a web application built with Vue, Supabase, and other integrated APIs. It helps students and remote workers find the best cafés and study spots by allowing users to search and filter locations based on WiFi quality, noise levels, power outlet availability, and opening hours. It features an interactive map with real-time crowd updates, user reviews and ratings, and personalized profiles to save favorite spots. This makes it easier to find productive, comfortable environments quickly and reliably.


## Live Demo
[mapnmug.vercel.app](mapnmug.vercel.app)

Deployment: Vercel


## How to run
### 1. Clone the Repository
```bash
git clone https://github.com/vanetiaho/wad22.git
cd wad22
```
### 2. Install Dependencies
Make sure you have Node.js (v18 or higher) installed.
```bash
npm install
```
### 3. Set Up Environment Variables
**a. If .env provided**<br>
Place .env file in the root of the project.

**b. If the `.env` file is NOT provided**<br>
Create a .env file in the root directory and add the following variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
### 4. Generating Your Own API Keys
#### Supabase
1. Go to [Supabase](https://supabase.com)
2. Create a new project.  
3. In your Supabase dashboard, navigate to Settings → API.  
4. Copy your Project URL and anon public key.  
5. Paste them into your `.env` file as shown above.  

#### Groq API
1. Go to [Groq](https://console.groq.com)
2. Create a new API key.
3. Add it to `.env` as VITE_GROQ_API_KEY.

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Maps JavaScript API.
3. Generate an API key.
4. Paste it in `.env` as VITE_GOOGLE_MAPS_API_KEY.

### 5. Run the App Locally
Start the development server:
```bash
npm run dev
```
Then open your browser and navigate to:
```bash
http://localhost:5173
```


## Group members:
- Vanetia
- szeteng
- huai en
- afra
- jie ying


## Features
1. **Interactive Map Integration**

2. **User Reviews and Ratings System**

3. **Personal User Profiles and Favorites**

4. **Real-Time Crowd Level Updates and Study Planner**

5. **Study Streak: Pic of the Day**
