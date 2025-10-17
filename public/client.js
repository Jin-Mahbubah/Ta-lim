document.addEventListener('DOMContentLoaded', () => {
    
    let countdownInterval = null;

    // Função principal que busca os horários
    async function fetchPrayerTimes(latitude, longitude) {
        // ... (elementos do HTML como antes)
        const prayerNameEl = document.getElementById('prayer-name');
        const prayerTimeEl = document.getElementById('prayer-time');
        const timeToNextEl = document.getElementById('time-to-next');
        const prayerIconEl = document.getElementById('prayer-icon');

        try {
            // ✨ ALTERADO: O URL da API agora usa coordenadas geográficas
            const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=4`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            
            const data = await response.json();
            const timings = data.data.timings;
            
            // O resto da lógica para calcular e mostrar a oração permanece o mesmo
            const now = new Date();
            const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
            let nextPrayerName = null, nextPrayerTime = null, currentPrayerName = 'Isha';

            const todayPrayers = prayerOrder.map(prayer => {
                const [hour, minute] = timings[prayer].split(':');
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
                // A lógica para o dia seguinte é mais complexa com geolocalização, 
                // por agora vamos simplificar e apenas recarregar no minuto seguinte
                currentPrayerName = 'Isha';
                nextPrayerName = 'Fajr';
            }
            
            const [currentHour, currentMinute] = timings[currentPrayerName].split(':');
            prayerNameEl.textContent = currentPrayerName;
            prayerTimeEl.innerHTML = `${currentHour}:${currentMinute}`;

            if (countdownInterval) clearInterval(countdownInterval);

            // A lógica da contagem regressiva permanece a mesma
            if(nextPrayerTime) {
                countdownInterval = setInterval(() => {
                    const nowForCountdown = new Date();
                    const diffMs = nextPrayerTime - nowForCountdown;

                    if (diffMs <= 0) {
                        timeToNextEl.textContent = "Atualizando...";
                        clearInterval(countdownInterval);
                        getLocation(); // Recarrega tudo
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
            } else {
                 timeToNextEl.textContent = `Aguardando o Fajr...`;
            }

            const icons = { 'Fajr': 'fa-sun', 'Dhuhr': 'fa-sun', 'Asr': 'fa-cloud-sun', 'Maghrib': 'fa-moon', 'Isha': 'fa-star-and-crescent' };
            prayerIconEl.className = `fas ${icons[currentPrayerName]}`;

        } catch (error) {
            console.error("Erro ao buscar horários das orações:", error);
            prayerNameEl.textContent = 'Erro';
            prayerTimeEl.innerHTML = '--:--';
            prayerIconEl.className = 'fas fa-exclamation-circle';
        }
    }

    // ✨ NOVA FUNÇÃO: Pede a localização ao utilizador
    function getLocation() {
        if (navigator.geolocation) {
            // Se o navegador suportar geolocalização
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // SUCESSO: O utilizador permitiu. Usamos as coordenadas reais.
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    fetchPrayerTimes(lat, lon);
                },
                () => {
                    // ERRO/RECUSA: O utilizador não permitiu. Usamos a localização padrão.
                    console.log("Utilizador não permitiu a localização. A usar Madinah como padrão.");
                    fetchPrayerTimes(24.4686, 39.6142); // Coordenadas de Madinah
                }
            );
        } else {
            // O navegador não suporta geolocalização. Usamos a localização padrão.
            console.log("Geolocalização não é suportada por este navegador. A usar Madinah como padrão.");
            fetchPrayerTimes(24.4686, 39.6142); // Coordenadas de Madinah
        }
    }

    // Iniciar todo o processo
    getLocation();
});