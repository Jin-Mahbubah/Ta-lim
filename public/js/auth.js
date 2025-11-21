document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Configuração do Supabase ---
    // Substitua pelos seus dados reais
    const supabaseUrl = 'https://notcolkgbaydijmupssz.supabase.co'; 
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdGNvbGtnYmF5ZGlqbXVwc3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAzMzUsImV4cCI6MjA3NTk5NjMzNX0.6z4JNcCQzrJvRWXZuFZKdxebaKX9HUWUOkv8KRjinK4';
    
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // --- 2. Elementos ---
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageEl = document.getElementById('error-message');
    const loginBtn = document.querySelector('.login-btn');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // --- 3. Lógica de Mostrar/Esconder Senha ---
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            // Alterna o tipo de input
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Alterna o ícone
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- 4. Função de Login ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        showError(null);
        setLoading(true);

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Sucesso!
            window.location.href = '/dashboard.html';

        } catch (error) {
            console.error('Erro no login:', error.message);
            showError('Email ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    });

    // --- 5. Funções de Ajuda ---
    
    function showError(message) {
        if (message) {
            errorMessageEl.textContent = message;
            errorMessageEl.classList.add('visible');
            errorMessageEl.classList.remove('hidden');
        } else {
            errorMessageEl.classList.remove('visible');
            errorMessageEl.classList.add('hidden');
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            loginBtn.style.opacity = '0.7';
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Entrar</span> <i class="fas fa-arrow-right"></i>';
            loginBtn.style.opacity = '1';
        }
    }
});