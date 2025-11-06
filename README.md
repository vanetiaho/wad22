# WAD2 Project description

This project is a web application built with Vue, Supabase, and other integrated APIs. It helps students and remote workers find the best cafés and study spots by allowing users to search and filter locations based on WiFi quality, noise levels, power outlet availability, and opening hours. It features an interactive map with real-time crowd updates, user reviews and ratings, and personalized profiles to save favorite spots. This makes it easier to find productive, comfortable environments quickly and reliably.


## Live Demo
[mapnmug.vercel.app](mapnmug.vercel.app)

Deployment: Vercel


## How to run
### 1. Download folder/Clone the Repository
Download folder:
- unzip folder
- go to wad22
- right click
- click open in terminal
Clone the repository:
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
VITE_SUPABASE_URL=https://xchbdgltmqopzqetlear.supabase.co
VITE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaGJkZ2x0bXFvcHpxZXRsZWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTMxMTYsImV4cCI6MjA3NzI2OTExNn0.zY2iyT48dPK992ebkI9J9mPymALwKsdQCwYUzROl1IA
VITE_GROQ_API_KEY=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
VITE_GOOGLE_MAPS_API_KEY="AIzaSyAA7BYRoPVf3JMDTNl1o_SkeLZULU-dpGA"
```
### 4. Run the App Locally
Start the development server:
```bash
npm run dev
```
Then open your browser and navigate to:
```bash
http://localhost:5173
```


## Features
1. **Home**
   Use navbar to navigate explore the this webpage
2. **Map**
   Explore cafes based on your filtering and find your way there with directions!
3. **Community**
   Browse reviews from various cafes and add your own review to earn points!
4. **Tasks**
   Earn points by updating Real-Time Crowd Level and test yourself using the study Planner AI
5. **Rewards**
   Redeem and use rewards at your favourite cafes
6. **Study streaks: Pic of the Day**
    Log in everyday to increase your study streak and earn points
7. **Profile icon**
    

