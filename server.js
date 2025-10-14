require('dotenv').config(); // Carrega as variáveis do ficheiro .env
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Carrega as chaves do Supabase a partir do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Cria a "ponte" de ligação com o Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.static('public'));

// A nossa API agora vai buscar as perguntas ao Supabase
app.get('/api/question', async (req, res) => {
    try {
        // Obter o número total de perguntas
        const { count, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        // Gerar um índice aleatório
        const randomIndex = Math.floor(Math.random() * count);

        // Buscar a pergunta nesse índice aleatório
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .range(randomIndex, randomIndex)
            .single();

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Erro ao buscar pergunta do Supabase:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
});