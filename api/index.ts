import { createClient } from "@supabase/supabase-js";
import express from "express";
import cors from "cors";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// Rota para buscar clientes (empresas)
app.get("/api/clientes", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("clientes")
            .select("nome_empresa")
            .order("nome_empresa", { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        res.status(500).json({ error: (error as Error).message });
    }
});

// Rota para buscar relatórios
app.get("/api/relatorios", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("disparos")
            .select("*")
            .order("data", { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Rota para salvar disparo
app.post("/api/disparos", async (req, res) => {
    try {
        const { nome_campanha, nome, numero, status, empresa } = req.body;
        const { data, error } = await supabase
            .from("disparos")
            .insert([{
                nome_campanha,
                nome,
                numero,
                status,
                empresa,
                data: new Date().toISOString()
            }]);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default app;
