// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'          // ← your Tailwind + custom vars
import App from './App.jsx'   // ← the file you just updated

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
