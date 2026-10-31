const activitiesData = {
    muscu: [
        "Développé couché (Barre)",
        "Développé / Curl aux haltères",
        "Kettlebell Swing / Squat"
    ],
    cardio_indoor: [
        "Vélo d'appartement",
        "Tapis de course (Maison)",
        "Corde à sauter",
        "Séance Vidéo : Insanity",
        "Séance Vidéo : Tibo Inshape",
        "Séance Vidéo : Danse / Just Dance",
        "Session Wii Sports"
    ],
    cardio_outdoor: [
        "Course à pied / Trail / Outdoor",
        "Foot en salle",
        "Entraînement foot en herbe",
        "Match en herbe"
    ],
    etirements: [
        "Séance d'étirements & Souplesse",
        "Mobilité / Récupération",
        "Yoga",
        "Pilates"
    ],
    marche: [
        "Marche quotidienne (Pas)"
    ]
};

let currentExercises = [];
let currentPhotoBase64 = null;
let currentCalendarDate = new Date();
let evolutionChartInstance = null;

// --- NAVIGATION ENTRE LES VUES ---
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    if (viewName === 'tracker') {
        document.getElementById('section-tracker').style.display = 'block';
        document.querySelector('button[onclick="switchView(\'tracker\')"]').classList.add('active');
    } else if (viewName === 'calendar') {
        document.getElementById('section-calendar').style.display = 'block';
        document.querySelector('button[onclick="switchView(\'calendar\')"]').classList.add('active');
        renderCalendar();
    } else if (viewName === 'stats') {
        document.getElementById('section-stats').style.display = 'block';
        document.querySelector('button[onclick="switchView(\'stats\')"]').classList.add('active');
        renderStats();
        updateChart();
    }
}

// --- FORMULAIRE DE SAISIE ---
function toggleInputs() {
    const category = document.getElementById('category').value;
    const activitySelect = document.getElementById('activity');
    
    activitySelect.innerHTML = "";
    if (activitiesData[category]) {
        activitiesData[category].forEach(act => {
            let option = document.createElement('option');
            option.value = act;
            option.textContent = act;
            activitySelect.appendChild(option);
        });
    }
    toggleActivitySpecifics();
}

function toggleActivitySpecifics() {
    const category = document.getElementById('category').value;
    const activity = document.getElementById('activity').value;

    const muscuInputs = document.getElementById('muscu-inputs');
    const runningInputs = document.getElementById('running-inputs');
    const stepsInputs = document.getElementById('steps-inputs');
    const durationInputs = document.getElementById('duration-inputs');

    muscuInputs.style.display = 'none';
    runningInputs.style.display = 'none';
    stepsInputs.style.display = 'none';
    durationInputs.style.display = 'none';

    if (category === 'muscu') {
        muscuInputs.style.display = 'block';
    } else if (category === 'marche') {
        stepsInputs.style.display = 'block';
    } else if (activity === 'Course à pied / Trail / Outdoor') {
        runningInputs.style.display = 'block';
    } else {
        durationInputs.style.display = 'block';
    }
}

window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workout-date').value = today;
    toggleInputs();
    loadHistory();
};

function addExerciseToSession() {
    const category = document.getElementById('category').value;
    const activity = document.getElementById('activity').value;

    let exerciseObj = { category, activity };

    if (category === 'muscu') {
        exerciseObj.weight = parseFloat(document.getElementById('weight').value) || 0;
        exerciseObj.reps = parseInt(document.getElementById('reps').value) || 0;
        exerciseObj.sets = parseInt(document.getElementById('sets').value) || 0;
    } else if (category === 'marche') {
        exerciseObj.steps = parseInt(document.getElementById('steps-count').value) || 0;
    } else if (activity === 'Course à pied / Trail / Outdoor') {
        exerciseObj.runType = document.getElementById('run-type').value;
        exerciseObj.distance = parseFloat(document.getElementById('run-distance').value) || 0;
        exerciseObj.elevation = parseInt(document.getElementById('run-elevation').value) || 0;
        exerciseObj.speed = parseFloat(document.getElementById('run-speed').value) || 0;
        exerciseObj.duration = parseInt(document.getElementById('run-duration').value) || 0;
    } else {
        exerciseObj.duration = parseInt(document.getElementById('duration').value) || 0;
    }

    currentExercises.push(exerciseObj);
    updateCurrentSessionDisplay();

    document.getElementById('weight').value = '';
    document.getElementById('reps').value = '';
    document.getElementById('sets').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('run-distance').value = '';
    document.getElementById('run-elevation').value = '';
    document.getElementById('run-speed').value = '';
    document.getElementById('run-duration').value = '';
    document.getElementById('steps-count').value = '';
}

function removeExerciseFromSession(index) {
    currentExercises.splice(index, 1);
    updateCurrentSessionDisplay();
}

function updateCurrentSessionDisplay() {
    const box = document.getElementById('current-session-box');
    const list = document.getElementById('current-exercises-list');
    
    if (currentExercises.length === 0) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    list.innerHTML = '';
    
    currentExercises.forEach((ex, index) => {
        let li = document.createElement('li');
        li.className = 'exercise-item-row';
        
        let textSpan = document.createElement('span');
        if (ex.category === 'muscu') {
            textSpan.textContent = `${ex.activity} : ${ex.sets}x${ex.reps} à ${ex.weight}kg`;
        } else if (ex.category === 'marche') {
            textSpan.textContent = `${ex.activity} : 🚶‍♂️ ${ex.steps} pas`;
        } else if (ex.runType) {
            textSpan.textContent = `${ex.activity} (${ex.runType}) : ${ex.distance} km, ${ex.duration} min`;
        } else {
            textSpan.textContent = `${ex.activity} : ⏱️ ${ex.duration} min`;
        }

        let delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'delete-ex-btn';
        delBtn.textContent = '❌';
        delBtn.onclick = () => removeExerciseFromSession(index);

        li.appendChild(textSpan);
        li.appendChild(delBtn);
        list.appendChild(li);
    });
}

// --- GESTION & COMPRESSION PHOTO ---
function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 700; // Taille idéale pour mobile sans saturer la mémoire
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compression JPEG à 70%
            currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById('photo-preview').src = currentPhotoBase64;
            document.getElementById('photo-preview-container').style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearPhoto() {
    currentPhotoBase64 = null;
    document.getElementById('workout-photo').value = '';
    document.getElementById('photo-preview').src = '';
    document.getElementById('photo-preview-container').style.display = 'none';
}

// --- ENREGISTREMENT DE LA SÉANCE ---
document.getElementById('workout-form').addEventListener('submit', function(e) {
    e.preventDefault();

    if (currentExercises.length === 0) {
        alert("Ajoute au moins un élément avant de valider !");
        return;
    }

    const rawDate = document.getElementById('workout-date').value;
    const totalDuration = parseInt(document.getElementById('total-duration').value) || 0;
    const notes = document.getElementById('notes').value;

    let workoutSession = {
        date: rawDate,
        totalDuration: totalDuration,
        exercises: [...currentExercises],
        notes: notes,
        photo: currentPhotoBase64
    };

    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    workouts.push(workoutSession);
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    try {
        localStorage.setItem('workouts', JSON.stringify(workouts));
    } catch (err) {
        alert("Mémoire pleine ! Pense à exporter tes données ou supprimer d'anciennes photos.");
        return;
    }

    currentExercises = [];
    clearPhoto();
    document.getElementById('workout-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workout-date').value = today;

    toggleInputs();
    updateCurrentSessionDisplay();
    loadHistory();
    alert("Séance enregistrée avec succès ! 💪");
});

function loadHistory() {
    const historyList = document.getElementById('history-list');
    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];

    if (workouts.length === 0) {
        historyList.innerHTML = `<p class="empty">Aucune séance enregistrée pour l'instant.</p>`;
        return;
    }

    historyList.innerHTML = "";
    workouts.forEach((w, index) => {
        let exercisesHtml = "";
        w.exercises.forEach(ex => {
            if (ex.category === 'muscu') {
                exercisesHtml += `<div>🏋️‍♂️ ${ex.activity} : ${ex.sets} séries x ${ex.reps} reps à ${ex.weight} kg</div>`;
            } else if (ex.category === 'marche') {
                exercisesHtml += `<div>🚶‍♂️ ${ex.activity} : ${ex.steps} pas</div>`;
            } else if (ex.runType) {
                exercisesHtml += `<div>🏃‍♂️ ${ex.activity} [${ex.runType}] : ${ex.distance} km - ${ex.duration} min (${ex.speed} km/h) - D+ ${ex.elevation}m</div>`;
            } else {
                exercisesHtml += `<div>⏱️ ${ex.activity} : ${ex.duration} minutes</div>`;
            }
        });

        let formattedDate = new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

        let item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong>📅 ${formattedDate}</strong>
                <div>
                    ${w.totalDuration > 0 ? `<small style="color: #ff6b6b; font-weight: bold; display:inline; margin-right: 8px;">⏱️ ${w.totalDuration} min</small>` : ''}
                    <button onclick="deleteWorkout(${index})" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:0.9rem;">🗑️</button>
                </div>
            </div>
            <div style="margin: 6px 0;">${exercisesHtml}</div>
            ${w.notes ? `<small>💬 ${w.notes}</small>` : ''}
            ${w.photo ? `<img src="${w.photo}" class="history-photo" alt="Photo de la séance">` : ''}
        `;
        historyList.appendChild(item);
    });
}

function deleteWorkout(index) {
    if (confirm("Veux-tu vraiment supprimer cette séance ?")) {
        let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
        workouts.splice(index, 1);
        localStorage.setItem('workouts', JSON.stringify(workouts));
        loadHistory();
    }
}

// --- CALENDRIER & STREAK ---
function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    const streakInfo = document.getElementById('streak-info');
    
    grid.innerHTML = "";

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const options = { month: 'long', year: 'numeric' };
    monthYearLabel.textContent = currentCalendarDate.toLocaleDateString('fr-FR', options);

    const daysOfWeek = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];
    daysOfWeek.forEach(d => {
        let headerDiv = document.createElement('div');
        headerDiv.className = 'calendar-day-header';
        headerDiv.textContent = d;
        grid.appendChild(headerDiv);
    });

    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    let workoutDates = new Set(workouts.map(w => w.date));

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        let emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty-slot';
        grid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= totalDays; day++) {
        let dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;

        let formattedMonth = String(month + 1).padStart(2, '0');
        let formattedDay = String(day).padStart(2, '0');
        let dateString = `${year}-${formattedMonth}-${formattedDay}`;

        if (workoutDates.has(dateString)) {
            dayDiv.classList.add('has-workout');
        }

        grid.appendChild(dayDiv);
    }

    calculateStreak(workouts, streakInfo);
}

function calculateStreak(workouts, container) {
    if (workouts.length === 0) {
        container.innerHTML = "🔥 Streak : 0 jour";
        return;
    }

    let dates = [...new Set(workouts.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let todayStr = new Date().toISOString().split('T')[0];
    
    let lastWorkoutDate = new Date(dates[0]);
    let today = new Date(todayStr);
    let diffTime = Math.abs(today - lastWorkoutDate);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
        container.innerHTML = "🔥 Streak : 0 jour (reprends aujourd'hui !)";
        return;
    }

    let expectedDate = new Date(dates[0]);
    for (let i = 0; i < dates.length; i++) {
        let dStr = expectedDate.toISOString().split('T')[0];
        if (dates.includes(dStr)) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (i === 0) {
            expectedDate.setDate(expectedDate.getDate() - 1);
            let dStr2 = expectedDate.toISOString().split('T')[0];
            if (dates.includes(dStr2)) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    let milestoneBadge = "";
    if (streak >= 7) {
        milestoneBadge = `<div class="milestone-alert">🏆 PALIER ATTEINT : Perfect Week (1 Semaine d'affilée !) 🔥🔥🔥</div>`;
    } else if (streak >= 5) {
        milestoneBadge = `<div class="milestone-alert">⚡ PALIER ATTEINT : 5 Jours de feu ! 🚀</div>`;
    } else if (streak >= 3) {
        milestoneBadge = `<div class="milestone-alert">🔥 PALIER ATTEINT : 3 Jours consécutifs ! Bien joué !</div>`;
    }

    container.className = streak >= 3 ? "streak-fire-box" : "";
    container.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: bold;">🔥 Streak actuelle : ${streak} jour${streak > 1 ? 's' : ''} d'affilée !</div>
        ${milestoneBadge}
    `;
}

// --- GRAPHIQUES D'ÉVOLUTION (CHART.JS) ---
function updateChart() {
    const filter = document.getElementById('chart-filter').value;
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];

    // Trier du plus ancien au plus récent pour l'axe horizontal du graphique
    let chronologicalWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    let labels = [];
    let dataPoints = [];
    let chartLabel = "";
    let borderColor = "#ff6b6b";

    chronologicalWorkouts.forEach(w => {
        let shortDate = new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

        w.exercises.forEach(ex => {
            if (filter === 'run_distance' && ex.activity === 'Course à pied / Trail / Outdoor' && ex.distance > 0) {
                labels.push(shortDate);
                dataPoints.push(ex.distance);
                chartLabel = "Distance (km)";
                borderColor = "#2ecc71";
            } else if (filter === 'run_speed' && ex.activity === 'Course à pied / Trail / Outdoor' && ex.speed > 0) {
                labels.push(shortDate);
                dataPoints.push(ex.speed);
                chartLabel = "Vitesse moy. (km/h)";
                borderColor = "#3498db";
            } else if (filter === 'steps' && ex.category === 'marche' && ex.steps > 0) {
                labels.push(shortDate);
                dataPoints.push(ex.steps);
                chartLabel = "Nombre de pas";
                borderColor = "#f1c40f";
            } else if (filter.startsWith('muscu_')) {
                let targetExercise = filter.replace('muscu_', '');
                if (ex.category === 'muscu' && ex.activity === targetExercise && ex.weight > 0) {
                    labels.push(shortDate);
                    dataPoints.push(ex.weight);
                    chartLabel = "Charge soulevée (kg)";
                    borderColor = "#ff6b6b";
                }
            }
        });
    });

    if (evolutionChartInstance) {
        evolutionChartInstance.destroy();
    }

    evolutionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Aucune donnée'],
            datasets: [{
                label: chartLabel || 'Sélection',
                data: dataPoints.length > 0 ? dataPoints : [0],
                borderColor: borderColor,
                backgroundColor: borderColor + '33',
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointRadius: 4,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e0e0e0', font: { size: 12 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#aaa' },
                    grid: { color: '#333' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#aaa' },
                    grid: { color: '#333' }
                }
            }
        }
    });
}

// --- STATS, RANGS DE SAISON & SUCCÈS (ACHIEVEMENTS) ---
function renderStats() {
    const statsContent = document.getElementById('stats-content');
    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];

    if (workouts.length === 0) {
        statsContent.innerHTML = `<p class="empty">Aucune donnée statistique pour l'instant.</p>`;
        return;
    }

    let maxWeights = {}; 
    let totalRunningKm = 0;
    let totalRunningElevation = 0;
    let totalSteps = 0;
    let stepsCountEntries = 0;
    let totalYogaSessions = 0;
    let totalFootballSessions = 0;

    let now = new Date();
    let fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    let seasonSteps = 0;
    let seasonRunningKm = 0;

    workouts.forEach(w => {
        let wDate = new Date(w.date);
        let isRecent = wDate >= fourteenDaysAgo;

        w.exercises.forEach(ex => {
            if (ex.category === 'muscu') {
                if (!maxWeights[ex.activity] || ex.weight > maxWeights[ex.activity]) {
                    maxWeights[ex.activity] = ex.weight;
                }
            } else if (ex.activity === 'Course à pied / Trail / Outdoor') {
                totalRunningKm += ex.distance;
                totalRunningElevation += ex.elevation;
                if (isRecent) seasonRunningKm += ex.distance;
            } else if (ex.category === 'marche') {
                totalSteps += ex.steps;
                stepsCountEntries++;
                if (isRecent) seasonSteps += ex.steps;
            } else if (ex.activity === 'Yoga' || ex.activity === "Séance d'étirements & Souplesse") {
                totalYogaSessions++;
            } else if (ex.category === 'cardio_outdoor' && ex.activity.includes('foot')) {
                totalFootballSessions++;
            }
        });
    });

    let avgSteps = stepsCountEntries > 0 ? Math.round(totalSteps / stepsCountEntries) : 0;

    function getSeasonRank(type, val) {
        if (val === 0 || isNaN(val)) return `<div class="rank-card rank-unranked"><div class="rank-title">Saison : ${type}</div><div class="rank-badge">⚪ UNRANKED</div><small>Aucune activité récente</small></div>`;

        let name = "Bronze";
        let cls = "rank-bronze";

        if (type === "Marche") {
            if (val >= 100000) { name = "Grandmaster 🔴"; cls = "rank-grandmaster"; }
            else if (val >= 70000) { name = "Master 🟣"; cls = "rank-master"; }
            else if (val >= 50000) { name = "Diamant 💎"; cls = "rank-diamond"; }
            else if (val >= 35000) { name = "Platine 🌿"; cls = "rank-platinum"; }
            else if (val >= 20000) { name = "Or 🥇"; cls = "rank-gold"; }
            else if (val >= 10000) { name = "Argent 🥈"; cls = "rank-silver"; }
        } else if (type === "Course") {
            if (val >= 50) { name = "Grandmaster 🔴"; cls = "rank-grandmaster"; }
            else if (val >= 30) { name = "Master 🟣"; cls = "rank-master"; }
            else if (val >= 20) { name = "Diamant 💎"; cls = "rank-diamond"; }
            else if (val >= 12) { name = "Platine 🌿"; cls = "rank-platinum"; }
            else if (val >= 6) { name = "Or 🥇"; cls = "rank-gold"; }
            else if (val >= 3) { name = "Argent 🥈"; cls = "rank-silver"; }
        }

        return `<div class="rank-card ${cls}"><div class="rank-title">Rang Saison (14j) : ${type}</div><div class="rank-badge">${name}</div><small>Score récent : ${val.toLocaleString()}</small></div>`;
    }

    let html = '';

    html += `<h3 style="margin-top:5px; margin-bottom:8px;">🎮 Rangs de Saison (Quinzaine)</h3>`;
    html += getSeasonRank("Marche", seasonSteps);
    html += getSeasonRank("Course", seasonRunningKm);

    html += `<h3 style="margin-top:15px; margin-bottom:8px;">🏆 Succès & Achievements (À vie)</h3>`;

    const achievements = [
        { title: "Premier Pas", desc: "Enregistrer sa toute première séance", unlocked: workouts.length > 0 },
        { title: "Marcheur du Dimanche", desc: "Cumuler 20 000 pas au total", unlocked: totalSteps >= 20000 },
        { title: "Globe-Trotter", desc: "Atteindre 100 000 pas cumulés", unlocked: totalSteps >= 100000 },
        { title: "Légende de la Marche", desc: "Franchir les 500 000 pas ! (Hardcore)", unlocked: totalSteps >= 500000 },
        { title: "Joggeur Amateur", desc: "Courir 10 km au total", unlocked: totalRunningKm >= 10 },
        { title: "Fondu de Bitume", desc: "Courir 50 km au total", unlocked: totalRunningKm >= 50 },
        { title: "Maître Zen 🧘", desc: "Compléter 5 séances de yoga ou d'étirements", unlocked: totalYogaSessions >= 5 },
        { title: "Esprit Divin de la Mobilité", desc: "Compléter 20 séances de yoga / souplesse", unlocked: totalYogaSessions >= 20 },
        { title: "Buteur du Dimanche", desc: "Enregistrer 3 matchs ou entraînements de foot", unlocked: totalFootballSessions >= 3 },
        { title: "Machine de Guerre 🏋️", desc: "Soulever au moins 50 kg sur un exercice de muscu", unlocked: Object.values(maxWeights).some(w => w >= 50) }
    ];

    achievements.forEach(ach => {
        html += `
            <div class="achievement-item ${ach.unlocked ? 'unlocked' : ''}">
                <div class="achievement-info">
                    <h4>${ach.title}</h4>
                    <p>${ach.desc}</p>
                </div>
                <div class="achievement-status">${ach.unlocked ? '✅' : '🔒'}</div>
            </div>
        `;
    });

    html += `<h3 style="margin-top:15px; margin-bottom:8px;">🏋️‍♂️ Records de Poids (Muscu)</h3>`;
    if (Object.keys(maxWeights).length > 0) {
        for (let act in maxWeights) {
            html += `<div class="stat-card"><h4>${act}</h4><p>${maxWeights[act]} kg</p><small>Poids maximal soulevé</small></div>`;
        }
    } else {
        html += `<p style="color:#777; font-size:0.9rem; margin-bottom:10px;">Aucun record de musculation enregistré.</p>`;
    }

    html += `<h3 style="margin-top:15px; margin-bottom:8px;">🏃‍♂️ Course à pied & Trail</h3>`;
    html += `<div class="stat-card"><h4>Distance Totale Parcourue</h4><p>${totalRunningKm.toFixed(1)} km</p><small>Cumul de toutes tes sorties</small></div>`;
    html += `<div class="stat-card"><h4>Dénivelé Positif Cumulé</h4><p>${totalRunningElevation} m D+</p><small>Effort vertical total</small></div>`;

    html += `<h3 style="margin-top:15px; margin-bottom:8px;">🚶‍♂️ Marche & Pas</h3>`;
    html += `<div class="stat-card"><h4>Total de Pas Cumulés</h4><p>${totalSteps.toLocaleString()} pas</p><small>Moyenne : ${avgSteps.toLocaleString()} pas / jour enregistré</small></div>`;

    statsContent.innerHTML = html;
}

// --- SAUVEGARDE : EXPORT & IMPORT JSON ---
function exportData() {
    let workouts = localStorage.getItem('workouts') || '[]';
    let blob = new Blob([workouts], { type: 'application/json' });
    let url = URL.createObjectURL(blob);
    
    let a = document.createElement('a');
    let today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `floreal-fitness-sauvegarde-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedWorkouts = JSON.parse(e.target.result);
            if (Array.isArray(importedWorkouts)) {
                localStorage.setItem('workouts', JSON.stringify(importedWorkouts));
                loadHistory();
                renderStats();
                updateChart();
                alert("Sauvegarde importée avec succès ! 🎉");
            } else {
                alert("Le fichier choisi n'est pas valide.");
            }
        } catch (err) {
            alert("Erreur lors de la lecture du fichier de sauvegarde.");
        }
    };
    reader.readAsText(file);
}
