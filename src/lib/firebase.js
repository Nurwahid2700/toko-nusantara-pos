// src/firebase.js

// 1. Import fungsi yang dibutuhkan dari SDK Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";       // Tambahan: Untuk Login
import { getFirestore } from "firebase/firestore"; // Tambahan: Untuk Database

// 2. Konfigurasi Firebase Kamu (Ini ID unik project kamu)
const firebaseConfig = {
  apiKey: "AIzaSyD6Ur2Ce78t9-dOXg_bLUIoC4WCGgIcObE",
  authDomain: "tokonusantara-12fca.firebaseapp.com",
  projectId: "tokonusantara-12fca",
  storageBucket: "tokonusantara-12fca.firebasestorage.app",
  messagingSenderId: "460690777200",
  appId: "1:460690777200:web:e9b908f93b873925c800b5",
  measurementId: "G-VF7JPZGVNP"
};

// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// 4. Export layanan agar bisa dipakai di file lain (Login.jsx, POS.jsx, dll)
export const auth = getAuth(app);
export const db = getFirestore(app);