document.addEventListener('DOMContentLoaded', () => {
    
    let countdownInterval = null;

    async function fetchPrayerTimes() {
        const prayerNameEl = document.getElementById('prayer-name');
        const prayerTimeEl = document.getElementById('prayer-time');
        const timeToNextEl = document.getElementById('time-to-next');
        const prayerIconEl = document.getElementById('prayer-icon');

        try {
            const city = 'Madinah', country = 'Saudi Arabia', method = 4;
            
            async function getTimingsForDate(date) {
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                const apiUrl = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${city}&country=${country}&method=${method}`;
                
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Falha na resposta da rede para a data: ' + date);
                
                const data = await response.json();
                return data.data.timings;
            }

            const now = new Date();
            const todayTimings = await getTimingsForDate(now);
            
            const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
            let nextPrayerName = null;
            let nextPrayerTime = null;
            let currentPrayerName = 'Isha';

            const todayPrayers = prayerOrder.map(prayer => {
                const [hour, minute] = todayTimings[prayer].split(':');
                const prayerDate = new Date();
                prayerDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
                return { name: prayer, time: prayerDate };
            });

            for (let i = 0; i < todayPrayers.length; i++) {
                if (todayPrayers[i].time > now) {
                    nextPrayerName = todayPrayers[i].name;
                    nextPrayerTime = todayPrayers[i].time;
                    currentPrayerName = (i > 0) ? todayPrayers[i - 1].name : 'Isha';
                    break;
                }
            }
            
            if (nextPrayerName === null) {
                const tomorrow = new Date();
                tomorrow.setDate(now.getDate() + 1);
                const tomorrowTimings = await getTimingsForDate(tomorrow);
                nextPrayerName = 'Fajr';
                const [fajrHour, fajrMinute] = tomorrowTimings.Fajr.split(':');
                const fajrDate = new Date(tomorrow);
                fajrDate.setHours(parseInt(fajrHour), parseInt(fajrMinute), 0, 0);
                nextPrayerTime = fajrDate;
                currentPrayerName = 'Isha';
            }
            
            const [currentHour, currentMinute] = todayTimings[currentPrayerName].split(':');
            prayerNameEl.textContent = currentPrayerName;
            prayerTimeEl.innerHTML = `${currentHour}:${currentMinute}`;

            if (countdownInterval) clearInterval(countdownInterval);

            countdownInterval = setInterval(() => {
                const nowForCountdown = new Date();
                const diffMs = nextPrayerTime - nowForCountdown;

                if (diffMs <= 0) {
                    timeToNextEl.textContent = "Atualizando...";
                    clearInterval(countdownInterval);
                    fetchPrayerTimes();
                    return;
                }

                let seconds = Math.floor(diffMs / 1000);
                let minutes = Math.floor(seconds / 60);
                let hours = Math.floor(minutes / 60);

                seconds = seconds % 60;
                minutes = minutes % 60;

                const pad = (num) => num.toString().padStart(2, '0');
                timeToNextEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} para o ${nextPrayerName}`;
            }, 1000);

            // ✨ LÓGICA DOS ÍCONES MELHORADA ✨
            const icons = {
                'Fajr': 'fa-sun',        // Sol da manhã / Nascer do sol
                'Dhuhr': 'fa-sun',       // Sol do meio-dia (forte)
                'Asr': 'fa-cloud-sun',   // Sol da tarde (entre nuvens)
                'Maghrib': 'fa-moon',      // Pôr do sol / Início da noite
                'Isha': 'fa-moon'        // Noite
            };
            // Define a classe do ícone com base no nome da oração atual
            prayerIconEl.className = `fas ${icons[currentPrayerName]}`;

        } catch (error) {
            console.error("Erro ao buscar horários das orações:", error);
            prayerNameEl.textContent = 'Erro de Rede';
            prayerTimeEl.innerHTML = '--:--';
            prayerIconEl.className = 'fas fa-exclamation-circle';
        }
    }

    fetchPrayerTimes();
});