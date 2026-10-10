# 💊 DawaiSaathi - Smart Medicine & Generic Alternative Finder

DawaiSaathi is a full-stack MERN healthcare application designed to help users search for medicines, find generic alternatives, and interact with an integrated AI health assistant.

🚀 **Live Frontend:** [https://dawaisaathi.netlify.app](https://dawaisaathi.netlify.app)

---

## ✨ Features
- 🔍 **Medicine Search:** Find detailed medicine information including active salts.
- 💊 **Generic Alternatives:** Discover cost-effective generic medicine substitutes.
- 🤖 **AI Assistant:** Integrated AI health chatbot powered by Google Gemini API.
- 🔐 **User Authentication:** Secure Sign Up / Sign In functionality using JWT.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **AI Integration:** Google Gemini API
- **Deployment:** Netlify (Frontend) + Render (Backend)

---

## ⚙️ Environment Variables Setup

Create a `.env` file in your backend root folder and add the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
