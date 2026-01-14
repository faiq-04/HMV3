// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore, collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALG5rqXdMdJLVY3Sm9An4pmCCoflYUn7g",
  authDomain: "healmind-2025.firebaseapp.com",
  projectId: "healmind-2025",
  storageBucket: "healmind-2025.firebasestorage.app",
  messagingSenderId: "815736974240",
  appId: "1:815736974240:web:46d83a46fae313961612c5",
  measurementId: "G-Q113X0VYS2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

let moodData = {};
let currentViewDate = new Date();
let selectedDateStr = "";
const emojis = ['😊', '😐', '☹️', '😡', '😴', '💪'];
let selectedEmoji = "";

async function loadMoodData() {
    try {
        const snapshot = await getDocs(collection(db, "mood_entries"));
        snapshot.forEach((doc) => {
            moodData[doc.id] = doc.data();
        });
    } catch (error) {
        console.error("Error loading mood data:", error);
        }
}
document.addEventListener("DOMContentLoaded", async () => {
    await loadMoodData();
    initEmoji();

    // Auto-select today's date
    const today = new Date();
    selectedDateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    document.getElementById("displayDate").innerText = selectedDateStr;
    
    // Load today's data if exists
    const todayData = moodData[selectedDateStr] || {emoji:"", stress:5, note:""};
    document.getElementById("stressLevel").value = todayData.stress;
    document.getElementById("stressVal").innerText = todayData.stress;
    document.getElementById("dailyNote").value = todayData.note;

    render();
    document.getElementById("prevBtn").onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); render(); };
    document.getElementById("nextBtn").onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); render(); };

    document.getElementById("todayBtn").onclick = () => { 
        currentViewDate = new Date(); 
        const today = new Date();
        selectedDateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        document.getElementById("displayDate").innerText = selectedDateStr;
        const todayData = moodData[selectedDateStr] || {emoji:"", stress:5, note:""};
        document.getElementById("stressLevel").value = todayData.stress;
        document.getElementById("stressVal").innerText = todayData.stress;
        document.getElementById("dailyNote").value = todayData.note;
        render(); 
    };

    document.getElementById("stressLevel").oninput = (e) => document.getElementById("stressVal").innerText = e.target.value;
    document.getElementById("saveBtn").onclick = save;
});

function initEmoji() {
    const container = document.getElementById("emojiOptions");
    emojis.forEach(e => {
        const btn = document.createElement("button");
        btn.className = "bg-slate-800 p-2 rounded-lg text-xl hover:bg-slate-700 transition border-2 border-transparent";
        btn.innerText = e;
        btn.onclick = () => {
            selectedEmoji = e;
            Array.from(container.children).forEach(c => c.style.borderColor = "transparent");
            btn.style.borderColor = "#f472b6";
        };
        container.appendChild(btn);
    });
}

function render() {
    const cal = document.getElementById("calendar");
    cal.innerHTML = "";
    const y = currentViewDate.getFullYear(), m = currentViewDate.getMonth();
    document.getElementById("monthDisplay").innerText = currentViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    for(let i=0; i<first; i++) cal.appendChild(document.createElement("div"));

    for(let d=1; d<=days; d++) {
        const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cell = document.createElement("div");
        cell.className = "calendar-day";
        if (dateStr === todayStr) cell.classList.add("today");
        if (dateStr === selectedDateStr) cell.classList.add("active");
        
        cell.innerHTML = `<span class="day-num">${d}</span>`;
        if (moodData[dateStr]) {
            const mDiv = document.createElement("div");
            mDiv.className = "day-mood";
            mDiv.innerText = moodData[dateStr].emoji;
            cell.appendChild(mDiv);

                    
        if (moodData[dateStr].note) {
            cell.title = moodData[dateStr].note;
        }
        }
        cell.onclick = () => {
            selectedDateStr = dateStr;
            document.getElementById("displayDate").innerText = dateStr;
            const data = moodData[dateStr] || {emoji:"", stress:5, note:""};
            document.getElementById("stressLevel").value = data.stress;
            document.getElementById("stressVal").innerText = data.stress;
            document.getElementById("dailyNote").value = data.note;
            render();
        };
        cal.appendChild(cell);
    }
}

async function save() {
    if(!selectedDateStr) return alert("Select a date!");
    
    const moodEntry = {
        emoji: selectedEmoji,
        stress: document.getElementById("stressLevel").value,
        note: document.getElementById("dailyNote").value
    };
    
    try {
        await setDoc(doc(db, "mood_entries", selectedDateStr), moodEntry);
        moodData[selectedDateStr] = moodEntry;
        render();
        alert("Mood Saved!");
    } catch (error) {
        console.error("Error saving mood:", error);
        alert("Error saving mood.");
    }
}
