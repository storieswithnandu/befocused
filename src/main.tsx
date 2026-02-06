import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

import { db } from './db/db';

// Simple seed for this session
db.populateTimetable().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <App />
    );
});
