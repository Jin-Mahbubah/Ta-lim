document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Configuração do Supabase ---
    const supabaseUrl = 'https://notcolkgbaydijmupssz.supabase.co'; 
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdGNvbGtnYmF5ZGlqbXVwc3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAzMzUsImV4cCI6MjA3NTk5NjMzNX0.6z4JNcCQzrJvRWXZuFZKdxebaKX9HUWUOkv8KRjinK4';
    
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // --- 2. Lógica da Animação (Desktop & Mobile) ---
    const container = document.getElementById('container');
    
    // Botões Desktop (Painel Deslizante)
    const signUpGhostBtn = document.getElementById('signUpGhost');
    const signInGhostBtn = document.getElementById('signInGhost');
    
    // Links de Texto (Mobile)
    const mobileSignUpLink = document.getElementById('mobile-signup-link');
    const mobileSignInLink = document.getElementById('mobile-signin-link');

    // Função para ir para REGISTO (Deslizar para direita)
    function goToSignUp(e) {
        e.preventDefault();
        container.classList.add("right-panel-active");
        clearMessages();
    }

    // Função para ir para LOGIN (Deslizar para esquerda)
    function goToSignIn(e) {
        e.preventDefault();
        container.classList.remove("right-panel-active");
        clearMessages();
    }

    // Adiciona eventos de clique
    if(signUpGhostBtn) signUpGhostBtn.addEventListener('click', goToSignUp);
    if(signInGhostBtn) signInGhostBtn.addEventListener('click', goToSignIn);
    
    if(mobileSignUpLink) mobileSignUpLink.addEventListener('click', goToSignUp);
    if(mobileSignInLink) mobileSignInLink.addEventListener('click', goToSignIn);


    // --- 3. Lógica de Mostrar/Esconder Senha ---
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            // Encontra o input que está logo antes do ícone
            const passwordInput = this.previousElementSibling;
            if (passwordInput && passwordInput.classList.contains('password-input')) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                // Alterna o ícone
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            }
        });
    });


    // --- 4. Lógica de Autenticação (LOGIN & REGISTO) ---
    
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    // Login Event Listener
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const messageArea = document.getElementById('login-message');

            await handleAuth(loginBtn, messageArea, async () => {
                return await supabase.auth.signInWithPassword({ email, password });
            }, true); // true = é login
        });
    }

    // Registo Event Listener
    if(signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const messageArea = document.getElementById('signup-message');

            await handleAuth(signupBtn, messageArea, async () => {
                return await supabase.auth.signUp({
                    email, password,
                    options: { data: { full_name: name } }
                });
            }, false); // false = é registo
        });
    }

    // Função Genérica para tratar Login/Registo
    async function handleAuth(btn, msgArea, authFunction, isLogin) {
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        showMessage(msgArea, null); // Limpar mensagens

        try {
            const { data, error } = await authFunction();
            
            if (error) throw error;

            if (isLogin) {
                // Login com sucesso
                window.location.href = '/dashboard.html';
            } else {
                // Registo com sucesso
                if (data.user && !data.session) {
                    showMessage(msgArea, 'Sucesso! Verifique o seu email para confirmar.', 'success');
                    btn.disabled = false;
                    btn.innerText = originalText;
                } else {
                    // Se o login for automático após registo
                    window.location.href = '/dashboard.html';
                }
                if(signupForm) signupForm.reset();
            }
        } catch (error) {
            console.error("Erro de Autenticação:", error);
            let errorMsg = error.message;
            
            // Traduções simples de erros comuns
            if (errorMsg.includes("Invalid login credentials")) errorMsg = "Email ou senha incorretos.";
            if (errorMsg.includes("User already registered")) errorMsg = "Este email já está registado.";
            
            showMessage(msgArea, errorMsg, 'error');
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }

    function showMessage(element, text, type) {
        if (!element) return;
        
        if (!text) {
            element.classList.add('hidden');
            return;
        }
        element.textContent = text;
        // Remove classes antigas e adiciona as novas
        element.classList.remove('hidden', 'error', 'success');
        element.classList.add(type); // 'error' ou 'success'
    }

    function clearMessages() {
        document.querySelectorAll('.message-area').forEach(el => el.classList.add('hidden'));
    }
});