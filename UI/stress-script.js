// --- FIREBASE SETUP ---
// settings from firebase console
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, onSnapshot, orderBy, where, Timestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyALG5rqXdMdJLVY3Sm9An4pmCCoflYUn7g",
    authDomain: "healmind-2025.firebaseapp.com",
    projectId: "healmind-2025",
    storageBucket: "healmind-2025.firebasestorage.app",
    messagingSenderId: "815736974240",
    appId: "1:815736974240:web:46d83a46fae313961612c5",
    measurementId: "G-Q113X0VYS2"
};

// initialize app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// chart variables
var historyChart;
var weeklyChart;
var lastUpdateTime = null;
var stressHistory = [];

// colors based on stress level 
function getStatusColor(prob) {
    if (prob < 30) {
        return { label: 'Normal', text: 'SuccessText', glass: 'BadgeBase BadgeSuccess', color: '#4ade80' };
    } else if (prob < 70) {
        return { label: 'Moderate', text: 'WarningText', glass: 'BadgeBase BadgeWarning', color: '#facc15' };
    } else {
        return { label: 'High Stress', text: 'DangerText', glass: 'BadgeBase BadgeDanger', color: '#f87171' };
    }
}

// advice messages
function getAdvice(prob) {
    if (prob < 30) {
        return "Stay focused, you're doing great!";
    }
    if (prob < 70) {
        return "Keep it up, you can handle this!";
    }
    return "Take a breather, you got this!";
}

// Load weekly data from Firestore
async function loadWeeklyData() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const q = query(
        collection(db, "stress_predictions"),
        where("prediction_timestamp", ">=", Timestamp.fromDate(weekAgo)),
        orderBy("prediction_timestamp")
    );
    
    const weeklyData = [[], [], [], [], [], [], []];
    
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        const data = doc.data();
        const timestamp = data.prediction_timestamp?.toDate() || new Date();
        const dayIndex = timestamp.getDay();
        const realIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        
        let prob = 0;
        if (data.stress_probabilities && 'high' in data.stress_probabilities) {
            const low = data.stress_probabilities.low || 0;
            const moderate = data.stress_probabilities.moderate || 0;
            const high = data.stress_probabilities.high || 0;
            prob = (low * 0) + (moderate * 50) + (high * 100);
        }
        
        weeklyData[realIndex].push(prob);
    });
    
    const averages = weeklyData.map(day => {
        if (day.length === 0) return 0;
        return day.reduce((a, b) => a + b, 0) / day.length;
    });
    
    weeklyChart.data.datasets[0].data = averages;
    weeklyChart.update();
}

// create charts on load
function initCharts() {
    // 24h timeline
    var ctxHistory = document.getElementById('historyChart').getContext('2d');
    historyChart = new Chart(ctxHistory, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Stress %',
                data: [],
                borderColor:function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return '#60a5fa';
                    
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, '#4ade80');
                    gradient.addColorStop(0.3, '#facc15');
                    gradient.addColorStop(1, '#f87171');
                    return gradient;
                },
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#60a5fa',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#60a5fa',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        const status = getStatusColor(context.raw);
                        return `Stress: ${Math.round(context.raw)}% - ${status.label}`;
                    }
                }
            }
        },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 0, maxTicksLimit: 8 } },
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // weekly breakdown
    var ctxWeekly = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(ctxWeekly, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Avg Stress %',
                borderColor: function (context) {
                    var chart = context.chart;
                    var ctx = chart.ctx;
                    var chartArea = chart.chartArea;
                    if (!chartArea) return null;

                    // line color based on height
                    var gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, '#4ade80'); // green good
                    gradient.addColorStop(0.5, '#facc15'); // yellow okay
                    gradient.addColorStop(1, '#f87171'); // red stressed
                    return gradient;
                },
                backgroundColor: 'rgba(255,255,255,0.02)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 8,
                pointHitRadius: 10,
                pointHoverBackgroundColor: '#60a5fa',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#60a5fa',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            var status = getStatusColor(context.raw);
                            return 'Stress: ' + Math.round(context.raw) + '% - ' + status.label;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// update screen text and charts
function updateUI(items) {
    if (items.length === 0) return;

    // get latest
    var currentItem = items[items.length - 1];
    var statusInfo = getStatusColor(currentItem.prob);

    // update main cards 
    var labelElement = document.getElementById('status-label');
    labelElement.textContent = statusInfo.label;
    labelElement.className = 'StatusLarge ' + statusInfo.text;

    document.getElementById('prob-value').textContent = Math.round(currentItem.prob) + '%';
    var probStatus = document.getElementById('prob-status');
    probStatus.textContent = currentItem.prob > 70 ? 'CRITICAL' : 'STABLE';
    probStatus.className = statusInfo.glass;

    // find the highest stress recorded today
    var peakStress = Math.max.apply(Math, items.map(function (item) { return item.prob; }));
    document.getElementById('avg-value').textContent = Math.round(peakStress) + '%';

    var avgStress = items.reduce((a, b) => a + b.prob, 0) / items.length;

    // Trend indicator
    let trendArrow = '→';
    let trendColor = '#94a3b8';
    if (items.length >= 5) {
        const recent = items.slice(-5);
        const firstHalf = recent.slice(0, 2).reduce((a, b) => a + b.prob, 0) / 2;
        const secondHalf = recent.slice(-2).reduce((a, b) => a + b.prob, 0) / 2;
        
        if (secondHalf > firstHalf + 10) {
            trendArrow = '↑';
            trendColor = '#f87171';
        } else if (secondHalf < firstHalf - 10) {
            trendArrow = '↓';
            trendColor = '#4ade80';
        }
    }

    document.getElementById('time-subtext').innerHTML = 
    `Live: ${currentItem.time.toLocaleTimeString()} | Avg: ${Math.round(avgStress)}% <span style="color:${trendColor}; font-weight:bold; font-size:1.2em;">${trendArrow}</span>`;
    // update advice
    document.getElementById('advice-text').textContent = getAdvice(currentItem.prob);

    // update history graph
    const displayItems = items.slice(-50); // Last 50 readings
    historyChart.data.labels = displayItems.map(function (d) {
        return d.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    historyChart.data.datasets[0].data = displayItems.map(function (d) {
        return d.prob;
    });
    historyChart.update('none');
    
    // store for export
    stressHistory = items;
    lastUpdateTime = new Date();
}

// start logic
initCharts();
loadWeeklyData();

// firebase listener
const q = query(collection(db, "stress_predictions"));
onSnapshot(q, (snapshot) => {
    console.log("firebase found data: ", snapshot.size);
    var items = [];

    snapshot.forEach((doc) => {
        var itemData = doc.data();

        // get time
        var timeValue = itemData.prediction_timestamp || itemData.timestamp || new Date();
        if (timeValue && typeof timeValue.toDate === 'function') {
            timeValue = timeValue.toDate();
        } else {
            timeValue = new Date(timeValue);
        }

        // Handle BOTH 2-class and 3-class formats
        var probValue = 0;
        
        if (itemData.stress_probabilities) {
            // New 3-class format
            if ('high' in itemData.stress_probabilities) {
                var low = itemData.stress_probabilities.low || 0;
                var moderate = itemData.stress_probabilities.moderate || 0;
                var high = itemData.stress_probabilities.high || 0;
                
                probValue = (low * 0) + (moderate * 50) + (high * 100);
            }
            // Old 2-class format
            else if ('class_1' in itemData.stress_probabilities) {
                probValue = itemData.stress_probabilities.class_1;
                if (probValue <= 1 && probValue > 0) {
                    probValue = probValue * 100;
                }
            }
            // Alternative 2-class format
            else if (itemData.stress_probabilities['1'] !== undefined) {
                probValue = itemData.stress_probabilities['1'];
                if (probValue <= 1 && probValue > 0) {
                    probValue = probValue * 100;
                }
            }
        }
        // Fallback
        else if (itemData.probability !== undefined) {
            probValue = itemData.probability;
            if (probValue <= 1 && probValue > 0) {
                probValue = probValue * 100;
            }
        }

        items.push({
            id: doc.id,
            time: timeValue,
            prob: probValue
        });
    });

    if (items.length > 0) {
        // sort by time
        items.sort(function (a, b) {
            return a.time - b.time;
        });
        updateUI(items);
    } else {
        console.warn("no data...");
    }
}, (error) => {
    console.error("firebase error: ", error);
    var statusEl = document.getElementById('status-label');
    if (statusEl) {
        statusEl.textContent = "Sync Error";
        statusEl.classList.add('DangerText');
    }
});