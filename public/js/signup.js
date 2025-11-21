document.addEventListener('DOMContentLoaded', () => {
    
    // Configuração do Supabase (Suas chaves)
    const supabaseUrl = 'https://notcolkgbaydijmupssz.supabase.co'; 
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdGNvbGtnYmF5ZGlqbXVwc3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAzMzUsImV4cCI6MjA3NTk5NjMzNX0.6z4JNcCQzrJvRWXZuFZKdxebaKX9HUWUOkv8KRjinK4';
    
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const signupForm = document.getElementById('signup-form');
    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageArea = document.getElementById('message-area');
    const signupBtn = document.querySelector('.login-btn');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage(null);
        setLoading(true);

        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            // Tenta criar o utilizador
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { full_name: name }, // Salva o nome
                },
            });

            if (error) throw error;

            // Sucesso
            showMessage('Conta criada! Verifique seu email para confirmar.', 'success');
            
            // Opcional: Limpar formulário
            signupForm.reset();

        } catch (error) {
            console.error('Erro:', error.message);
            showMessage(error.message, 'error');
        } finally {
            setLoading(false);
        }
    });
    
    function showMessage(text, type = 'error') {
        if (text) {
            messageArea.textContent = text;
            messageArea.classList.remove('hidden');
            // Estilos simples para feedback
            messageArea.style.padding = '10px';
            messageArea.style.borderRadius = '10px';
            messageArea.style.marginBottom = '15px';
            messageArea.style.fontSize = '0.9rem';
            
            if (type === 'error') {
                messageArea.style.backgroundColor = '#fde2e4';
                messageArea.style.color = '#e74c3c';
                messageArea.style.border = '1px solid #fab1b1';
            } else {
                messageArea.style.backgroundColor = '#d1f7e8';
                messageArea.style.color = '#1a6a4a';
                messageArea.style.border = '1px solid #28a745';
            }
        } else {
            messageArea.classList.add('hidden');
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            signupBtn.disabled = true;
            signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
            signupBtn.style.opacity = '0.7';
        } else {
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<span>Criar Conta</span> <i class="fas fa-arrow-right"></i>';
            signupBtn.style.opacity = '1';
        }
    }
});