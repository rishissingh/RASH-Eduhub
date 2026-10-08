/**
 * RASH EduHub - AI Student Marks & Performance Predictor Controller
 * Manages interactive range sliders, AI calculation calls, and Chart.js animations.
 */

let strengthRadarChart = null;
let metricsBarChart = null;

document.addEventListener('DOMContentLoaded', () => {
   (async () => {
      // Guard: Only authenticated students can access predictor
      if (!await AuthService.guardRoute(['student'])) return;

      initSliderValueDisplays();
      initPredictorForm();
      // Run initial default prediction
      runPrediction();
   })();
});

/**
 * Sync Range Slider inputs with live numeric displays
 */
function initSliderValueDisplays() {
   const sliders = document.querySelectorAll('.predict-slider');
   sliders.forEach(slider => {
      const display = document.querySelector(`#val-${slider.id}`);
      if (display) {
         slider.addEventListener('input', () => {
            display.innerText = slider.value + (slider.dataset.unit || '');
         });
      }
   });
}

/**
 * Bind Predict Button Click
 */
function initPredictorForm() {
   const btn = document.querySelector('#run-predict-btn');
   if (btn) {
      btn.addEventListener('click', () => runPrediction());
   }
}

/**
 * Execute AI Prediction Calculation and Render Charts
 */
function runPrediction() {
   const studyHours = parseFloat(document.querySelector('#slider-study')?.value || 5);
   const attendance = parseFloat(document.querySelector('#slider-attendance')?.value || 85);
   const sleepHours = parseFloat(document.querySelector('#slider-sleep')?.value || 7);
   const midSemAvg = parseFloat(document.querySelector('#slider-midsem')?.value || 78);
   const assignmentScore = parseFloat(document.querySelector('#slider-assignment')?.value || 82);
   const cgpa = parseFloat(document.querySelector('#slider-cgpa')?.value || 8.0);
   const stressLevel = parseFloat(document.querySelector('#slider-stress')?.value || 2);

   const result = AIService.predictPerformance({
      studyHours,
      attendance,
      sleepHours,
      midSemAvg,
      assignmentScore,
      cgpa,
      stressLevel
   });

   renderPredictionResults(result);
   renderCharts(result);
}

/**
 * Render Numeric Results & Study Plan Recommendations
 */
function renderPredictionResults(res) {
   const scoreEl = document.querySelector('#res-predicted-score');
   const gradeEl = document.querySelector('#res-expected-grade');
   const probEl = document.querySelector('#res-pass-prob');
   const riskEl = document.querySelector('#res-risk-level');
   const recsContainer = document.querySelector('#res-recommendations');
   const planContainer = document.querySelector('#res-daily-plan');

   if (scoreEl) scoreEl.innerText = res.predictedMarks + '%';
   if (gradeEl) gradeEl.innerText = res.grade;
   if (probEl) probEl.innerText = res.passProbability + '%';
   if (riskEl) {
      riskEl.innerText = res.riskLevel;
      riskEl.className = `badge ${res.riskClass}`;
   }

   if (recsContainer) {
      recsContainer.innerHTML = res.recommendations.map(r => `
         <div style="display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem 1.5rem; background: var(--light-bg); border-radius: 1rem; margin-bottom: 1rem;">
            <i class="fas fa-lightbulb" style="color: var(--orange); font-size: 1.8rem;"></i>
            <span style="font-size: 1.4rem; color: var(--black);">${r}</span>
         </div>
      `).join('');
   }

   if (planContainer) {
      planContainer.innerHTML = res.dailyPlan.map(p => `
         <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.5rem; border-left: 4px solid var(--main-color); background: var(--white); border-radius: 0.8rem; margin-bottom: 1rem; box-shadow: var(--shadow);">
            <div>
               <strong style="font-size: 1.4rem; color: var(--black); display: block;">${p.task}</strong>
               <span style="font-size: 1.2rem; color: var(--light-color);">${p.time}</span>
            </div>
            <span class="badge badge-accent">Recommended</span>
         </div>
      `).join('');
   }
}

/**
 * Render Interactive Animated Chart.js Graphs
 */
function renderCharts(res) {
   if (typeof Chart === 'undefined') return;

   // 1. Radar Chart (Subject Strengths)
   const radarCtx = document.querySelector('#radar-chart-canvas')?.getContext('2d');
   if (radarCtx) {
      if (strengthRadarChart) strengthRadarChart.destroy();

      strengthRadarChart = new Chart(radarCtx, {
         type: 'radar',
         data: {
            labels: ['Theory Mastery', 'Practical Coding', 'Quiz Speed', 'Assignments'],
            datasets: [{
               label: 'Skill Proficiency',
               data: res.chartData.subjectStrengths,
               backgroundColor: 'rgba(252, 90, 65, 0.25)',
               borderColor: 'hsl(252, 90%, 65%)',
               pointBackgroundColor: 'hsl(252, 90%, 65%)',
               pointBorderColor: '#fff',
               borderWidth: 2
            }]
         },
         options: {
            responsive: true,
            scales: {
               r: {
                  min: 0,
                  max: 100,
                  ticks: { display: false }
               }
            }
         }
      });
   }

   // 2. Bar Chart (Metric Breakdown)
   const barCtx = document.querySelector('#bar-chart-canvas')?.getContext('2d');
   if (barCtx) {
      if (metricsBarChart) metricsBarChart.destroy();

      metricsBarChart = new Chart(barCtx, {
         type: 'bar',
         data: {
            labels: ['Study Hours', 'Attendance %', 'Mid-Sem Avg', 'Assignments %'],
            datasets: [{
               label: 'Metric Score',
               data: res.chartData.metricBreakdown,
               backgroundColor: [
                  'hsl(252, 90%, 65%)',
                  'hsl(190, 95%, 50%)',
                  'hsl(36, 95%, 55%)',
                  'hsl(145, 65%, 45%)'
               ],
               borderRadius: 8
            }]
         },
         options: {
            responsive: true,
            scales: {
               y: { beginAtZero: true, max: 100 }
            }
         }
      });
   }
}
