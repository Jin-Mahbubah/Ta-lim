document.addEventListener('DOMContentLoaded', () => {
    
    let countdownInterval = null;

    async function fetchPrayerTimes(latitude, longitude) {
        const prayerNameEl = document.getElementById('prayer-name');
        const prayerTimeEl = document.getElementById('prayer-time');
        const timeToNextEl = document.getElementById('time-to-next');
        const prayerIconEl = document.getElementById('prayer-icon');

        // Adiciona verificação de existência dos elementos
        if (!prayerNameEl || !prayerTimeEl || !timeToNextEl || !prayerIconEl) {
             console.error("Elementos do 'time-card' não encontrados no dashboard.html.");
             return;
        }

        try {
            async function getTimingsForDate(date, lat, lon) {
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                const apiUrl = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lon}&method=4`;
                
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Falha na resposta da rede para a data: ' + date);
                
                const data = await response.json();
                return data.data.timings;
            }

            const now = new Date();
            const todayTimings = await getTimingsForDate(now, latitude, longitude);
            
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
                const tomorrowTimings = await getTimingsForDate(tomorrow, latitude, longitude);

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
                    getLocation();
                    return;
                }

                let seconds = Math.floor(diffMs / 1000);
                let minutes = Math.floor(seconds / 60);
                let hours = Math.floor(minutes / 60);

                seconds %= 60;
                minutes %= 60;

                const pad = (num) => num.toString().padStart(2, '0');
                timeToNextEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} para o ${nextPrayerName}`;
            }, 1000);

            const icons = { 'Fajr': 'fa-sun', 'Dhuhr': 'fa-sun', 'Asr': 'fa-cloud-sun', 'Maghrib': 'fa-moon', 'Isha': 'fa-star-and-crescent' };
            prayerIconEl.className = `fas ${icons[currentPrayerName]}`;

        } catch (error) {
            console.error("Erro ao buscar horários das orações:", error);
            prayerNameEl.textContent = 'Erro de Rede';
            prayerTimeEl.innerHTML = '--:--';
            prayerIconEl.className = 'fas fa-exclamation-circle';
        }
    }

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    console.log("Localização não permitida. Usando Madinah.");
                    fetchPrayerTimes(24.4686, 39.6142); // Madinah
                }
            );
        } else {
            console.log("Geolocalização não suportada. Usando Madinah.");
            fetchPrayerTimes(24.4686, 39.6142); // Madinah
        }
    }
    getLocation();
});